const path = require('path');
const { Readable } = require('stream');
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
const MEMBER_PHOTO_FOLDER = 'siddhi-boys/members';

// Logs useful diagnostic information without exposing secrets.
function uploadError(kind, err, file) {
  const cloudNameConfigured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME ||
    (process.env.CLOUDINARY_URL && process.env.CLOUDINARY_URL.includes('@'))
  );
  const apiKeyConfigured = Boolean(
    process.env.CLOUDINARY_API_KEY ||
    (process.env.CLOUDINARY_URL && process.env.CLOUDINARY_URL.startsWith('cloudinary://'))
  );
  const apiSecretConfigured = Boolean(
    process.env.CLOUDINARY_API_SECRET ||
    (process.env.CLOUDINARY_URL && process.env.CLOUDINARY_URL.includes(':'))
  );

  const errorMessage = err?.message || err?.error?.message || 'No response from Cloudinary';
  const errorName = err?.name || err?.error?.name || 'Error';
  const errorCode = err?.code || err?.error?.code || null;
  const cloudinaryHttpStatus = err?.http_code || err?.error?.http_code || null;
  const fileExists = Boolean(file && (file.buffer || file.size));
  const mimetype = file?.mimetype || 'unknown';
  const sizeBytes = file?.size ?? file?.buffer?.length ?? 0;

  console.error(`[Upload Diagnostic] Cloudinary ${kind} upload failed:`, {
    errorMessage,
    errorName,
    errorCode,
    cloudinaryHttpStatus,
    fileExists,
    mimetype,
    sizeBytes,
    cloudNameConfigured,
    apiKeyConfigured,
    apiSecretConfigured,
  });

  // 401 or 403: Cloudinary credentials or authorization rejected
  if (cloudinaryHttpStatus === 401 || cloudinaryHttpStatus === 403) {
    return new AppError('Cloudinary authentication failed: invalid API key, secret, or cloud name. Please check Cloudinary settings in Vercel.', 500);
  }

  // 400: Cloudinary rejected file or parameters
  if (cloudinaryHttpStatus === 400) {
    return new AppError(`Cloudinary rejected the ${kind}: ${errorMessage}`, 400);
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

// Shared in-memory upload helper using Cloudinary upload_stream for serverless/Vercel safety
function uploadBufferToCloudinary(file, options, kind) {
  if (!file || !file.buffer || !file.buffer.length) {
    throw new AppError('No image file was provided.', 400);
  }

  // Ensures credentials are configured, or throws 500 "Cloudinary is not configured on the server."
  configureCloudinary();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (err, result) => {
        if (err || !result?.secure_url) {
          const formattedErr = uploadError(kind, err, file);
          return reject(formattedErr);
        }
        resolve(result.secure_url);
      }
    );

    uploadStream.on('error', (err) => {
      const formattedErr = uploadError(kind, err, file);
      reject(formattedErr);
    });

    Readable.from(file.buffer).pipe(uploadStream);
  });
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

// Uploads a member's profile photo to Cloudinary and returns its URL.
async function uploadProfilePhotoToCloudinary(file) {
  return uploadBufferToCloudinary(
    file,
    {
      folder: MEMBER_PHOTO_FOLDER,
      resource_type: 'image',
    },
    'profile photo',
  );
}

// Deletes a replaced/removed profile photo from Cloudinary. Only images in our own profile
// folders are ever deleted. A failure here never blocks saving the member.
async function deleteCloudinaryImage(url) {
  if (typeof url !== 'string' || !isCloudinaryConfigured()) return;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.[a-zA-Z0-9]+$/);
  if (!match || !match[1]) return;
  try {
    configureCloudinary();
    await cloudinary.uploader.destroy(match[1]);
  } catch (err) {
    // Non-fatal: old image could not be removed
    console.warn('[Upload Cleanup] Could not delete old Cloudinary image:', err?.message || err);
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


