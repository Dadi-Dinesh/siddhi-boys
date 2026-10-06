const memberService = require('../services/memberService');
const { sendSuccess } = require('../utils/response');

// GET /api/members?search=&includeInactive=true
async function list(req, res) {
  sendSuccess(res, await memberService.listMembers(req.query), 'Members fetched successfully');
}

// GET /api/members/:id
async function getOne(req, res) {
  sendSuccess(res, await memberService.getMember(req.params.id), 'Member fetched successfully');
}

// POST /api/members
async function create(req, res) {
  const member = await memberService.createMember(req.body || {});
  sendSuccess(res, member, 'Member added successfully', 201);
}

// PUT /api/members/:id
async function update(req, res) {
  const member = await memberService.updateMember(req.params.id, req.body || {});
  sendSuccess(res, member, 'Member updated successfully');
}

// DELETE /api/members/:id  → deactivates, never deletes
async function deactivate(req, res) {
  const member = await memberService.setActive(req.params.id, false);
  sendSuccess(res, member, 'Member deactivated successfully');
}

// PATCH /api/members/:id/activate
async function activate(req, res) {
  const member = await memberService.setActive(req.params.id, true);
  sendSuccess(res, member, 'Member reactivated successfully');
}

module.exports = { list, getOne, create, update, deactivate, activate };
