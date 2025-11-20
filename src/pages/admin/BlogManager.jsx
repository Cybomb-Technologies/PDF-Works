import React, { useState, useEffect } from "react";
import {
  BookOpen,
  PlusCircle,
  Edit,
  Trash2,
  Clock,
  Star,
  Image,
  Tag,
  Loader,
  CheckCircle,
  Eye,
  EyeOff,
  Search,
  Filter,
  BarChart3,
  Calendar,
  Users,
  TrendingUp,
  MoreVertical,
  ChevronDown,
  FileText,
  Award,
  Hash
} from "lucide-react";
import AdminLayout from "../../components/AdminLayout/AdminLayout";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const BlogForm = ({ blogToEdit, onSubmit, onCancel }) => {
  const [title, setTitle] = useState(blogToEdit?.title || "");
  const [content, setContent] = useState(blogToEdit?.content || "");
  const [author, setAuthor] = useState(blogToEdit?.author || "");
  const [image, setImage] = useState(blogToEdit?.image || "");
  const [tags, setTags] = useState(blogToEdit?.tags?.join(", ") || "");
  const [readTime, setReadTime] = useState(blogToEdit?.readTime || "");
  const [featured, setFeatured] = useState(blogToEdit?.featured || false);
  const [status, setStatus] = useState(blogToEdit?.status || "published");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const isEditMode = !!blogToEdit;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !content || !author) {
      setMessage("Please fill in all required fields.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    const blogData = {
      title,
      content,
      author,
      image: image || "",
      tags: tags
        ? tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag)
        : [],
      readTime: readTime || "",
      featured,
      status
    };

    try {
      const url = isEditMode
        ? `${API_BASE_URL}/api/blogs/${blogToEdit._id}`
        : `${API_BASE_URL}/api/blogs`;
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("pdfpro_admin_token")}`,
        },
        body: JSON.stringify(blogData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(
          isEditMode
            ? "Blog post updated successfully!"
            : "Blog post created successfully!"
        );
        if (!isEditMode) {
          // Reset form
          setTitle("");
          setContent("");
          setAuthor("");
          setImage("");
          setTags("");
          setReadTime("");
          setFeatured(false);
          setStatus("published");
        }
        setTimeout(() => {
          onSubmit();
        }, 1500);
      } else {
        throw new Error(data.message || "Failed to save blog");
      }
    } catch (error) {
      console.error("Error submitting blog:", error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
    <div className="p-6 bg-white rounded-2xl shadow-xl border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900">
          {isEditMode ? "Edit Blog Post" : "Create New Blog Post"}
        </h3>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <FileText className="w-4 h-4" />
          <span>{isEditMode ? "Editing Post" : "New Post"}</span>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              placeholder="Enter blog title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-gray-50"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Author *
            </label>
            <input
              type="text"
              placeholder="Author name"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-gray-50"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Image URL
          </label>
          <div className="flex items-center space-x-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <Image className="w-5 h-5 text-gray-400" />
            <input
              type="url"
              placeholder="https://example.com/image.jpg"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="flex-1 bg-transparent focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex items-center space-x-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <Tag className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="react, javascript, webdev"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="flex-1 bg-transparent focus:outline-none"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Separate tags with commas
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Read Time
            </label>
            <div className="flex items-center space-x-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <Clock className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="5 min read"
                value={readTime}
                onChange={(e) => setReadTime(e.target.value)}
                className="flex-1 bg-transparent focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Content *
          </label>
          <textarea
            placeholder="Write your blog content here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows="8"
            className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-gray-50"
            required
          ></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <input
              type="checkbox"
              id="featured"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="w-5 h-5 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
            />
            <label
              htmlFor="featured"
              className="flex items-center text-sm font-semibold text-gray-700"
            >
              <Star className="w-5 h-5 mr-2 text-yellow-500" />
              Mark as featured post
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
            <label className="text-sm font-semibold text-gray-700">Status:</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-transparent border-none focus:outline-none focus:ring-0 font-medium"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition duration-200 flex items-center justify-center"
          >
            {isLoading ? (
              <Loader className="animate-spin w-5 h-5 mr-2" />
            ) : isEditMode ? (
              <Edit className="w-5 h-5 mr-2" />
            ) : (
              <PlusCircle className="w-5 h-5 mr-2" />
            )}
            {isEditMode ? "Update Blog" : "Publish Blog"}
          </button>
        </div>
        {message && (
          <div
            className={`p-4 rounded-xl ${
              message.includes("Error")
                ? "bg-red-50 border border-red-200 text-red-700"
                : "bg-green-50 border border-green-200 text-green-700 flex items-center justify-center"
            }`}
          >
            {message.includes("Error") ? (
              message
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" /> {message}
              </>
            )}
          </div>
        )}
      </form>
    </div>
    </AdminLayout>
  );
};

const BlogManager = () => {
  const [blogs, setBlogs] = useState([]);
  const [filteredBlogs, setFilteredBlogs] = useState([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [blogToEdit, setBlogToEdit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stats, setStats] = useState({
    totalBlogs: 0,
    featuredBlogs: 0,
    uniqueTags: 0,
    recentBlogs: 0
  });

  // Fetch blogs from API
  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/blogs`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('pdfpro_admin_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch blogs: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle different possible response structures
      let blogsArray = [];
      
      if (Array.isArray(data)) {
        blogsArray = data;
      } else if (data && Array.isArray(data.blogs)) {
        blogsArray = data.blogs;
      } else if (data && data.data && Array.isArray(data.data)) {
        blogsArray = data.data;
      } else {
        console.warn('Unexpected API response structure:', data);
        blogsArray = [];
      }
      
      setBlogs(blogsArray);
      setFilteredBlogs(blogsArray);
      
      // Calculate stats
      calculateStats(blogsArray);
      
    } catch (error) {
      console.error("Error fetching blogs:", error);
      setMessage(`Error loading blogs: ${error.message}`);
      setBlogs([]);
      setFilteredBlogs([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (blogsData) => {
    if (!Array.isArray(blogsData)) {
      console.warn('calculateStats expected array, got:', blogsData);
      blogsData = [];
    }

    const totalBlogs = blogsData.length;
    const featuredBlogs = blogsData.filter(blog => blog.featured).length;
    
    // Get unique tags count
    const allTags = blogsData.flatMap(blog => blog.tags || []);
    const uniqueTags = [...new Set(allTags)].length;
    
    // Blogs from last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const recentBlogs = blogsData.filter(blog => {
      try {
        const blogDate = blog.createdAt ? new Date(blog.createdAt) : new Date();
        return blogDate >= sixMonthsAgo;
      } catch (e) {
        return false;
      }
    }).length;

    setStats({
      totalBlogs,
      featuredBlogs,
      uniqueTags,
      recentBlogs
    });
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  // Filter blogs
  useEffect(() => {
    let filtered = [...blogs];

    if (searchTerm) {
      filtered = filtered.filter(
        (blog) =>
          blog.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          blog.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          blog.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (blog.tags &&
            blog.tags.some((tag) =>
              tag.toLowerCase().includes(searchTerm.toLowerCase())
            ))
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((blog) => blog.status === statusFilter);
    }

    setFilteredBlogs(filtered);
  }, [searchTerm, statusFilter, blogs]);

  const handleEdit = (blog) => {
    setBlogToEdit(blog);
    setIsFormVisible(true);
  };

  const handleCreateNew = () => {
    setBlogToEdit(null);
    setIsFormVisible(true);
    setMessage("");
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    setBlogToEdit(null);
    fetchBlogs(); // Refresh the list
  };

  const handleDelete = async (blogId) => {
    if (!window.confirm("Are you sure you want to delete this blog post?"))
      return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/blogs/${blogId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('pdfpro_admin_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete blog');
      }

      setMessage("Blog post deleted successfully!");
      // Remove from local state
      setBlogs(blogs.filter(blog => blog._id !== blogId));
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error deleting blog:", error);
      setMessage(`Error deleting blog: ${error.message}`);
    }
  };

  const toggleFeatured = async (blogId, currentFeatured) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blogs/${blogId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('pdfpro_admin_token')}`
        },
        body: JSON.stringify({
          featured: !currentFeatured
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update blog');
      }

      setMessage(
        `Blog ${!currentFeatured ? "marked as featured" : "removed from featured"}!`
      );
      
      // Update local state
      setBlogs(blogs.map(blog => 
        blog._id === blogId ? {...blog, featured: !currentFeatured} : blog
      ));
      
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error toggling featured:", error);
      setMessage(`Error: ${error.message}`);
    }
  };

  const toggleStatus = async (blogId, currentStatus) => {
    const newStatus = currentStatus === "published" ? "draft" : "published";
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/blogs/${blogId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('pdfpro_admin_token')}`
        },
        body: JSON.stringify({
          status: newStatus
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update blog status');
      }

      setMessage(`Blog ${newStatus === "published" ? "published" : "moved to draft"}!`);
      
      // Update local state
      setBlogs(blogs.map(blog => 
        blog._id === blogId ? {...blog, status: newStatus} : blog
      ));
      
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error toggling status:", error);
      setMessage(`Error: ${error.message}`);
    }
  };

  if (isFormVisible) {
    return (
      <BlogForm
        blogToEdit={blogToEdit}
        onSubmit={handleCancel}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <AdminLayout>
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Blog Management</h1>
          <p className="text-gray-600 text-lg">Manage your blog posts and content</p>
        </div>
        <button
          onClick={handleCreateNew}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-800 transition duration-300 flex items-center"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          New Post
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">{stats.totalBlogs}</p>
              <p className="text-blue-100 text-sm mt-1">Total Blogs</p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">{stats.featuredBlogs}</p>
              <p className="text-purple-100 text-sm mt-1">Featured</p>
            </div>
            <Award className="w-8 h-8 text-purple-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">{stats.uniqueTags}</p>
              <p className="text-green-100 text-sm mt-1">Unique Tags</p>
            </div>
            <Hash className="w-8 h-8 text-green-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">{stats.recentBlogs}</p>
              <p className="text-orange-100 text-sm mt-1">Last 6 Months</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-200" />
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl ${
            message.includes("Error")
              ? "bg-red-50 border border-red-200 text-red-700"
              : "bg-green-50 border border-green-200 text-green-700"
          }`}
        >
          {message}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search blogs by title, content, author, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
          />
        </div>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          <button className="px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition duration-200 flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            Filters
            <ChevronDown className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>

      {/* Blogs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <Loader className="animate-spin w-8 h-8 mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading blogs...</p>
          </div>
        ) : !Array.isArray(filteredBlogs) || filteredBlogs.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No blog posts found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by creating your first blog post!"}
            </p>
            {!searchTerm && statusFilter === "all" && (
              <button
                onClick={handleCreateNew}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-200"
              >
                Create First Post
              </button>
            )}
          </div>
        ) : (
          filteredBlogs.map((blog) => (
            <div
              key={blog._id}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl transition duration-300 overflow-hidden group"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      blog.featured 
                        ? "bg-yellow-100 text-yellow-800 border border-yellow-200" 
                        : "bg-gray-100 text-gray-600 border border-gray-200"
                    }`}>
                      {blog.featured ? "Featured" : "Standard"}
                    </span>
                    <span className="flex items-center text-sm text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      {blog.readTime || 'No read time'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      blog.status === 'published' 
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    }`}>
                      {blog.status || 'draft'}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
                  {blog.title || 'Untitled'}
                </h3>

                {/* Author */}
                <p className="text-sm text-blue-600 font-medium mb-4">by {blog.author || 'Unknown'}</p>

                {/* Content Preview */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                  {blog.content || 'No content available'}
                </p>

                {/* Tags */}
                {blog.tags && blog.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {blog.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100"
                      >
                        #{tag}
                      </span>
                    ))}
                    {blog.tags.length > 3 && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                        +{blog.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="w-3 h-3 mr-1" />
                    {blog.createdAt ? new Date(blog.createdAt).toLocaleDateString() : 'No date'}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(blog)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition duration-150"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleFeatured(blog._id, blog.featured)}
                      className={`p-2 rounded-lg transition duration-150 ${
                        blog.featured
                          ? "text-yellow-600 hover:bg-yellow-50"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                      title={blog.featured ? "Remove featured" : "Mark as featured"}
                    >
                      <Star className={`w-4 h-4 ${blog.featured ? "fill-current" : ""}`} />
                    </button>
                    <button
                      onClick={() => toggleStatus(blog._id, blog.status)}
                      className={`p-2 rounded-lg transition duration-150 ${
                        blog.status === "published"
                          ? "text-green-600 hover:bg-green-50"
                          : "text-yellow-600 hover:bg-yellow-50"
                      }`}
                      title={blog.status === "published" ? "Move to draft" : "Publish"}
                    >
                      {blog.status === "published" ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(blog._id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition duration-150"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
    </AdminLayout>
  );
};

export default BlogManager;