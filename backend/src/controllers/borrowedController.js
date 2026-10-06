const borrowedService = require('../services/borrowedService');
const { sendSuccess } = require('../utils/response');

// GET /api/borrowed  (any logged-in user, read-only)
async function list(req, res) {
  sendSuccess(res, await borrowedService.listBorrowed(), 'Borrowed records fetched successfully');
}

// GET /api/borrowed/:id
async function getOne(req, res) {
  sendSuccess(res, await borrowedService.getBorrowed(req.params.id), 'Borrowed record fetched successfully');
}

// POST /api/borrowed  { memberId, amount, borrowedAt, purpose }
async function create(req, res) {
  const record = await borrowedService.createBorrowed(req.body || {});
  sendSuccess(res, record, 'Borrowed amount recorded successfully', 201);
}

// PATCH /api/borrowed/:id/return  { returnedAt }
async function markReturned(req, res) {
  const record = await borrowedService.markReturned(req.params.id, req.body || {});
  sendSuccess(res, record, 'Marked as returned');
}

// DELETE /api/borrowed/:id
async function remove(req, res) {
  await borrowedService.deleteBorrowed(req.params.id);
  sendSuccess(res, null, 'Borrowed record deleted');
}

module.exports = { list, getOne, create, markReturned, remove };
