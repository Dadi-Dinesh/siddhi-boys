const path = require('path');
const multer = require('multer');
const { AppError } = require('./response');
const {
  cloudinary,
  isCloudinaryConfigured,
  configureCloudinary,
} = require('../config/cloudinary');

const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB: Vercel refuses request bodies over 4.5 MB
const SCREENSHOT_FOLDER = 'siddhiboys/payment-screenshots';
const PROFILE_FOLDER = 'siddhiboys/profiles';

// Logs useful diagnostic information without exposing secrets.
function uploadError(kind, err, file) {
  const reason = err?.error?.message || err?.message || 'No response from Cloudinary';
  const code = err?.error?.http_code || err?.http_code || null;
  const fileExists = Boolean(file && (file.buffer || file.size));
  const mimetype = file?.mimetype || 'unknown';
  const sizeBytes = file?.size ?? file?.buffer?.length ?? 0;

  console.error(`[Upload Diagnostic] Cloudinary ${kind} upload failed:`, {
    error: reason,
    httpStatus: code,
    fileExists,
    mimetype,
    sizeBytes,
  });

  // 401 = Cloudinary rejected credentials
  if (code === 401) {
    return new AppError('Cloudinary credentials rejected by server. Please check Cloudinary configuration.', 503);
  }
  return new AppError(`Could not upload the ${kind}. Please try again.`, 502);
}

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_MIMES.has(file.mimetype) || !ALLOWED_EXTS.has(ext)) {
    return cb(new AppError('Only JPEG, PNG, and WebP images are allowed', 400));
  }
  cb(null, true);
};

// The file is kept in memory only; never written to local disk.
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
});

// Shared in-memory upload helper for serverless/Vercel safety
async function uploadBufferToCloudinary(file, options, kind) {
  if (!file || !file.buffer || !file.buffer.length) {
    throw new AppError('No image file was provided.', 400);
  }

  // Ensures credentials are configured, or throws 503 "Cloudinary is not configured on the server."
  configureCloudinary();

  try {
    const b64 = Buffer.from(file.buffer).toString('base64');
    const dataUri = `data:${file.mimetype || 'image/jpeg'};base64,${b64}`;
    const result = await cloudinary.uploader.upload(dataUri, options);
    if (!result?.secure_url) {
      throw new Error('No secure_url returned from Cloudinary');
    }
    return result.secure_url;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw uploadError(kind, err, file);
  }
}

// Uploads a payment screenshot to Cloudinary and returns its URL.
// type "authenticated" means the image is NOT publicly listed: only the signed URL can access it.
async function uploadScreenshotToCloudinary(file) {
  return uploadBufferToCloudinary(
    file,
    {
      folder: SCREENSHOT_FOLDER,
      type: 'authenticated',
      resource_type: 'image',
    },
    'screenshot',
  );
}

// Downloads a stored screenshot (server side) so it can be streamed to a logged-in user.
async function fetchScreenshot(url) {
  if (typeof url !== 'string' || !url.startsWith('https://res.cloudinary.com/')) {
    throw new AppError('Screenshot image not found', 404);
  }
  let response;
  try {
    response = await fetch(url);
  } catch {
    throw new AppError('Could not load the screenshot. Please try again.', 502);
  }
  if (!response.ok) throw new AppError('Screenshot image not found', 404);
  return {
    contentType: response.headers.get('content-type') || 'image/jpeg',
    body: Buffer.from(await response.arrayBuffer()),
  };
}

// Uploads a member's profile photo to Cloudinary (resized to max 400×400) and returns its URL.
async function uploadProfilePhotoToCloudinary(file) {
  return uploadBufferToCloudinary(
    file,
    {
      folder: PROFILE_FOLDER,
      resource_type: 'image',
      transformation: [{ width: 400, height: 400, crop: 'limit' }],
    },
    'profile photo',
  );
}

// Deletes a replaced/removed profile photo from Cloudinary. Only images in our own profile
// folder are ever deleted. A failure here never blocks saving the member.
async function deleteCloudinaryImage(url) {
  if (typeof url !== 'string' || !isCloudinaryConfigured()) return;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.[a-zA-Z0-9]+$/);
  if (!match || !match[1].startsWith(`${PROFILE_FOLDER}/`)) return;
  try {
    configureCloudinary();
    await cloudinary.uploader.destroy(match[1]);
  } catch {
    // The old image stays on Cloudinary; nothing else is affected.
  }
}

module.exports = {
  uploadScreenshot: upload.single('screenshot'),
  uploadScreenshotToCloudinary,
  fetchScreenshot,
  uploadProfilePhoto: upload.single('photo'), // JSON requests without a file pass straight through
  uploadProfilePhotoToCloudinary,
  deleteCloudinaryImage,
};


