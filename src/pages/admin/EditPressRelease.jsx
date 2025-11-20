// components/admin/EditPressRelease.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

const EditPressRelease = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    author: 'Admin',
    category: 'General',
    status: 'draft',
    image: ''
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    fetchPressRelease();
  }, [id]);

  const fetchPressRelease = async () => {
    try {
      const response = await fetch(`${API_URL}/api/pressrelease/${id}`);
      const data = await response.json();
      setFormData(data);
    } catch (error) {
      console.error('Error fetching press release:', error);
      alert('Error loading press release');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    setPdfFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });
      
      if (pdfFile) {
        submitData.append('pdfFile', pdfFile);
      }

      const response = await fetch(`${API_URL}/api/pressrelease/${id}`, {
        method: 'PUT',
        body: submitData
      });

      if (response.ok) {
        alert('Press release updated successfully!');
        navigate('/admin/press-release');
      } else {
        alert('Failed to update press release');
      }
    } catch (error) {
      console.error('Error updating press release:', error);
      alert('Error updating press release');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
        
      <div className="container-fluid">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="h3 mb-1">Edit Press Release</h1>
              <p className="text-muted">Update press release details</p>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                {/* Same form structure as CreatePressRelease */}
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Title *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Category</label>
                      <select
                        className="form-control"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                      >
                        <option value="General">General</option>
                        <option value="News">News</option>
                        <option value="Update">Update</option>
                        <option value="Announcement">Announcement</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    name="description"
                    rows="3"
                    value={formData.description}
                    onChange={handleChange}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Content</label>
                  <textarea
                    className="form-control"
                    name="content"
                    rows="6"
                    value={formData.content}
                    onChange={handleChange}
                  />
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Author</label>
                      <input
                        type="text"
                        className="form-control"
                        name="author"
                        value={formData.author}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Status</label>
                      <select
                        className="form-control"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">PDF File</label>
                  <input
                    type="file"
                    className="form-control"
                    accept=".pdf"
                    onChange={handleFileChange}
                  />
                  <div className="form-text">
                    {formData.pdfFile ? `Current file: ${formData.pdfFileName}` : 'No PDF file uploaded'}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Image URL (Optional)</label>
                  <input
                    type="url"
                    className="form-control"
                    name="image"
                    value={formData.image}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Updating...
                      </>
                    ) : (
                      'Update Press Release'
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigate('/admin/press-release')}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
    </AdminLayout>
  );
};

export default EditPressRelease;