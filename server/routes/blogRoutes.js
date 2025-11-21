const express = require('express');
const {
  getBlogs,
  getBlogById,
  getFeaturedBlogs,
  getBlogsByTag,
  createBlog,
  updateBlog,
  deleteBlog,
  toggleFeatured,
  toggleStatus,
  getBlogStats
} = require('../controllers/blogController.js');
const { verifyAdmin } = require('../middleware/authMiddleware.js');

const router = express.Router();

// Public routes
router.get('/', getBlogs);
router.get('/featured', getFeaturedBlogs);
router.get('/tag/:tag', getBlogsByTag);
router.get('/:id', getBlogById);

// Admin protected routes
router.post('/', verifyAdmin, createBlog);
router.put('/:id', verifyAdmin, updateBlog);
router.delete('/:id', verifyAdmin, deleteBlog);
router.patch('/:id/featured', verifyAdmin, toggleFeatured);
router.patch('/:id/status', verifyAdmin, toggleStatus);
router.get('/admin/stats', verifyAdmin, getBlogStats);

module.exports = router;