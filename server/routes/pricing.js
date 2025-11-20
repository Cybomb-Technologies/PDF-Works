const express = require('express');
const router = express.Router();

// Import controller functions
const {
  getPricingPlans,
  getPricingPlansAdmin,
  getPricingPlan,
  createPricingPlan,
  updatePricingPlan,
  deletePricingPlan,
  initializeDefaultPlans
} = require('../controllers/pricingController');

// Import middleware (if you have auth middleware)
// const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getPricingPlans);
router.get('/:id', getPricingPlan);

// Admin routes
// For now, making them public for testing. Add auth middleware later
router.get('/admin/all', getPricingPlansAdmin);
router.post('/', createPricingPlan);
router.put('/:id', updatePricingPlan);
router.delete('/:id', deletePricingPlan);
router.post('/initialize/defaults', initializeDefaultPlans);

// If you have auth middleware, use it like this:
// router.get('/admin/all', protect, admin, getPricingPlansAdmin);
// router.post('/', protect, admin, createPricingPlan);
// router.put('/:id', protect, admin, updatePricingPlan);
// router.delete('/:id', protect, admin, deletePricingPlan);
// router.post('/initialize/defaults', protect, admin, initializeDefaultPlans);

module.exports = router;