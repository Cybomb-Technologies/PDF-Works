const Blog = require('../models/Blog.js');

// Get all blogs (Public)
const getBlogs = async (req, res) => {
  try {
    const { featured, tag, search, page = 1, limit = 10, status = 'published' } = req.query;
    
    // Build query object
    let query = { status };
    
    // Filter by featured
    if (featured === 'true') {
      query.featured = true;
    }
    
    // Filter by tag
    if (tag) {
      query.tags = { $in: [tag] };
    }
    
    // Search in title, content, and tags
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    const blogs = await Blog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    // Get total count for pagination
    const total = await Blog.countDocuments(query);
    
    res.json({
      success: true,
      data: blogs,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get single blog by ID (Public)
const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    // Increment view count
    blog.views += 1;
    await blog.save();
    
    res.json({
      success: true,
      data: blog
    });
  } catch (error) {
    console.error('Get blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get featured blogs (Public)
const getFeaturedBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ featured: true, status: 'published' })
      .sort({ createdAt: -1 })
      .limit(3);
    
    res.json({
      success: true,
      data: blogs
    });
  } catch (error) {
    console.error('Get featured blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get blogs by tag (Public)
const getBlogsByTag = async (req, res) => {
  try {
    const { tag } = req.params;
    const blogs = await Blog.find({ 
      tags: { $in: [tag] },
      status: 'published'
    }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: blogs,
      tag
    });
  } catch (error) {
    console.error('Get blogs by tag error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Create new blog (Admin only)
const createBlog = async (req, res) => {
  try {
    const { title, content, author, tags, image, readTime, featured, status = 'published' } = req.body;
    
    // Validate required fields
    if (!title || !content || !author) {
      return res.status(400).json({
        success: false,
        message: 'Title, content, and author are required fields'
      });
    }
    
    // Calculate read time if not provided (approx 200 words per minute)
    let calculatedReadTime = readTime;
    if (!readTime) {
      const wordCount = content.split(/\s+/).length;
      calculatedReadTime = `${Math.ceil(wordCount / 200)} min read`;
    }
    
    const blog = new Blog({
      title: title.trim(),
      content: content.trim(),
      author: author.trim(),
      tags: tags || [],
      image: image || '',
      readTime: calculatedReadTime,
      featured: featured || false,
      status
    });

    await blog.save();
    
    res.status(201).json({
      success: true,
      message: 'Blog created successfully',
      data: blog
    });
  } catch (error) {
    console.error('Blog creation error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Blog with this title already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update blog (Admin only)
const updateBlog = async (req, res) => {
  try {
    const { title, content, author, tags, image, readTime, featured, status } = req.body;
    
    // Calculate read time if content changed and readTime not provided
    let calculatedReadTime = readTime;
    if (content && !readTime) {
      const wordCount = content.split(/\s+/).length;
      calculatedReadTime = `${Math.ceil(wordCount / 200)} min read`;
    }
    
    const updateData = {
      updatedAt: Date.now()
    };
    
    // Only include fields that are provided
    if (title) updateData.title = title.trim();
    if (content) updateData.content = content.trim();
    if (author) updateData.author = author.trim();
    if (tags) updateData.tags = tags;
    if (image !== undefined) updateData.image = image;
    if (calculatedReadTime) updateData.readTime = calculatedReadTime;
    if (featured !== undefined) updateData.featured = featured;
    if (status) updateData.status = status;
    
    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Blog updated successfully',
      data: blog
    });
  } catch (error) {
    console.error('Update blog error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Blog with this title already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete blog (Admin only)
const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Blog deleted successfully',
      data: {
        id: blog._id,
        title: blog.title
      }
    });
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Toggle blog featured status (Admin only)
const toggleFeatured = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    blog.featured = !blog.featured;
    blog.updatedAt = Date.now();
    
    await blog.save();
    
    res.json({
      success: true,
      message: `Blog ${blog.featured ? 'marked as featured' : 'removed from featured'}`,
      data: blog
    });
  } catch (error) {
    console.error('Toggle featured error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Toggle blog status (Admin only)
const toggleStatus = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    blog.status = blog.status === 'published' ? 'draft' : 'published';
    blog.updatedAt = Date.now();
    
    await blog.save();
    
    res.json({
      success: true,
      message: `Blog ${blog.status === 'published' ? 'published' : 'moved to draft'}`,
      data: blog
    });
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get blog statistics (Admin only)
const getBlogStats = async (req, res) => {
  try {
    const totalBlogs = await Blog.countDocuments();
    const publishedBlogs = await Blog.countDocuments({ status: 'published' });
    const draftBlogs = await Blog.countDocuments({ status: 'draft' });
    const featuredBlogs = await Blog.countDocuments({ featured: true });
    const totalTags = await Blog.distinct('tags');
    
    // Get blogs count by month for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const blogsByMonth = await Blog.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        totalBlogs,
        publishedBlogs,
        draftBlogs,
        featuredBlogs,
        totalTags: totalTags.length,
        blogsByMonth
      }
    });
  } catch (error) {
    console.error('Get blog stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
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
};