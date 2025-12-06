const express = require('express');
const router = express.Router();
const { checkLimits } = require('../utils/checkLimits');
const { verifyToken } = require('../middleware/authMiddleware');

// Check limits for a specific feature
router.post('/check', verifyToken, async (req, res) => {
  try {
    const { feature, fileSize } = req.body;
    const result = await checkLimits(req.user._id, feature, fileSize || 0);
    res.json(result);
  } catch (error) {
    console.error('Check limits error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;