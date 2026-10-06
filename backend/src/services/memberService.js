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
  phone: true,
  phoneNumber: true,
  profileImageUrl: true,
  role: true,
  isActive: true,
  createdAt: true,
};

function formatMember(user) {
  if (!user) return null;
  const phoneVal = user.phoneNumber || user.phone || null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: phoneVal,
    phoneNumber: phoneVal,
    profileImageUrl: user.profileImageUrl || null,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

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
  return { items: items.map(formatMember), total: items.length };
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
  return { member: formatMember(member), summary, paymentHistory: history.map(formatContribution) };
}

// Members log in with their email. Their username is the part before "@",
// and their first password is always "<username>@123", e.g. rahul@gmail.com → rahul@123.
function defaultPasswordFor(email) {
  return `${email.split('@')[0]}@123`;
}

async function createMember(body, file) {
  const phoneInput = body.phoneNumber || body.phone;
  const validatedPhone = validate.phoneNumber(phoneInput, { required: true });

  const data = {
    name: validate.text(body.name, 'Name'),
    email: validate.email(body.email),
    phone: validatedPhone,
    phoneNumber: validatedPhone,
  };
  await ensureEmailIsFree(data.email);

  if (file) {
    data.profileImageUrl = await uploadProfilePhotoToCloudinary(file);
  } else if (body.profileImageUrl && typeof body.profileImageUrl === 'string') {
    data.profileImageUrl = body.profileImageUrl.trim();
  }

  // Role is always MEMBER here, whatever the request body says.
  // Only the bcrypt hash of the default password is stored.
  const created = await prisma.user.create({
    data: { ...data, role: 'MEMBER', password: await hashPassword(defaultPasswordFor(data.email)) },
    select: memberSelect,
  });

  return formatMember(created);
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

  const phoneInput = body.phoneNumber !== undefined ? body.phoneNumber : body.phone;
  if (phoneInput !== undefined) {
    const validatedPhone = validate.phoneNumber(phoneInput, { required: false });
    data.phone = validatedPhone;
    data.phoneNumber = validatedPhone;
  }

  if (body.isActive !== undefined) data.isActive = validate.boolean(body.isActive, 'isActive');
  if (body.password !== undefined && body.password !== '') {
    data.password = await hashPassword(validate.password(body.password));
  }

  if (file) {
    const newUrl = await uploadProfilePhotoToCloudinary(file);
    if (newUrl) {
      if (current.profileImageUrl && current.profileImageUrl !== newUrl) {
        await deleteCloudinaryImage(current.profileImageUrl);
      }
      data.profileImageUrl = newUrl;
    }
  } else if (body.removePhoto === 'true' || body.removePhoto === true) {
    if (current.profileImageUrl) {
      await deleteCloudinaryImage(current.profileImageUrl);
    }
    data.profileImageUrl = null;
  } else if (body.profileImageUrl !== undefined) {
    data.profileImageUrl = body.profileImageUrl ? String(body.profileImageUrl).trim() : null;
  }

  if (Object.keys(data).length === 0) throw new AppError('Nothing to update');

  const updated = await prisma.user.update({ where: { id }, data, select: memberSelect });
  return formatMember(updated);
}

// "Deleting" a member only deactivates them. Their contribution history stays,
// so past totals never change. They also can no longer log in.
async function setActive(id, isActive) {
  await findMemberOrFail(id);
  const updated = await prisma.user.update({ where: { id }, data: { isActive }, select: memberSelect });
  return formatMember(updated);
}

module.exports = { listMembers, getMember, createMember, updateMember, setActive };

