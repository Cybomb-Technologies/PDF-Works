// src/components/BlogDetailPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, Calendar, Tag, Eye, BookOpen } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

const BlogDetailPage = () => {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        setError("");

        const url = API_BASE_URL
          ? `${API_BASE_URL}/api/blogs/${id}`
          : `/api/blogs/${id}`;

        // console.log("Fetching blog from:", url);

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
          setBlog(result.data);
        } else {
          throw new Error(result.message || "Failed to fetch blog");
        }
      } catch (error) {
        console.error("Error fetching blog:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBlog();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-pulse" />
          <p className="text-gray-600">Loading blog post...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Error loading blog
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            to="/blog"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Blog not found
          </h3>
          <p className="text-gray-600 mb-4">
            The blog post you're looking for doesn't exist.
          </p>
          <Link
            to="/blog"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          to="/blog"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to all blogs
        </Link>

        {/* Blog Header */}
        <article className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {blog.image && blog.image.trim() !== "" && (
            <img
              src={blog.image}
              alt={blog.title}
              className="w-full h-64 md:h-96 object-cover"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          )}

          <div className="p-8">
            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-500">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                <span>{blog.readTime || "Unknown"}</span>
              </div>

              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                <span>
                  {blog.formattedDate ||
                    new Date(blog.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                <span>{blog.views || 0} views</span>
              </div>

              {blog.featured && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                  Featured
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              {blog.title}
            </h1>

            {/* Author */}
            <div className="flex items-center mb-8 p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="text-lg font-semibold text-gray-900">
                  by {blog.author}
                </p>
                <p className="text-gray-600">Author</p>
              </div>
            </div>

            {/* Tags */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {blog.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    <Tag className="w-3 h-3 mr-1" />#{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Content */}
            <div className="prose prose-lg max-w-none">
              <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                {blog.content}
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};

export default BlogDetailPage;
