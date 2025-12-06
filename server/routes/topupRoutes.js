const express = require('express');
const router = express.Router();
const {
  getTopupPackages,
  getFeaturedTopups,
  getTopupPackagesAdmin,
  createTopupPackage,
  updateTopupPackage,
  deleteTopupPackage,
  initializeDefaultTopups,
} = require('../controllers/topupController');

// Import middleware
const { protect, verifyAdmin } = require('../middleware/authMiddleware');

// ====================
// PUBLIC ROUTES
// ====================
router.get('/', getTopupPackages);
router.get('/featured', getFeaturedTopups);

// ====================
// ADMIN ROUTES
// ====================
router.get('/admin/packages', protect, verifyAdmin, getTopupPackagesAdmin);
router.post('/admin', protect, verifyAdmin, createTopupPackage);
router.put('/admin/:id', protect, verifyAdmin, updateTopupPackage);
router.delete('/admin/:id', protect, verifyAdmin, deleteTopupPackage);
router.post('/admin/initialize/defaults', protect, verifyAdmin, initializeDefaultTopups);


module.exports = router;