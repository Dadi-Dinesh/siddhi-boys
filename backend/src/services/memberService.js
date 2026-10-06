const prisma = require('../config/prisma');
const { hashPassword } = require('../utils/password');
const { AppError } = require('../utils/response');
const validate = require('../utils/validate');
const { uploadProfilePhotoToCloudinary, deleteCloudinaryImage } = require('../utils/upload');
const { getMemberTotals } = require('./summaryService');
const { formatContribution } = require('./contributionService');

// Fields returned for a member. The password is never selected.
const memberSelect = {
  id: true,
  name: true,
  email: true,
  phoneNumber: true,
  profileImageUrl: true,
  role: true,
  isActive: true,
  createdAt: true,
};

// This API only manages MEMBER accounts, so an admin account can't be
// edited or deactivated through it by mistake.
async function findMemberOrFail(id) {
  validate.id(id, 'Member');
  const member = await prisma.user.findFirst({ where: { id, role: 'MEMBER' }, select: memberSelect });
  if (!member) throw new AppError('Member not found', 404);
  return member;
}

async function ensureEmailIsFree(email, exceptId) {
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing && existing.id !== exceptId) {
    throw new AppError('A member with this email already exists', 409);
  }
}

// ?search=rahul matches name or email. ?includeInactive=true also lists deactivated members.
async function listMembers({ search, includeInactive }) {
  const term = validate.search(search);
  const where = { role: 'MEMBER' };
  if (includeInactive !== 'true') where.isActive = true;
  if (term) {
    where.OR = [
      { name: { contains: term, mode: 'insensitive' } },
      { email: { contains: term, mode: 'insensitive' } },
    ];
  }
  const items = await prisma.user.findMany({ where, select: memberSelect, orderBy: { name: 'asc' } });
  return { items, total: items.length };
}

async function getMember(id) {
  const member = await findMemberOrFail(id);
  const [summary, history] = await Promise.all([
    getMemberTotals(id),
    prisma.monthlyContribution.findMany({
      where: { userId: id },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    }),
  ]);
  return { member, summary, paymentHistory: history.map(formatContribution) };
}

// Members log in with their email. Their username is the part before "@",
// and their first password is always "<username>@123", e.g. rahul@gmail.com → rahul@123.
function defaultPasswordFor(email) {
  return `${email.split('@')[0]}@123`;
}

// Multipart forms (sent when a photo is attached) turn true/false into "true"/"false".
function booleanField(value, field) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return validate.boolean(value, field);
}

async function createMember(body, file) {
  const data = {
    name: validate.text(body.name, 'Name'),
    email: validate.email(body.email),
    phoneNumber: validate.phoneNumber(body.phoneNumber, { required: true }),
  };
  await ensureEmailIsFree(data.email);

  // Only an uploaded file can set the photo, never a URL sent by the browser.
  if (file) data.profileImageUrl = await uploadProfilePhotoToCloudinary(file);

  // Role is always MEMBER here, whatever the request body says.
  // Only the bcrypt hash of the default password is stored.
  return prisma.user.create({
    data: { ...data, role: 'MEMBER', password: await hashPassword(defaultPasswordFor(data.email)) },
    select: memberSelect,
  });
}

// Only the fields that are sent get updated. Role can never be changed here.
async function updateMember(id, body, file) {
  const current = await findMemberOrFail(id);
  const data = {};

  if (body.name !== undefined) data.name = validate.text(body.name, 'Name');
  if (body.email !== undefined) {
    data.email = validate.email(body.email);
    await ensureEmailIsFree(data.email, id);
  }

  if (body.phoneNumber !== undefined) data.phoneNumber = validate.phoneNumber(body.phoneNumber);
  if (body.isActive !== undefined) data.isActive = booleanField(body.isActive, 'isActive');
  if (body.password !== undefined && body.password !== '') {
    data.password = await hashPassword(validate.password(body.password));
  }

  // Only an uploaded file can set the photo, never a URL sent by the browser.
  const removePhoto = body.removePhoto !== undefined && booleanField(body.removePhoto, 'removePhoto');
  if (file) data.profileImageUrl = await uploadProfilePhotoToCloudinary(file);
  else if (removePhoto) data.profileImageUrl = null;

  if (Object.keys(data).length === 0) throw new AppError('Nothing to update');

  const updated = await prisma.user.update({ where: { id }, data, select: memberSelect });
  // The old photo is removed from Cloudinary only after the new details are saved.
  if (data.profileImageUrl !== undefined && current.profileImageUrl) await deleteCloudinaryImage(current.profileImageUrl);
  return updated;
}

// "Deleting" a member only deactivates them. Their contribution history stays,
// so past totals never change. They also can no longer log in.
async function setActive(id, isActive) {
  await findMemberOrFail(id);
  return prisma.user.update({ where: { id }, data: { isActive }, select: memberSelect });
}

module.exports = { listMembers, getMember, createMember, updateMember, setActive };

