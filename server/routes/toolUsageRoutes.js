// server/routes/toolUsageRoutes.js
const express = require('express');
const router = express.Router();
const { getToolUsageStats } = require('../controllers/toolUsageController');
const { protect } = require('../middleware/authMiddleware');

// Get tool usage statistics for current user
router.get('/stats', protect, getToolUsageStats);

module.exports = router;