const settingsService = require('../services/settingsService');
const { sendSuccess } = require('../utils/response');

// GET /api/settings
async function get(req, res) {
  sendSuccess(res, await settingsService.readSettings(), 'Settings fetched successfully');
}

// PATCH /api/settings  { groupName?, monthlyContribution? }
async function update(req, res) {
  sendSuccess(res, await settingsService.updateSettings(req.body || {}), 'Settings updated successfully');
}

module.exports = { get, update };
