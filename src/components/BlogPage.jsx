// src/components/BlogPage.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Clock,
  Calendar,
  Tag,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import Metatags from "../SEO/metatags";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

const BlogPage = () => {
  const [blogs, setBlogs] = useState([]);
  const [filteredBlogs, setFilteredBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [allTags, setAllTags] = useState([]);

  // Enhanced fetch function with better error handling
  const fetchBlogs = async (search = "", tag = "") => {
    try {
      setLoading(true);
      setError("");

      // Build URL - use relative path if API_BASE_URL is empty
      let url = API_BASE_URL ? `${API_BASE_URL}/api/blogs` : "/api/blogs";
      url += "?status=published";

      // Add search parameter if provided
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }

      // Add tag parameter if provided
      if (tag) {
        url += `&tag=${encodeURIComponent(tag)}`;
      }

      console.log("Fetching from:", url); // Debug log

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Check if response is HTML (error page)
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response:", text.substring(0, 200));
        throw new Error(
          "Server returned HTML instead of JSON. Check your API URL."
        );
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setBlogs(result.data);
        setFilteredBlogs(result.data);

        // Extract unique tags from all blogs
        const tags = [
          ...new Set(result.data.flatMap((blog) => blog.tags || [])),
        ];
        setAllTags(tags);
      } else {
        throw new Error(result.message || "Failed to fetch blogs");
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
      setError(error.message);
      setBlogs([]);
      setFilteredBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch blogs by tag
  const fetchBlogsByTag = async (tag) => {
    try {
      setLoading(true);
      setError("");

      const url = API_BASE_URL
        ? `${API_BASE_URL}/api/blogs/tag/${encodeURIComponent(tag)}`
        : `/api/blogs/tag/${encodeURIComponent(tag)}`;

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error("Server returned HTML instead of JSON");
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setBlogs(result.data);
        setFilteredBlogs(result.data);
      } else {
        throw new Error(result.message || "Failed to fetch blogs by tag");
      }
    } catch (error) {
      console.error("Error fetching blogs by tag:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchBlogs();
  }, []);

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (selectedTag) {
        fetchBlogs(searchTerm, selectedTag);
      } else {
        fetchBlogs(searchTerm);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Handle tag filter
  const handleTagClick = (tag) => {
    setSelectedTag(tag === selectedTag ? "" : tag);
  };

  useEffect(() => {
    if (selectedTag) {
      fetchBlogsByTag(selectedTag);
    } else {
      fetchBlogs(searchTerm);
    }
  }, [selectedTag]);

  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedTag("");
    fetchBlogs();
  };

  // Debug info component
  const DebugInfo = () => (
    <div className="mb-4 p-4 bg-white-100 rounded-lg text-xs">
      {/* <p><strong>API Base URL:</strong> {API_BASE_URL || 'Using relative paths'}</p>
      <p><strong>Backend Status:</strong> {error ? 'Error' : 'Connected'}</p> */}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-pulse" />
          <p className="text-gray-600">Loading blogs...</p>
        </div>
      </div>
    );
  }
  const metaPropsData = {
    title:
      "PDF Works Blog - Free PDF Tools Guides, Tutorials & Conversion Tips",
    description:
      "Explore the PDF Works blog for free PDF tools guides, document management tutorials, and PDF conversion tips. Read our articles to master our free PDF editor and organizer tools.",
    keyword:
      "pdf works blog, free pdf tools guides, document management guides, pdf works articles, free pdf tools blog, pdf conversion tips",
    image:
      "https://res.cloudinary.com/dcfjt8shw/image/upload/v1761288318/wn8m8g8skdpl6iz2rwoa.svg",
    url: "https://pdfworks.in/blog",
  };

  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Blog</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Latest insights, tutorials, and news from our team
            </p>
          </div>

          {/* Debug info - remove in production */}
          <DebugInfo />

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <div>
                  <span className="text-red-700 font-medium">{error}</span>
                  <p className="text-red-600 text-sm mt-1">
                    Please check:
                    <br />- Backend server is running on port 5000
                    <br />- CORS is configured in your Express app
                    <br />- API routes are correct
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search blogs by title, content, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {(searchTerm || selectedTag) && (
                <button
                  onClick={handleResetFilters}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Reset Filters
                </button>
              )}
            </div>

            {/* Tags Filter */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTag("")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedTag === ""
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                All
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedTag === tag
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-gray-600">
              Showing {filteredBlogs.length} blog
              {filteredBlogs.length !== 1 ? "s" : ""}
              {selectedTag && ` tagged with "${selectedTag}"`}
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
          </div>

          {/* Blogs Grid */}
          {filteredBlogs.length === 0 && !loading && !error ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No blogs found
              </h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search or filters
              </p>
              <button
                onClick={handleResetFilters}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View All Blogs
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredBlogs.map((blog) => (
                <Link
                  key={blog._id || blog.id}
                  to={`/blog/${blog._id || blog.id}`}
                  className="block hover:no-underline"
                >
                  <article className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full flex flex-col">
                    {blog.image && blog.image.trim() !== "" && (
                      <img
                        src={blog.image}
                        alt={blog.title}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    )}
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span>{blog.readTime || "Unknown"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {blog.featured && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                              Featured
                            </span>
                          )}
                          <span className="flex items-center text-sm text-gray-500">
                            <Calendar className="w-4 h-4 mr-1" />
                            {blog.formattedDate ||
                              new Date(blog.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 flex-1">
                        {blog.title}
                      </h2>

                      <p className="text-gray-600 mb-4 line-clamp-3 flex-1">
                        {blog.content
                          ? blog.content.substring(0, 150) + "..."
                          : "No content available"}
                      </p>

                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-blue-600">
                          by {blog.author || "Unknown Author"}
                        </span>
                        <span className="text-sm text-gray-500">
                          {blog.views || 0} views
                        </span>
                      </div>

                      {blog.tags && blog.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-auto">
                          {blog.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
                          {blog.tags.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{blog.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BlogPage;
