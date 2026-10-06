const prisma = require('../config/prisma');
const { hashPassword } = require('../utils/password');
const { AppError } = require('../utils/response');
const validate = require('../utils/validate');
const { getMemberTotals } = require('./summaryService');
const { formatContribution } = require('./contributionService');

// Fields returned for a member. The password is never selected.
const memberSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
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

async function createMember(body) {
  const data = {
    name: validate.text(body.name, 'Name'),
    email: validate.email(body.email),
    phone: validate.phone(body.phone),
  };
  const plainPassword = validate.password(body.password);
  await ensureEmailIsFree(data.email);

  // Role is always MEMBER here, whatever the request body says.
  return prisma.user.create({
    data: { ...data, role: 'MEMBER', password: await hashPassword(plainPassword) },
    select: memberSelect,
  });
}

// Only the fields that are sent get updated. Role can never be changed here.
async function updateMember(id, body) {
  await findMemberOrFail(id);
  const data = {};

  if (body.name !== undefined) data.name = validate.text(body.name, 'Name');
  if (body.email !== undefined) {
    data.email = validate.email(body.email);
    await ensureEmailIsFree(data.email, id);
  }
  if (body.phone !== undefined) data.phone = validate.phone(body.phone);
  if (body.isActive !== undefined) data.isActive = validate.boolean(body.isActive, 'isActive');
  if (body.password !== undefined && body.password !== '') {
    data.password = await hashPassword(validate.password(body.password));
  }

  if (Object.keys(data).length === 0) throw new AppError('Nothing to update');

  return prisma.user.update({ where: { id }, data, select: memberSelect });
}

// "Deleting" a member only deactivates them. Their contribution history stays,
// so past totals never change. They also can no longer log in.
async function setActive(id, isActive) {
  await findMemberOrFail(id);
  return prisma.user.update({ where: { id }, data: { isActive }, select: memberSelect });
}

module.exports = { listMembers, getMember, createMember, updateMember, setActive };
