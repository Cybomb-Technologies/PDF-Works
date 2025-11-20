const mongoose = require('mongoose');

const blogSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Blog title is required'],
      trim: true,
      maxlength: [200, 'Title cannot be more than 200 characters'],
      unique: true
    },
    content: {
      type: String,
      required: [true, 'Blog content is required'],
      minlength: [100, 'Content should be at least 100 characters long']
    },
    author: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true,
      maxlength: [100, 'Author name cannot be more than 100 characters']
    },
    image: {
      type: String,
      default: '',
      validate: {
        validator: function(v) {
          // Basic URL validation (optional field)
          return v === '' || /^https?:\/\/.+\..+/.test(v);
        },
        message: 'Please provide a valid image URL'
      }
    },
    tags: [{
      type: String,
      trim: true,
      maxlength: [30, 'Tag cannot be more than 30 characters']
    }],
    readTime: {
      type: String,
      default: '',
      maxlength: [20, 'Read time cannot be more than 20 characters']
    },
    featured: {
      type: Boolean,
      default: false
    },
    views: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'published'
    }
  },
  {
    timestamps: true,
  }
);

// Add indexes for better performance
blogSchema.index({ title: 'text', content: 'text' });
blogSchema.index({ tags: 1 });
blogSchema.index({ featured: 1 });
blogSchema.index({ status: 1 });
blogSchema.index({ createdAt: -1 });

// Virtual for formatted date
blogSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Ensure virtual fields are serialized
blogSchema.set('toJSON', { virtuals: true });

const Blog = mongoose.model('Blog', blogSchema);
module.exports = Blog;