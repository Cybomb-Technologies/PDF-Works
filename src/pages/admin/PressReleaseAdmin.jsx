// components/admin/PressReleaseAdmin.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from "../../components/AdminLayout/AdminLayout";

const API_URL = import.meta.env.VITE_API_URL;

const PressReleaseAdmin = () => {
  const [pressReleases, setPressReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(null);

  useEffect(() => {
    fetchPressReleases();
  }, []);

  const fetchPressReleases = async () => {
    try {
      const response = await fetch(`${API_URL}/api/pressrelease`);
      const data = await response.json();
      setPressReleases(data);
    } catch (error) {
      console.error('Error fetching press releases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this press release?')) {
      return;
    }

    setDeleteLoading(id);
    try {
      const response = await fetch(`${API_URL}/api/pressrelease/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setPressReleases(pressReleases.filter(pr => pr._id !== id));
      } else {
        alert('Failed to delete press release');
      }
    } catch (error) {
      console.error('Error deleting press release:', error);
      alert('Error deleting press release');
    } finally {
      setDeleteLoading(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
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
              <h1 className="h3 mb-1">Press Release Management</h1>
              <p className="text-muted">Manage your press releases and PDF documents</p>
            </div>
            <Link to="/admin/press-release/create" className="btn btn-primary">
              <i className="bi bi-plus-circle me-2"></i>
              Add New Press Release
            </Link>
          </div>

          <div className="card">
            <div className="card-body">
              {pressReleases.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-newspaper display-1 text-muted"></i>
                  <h4 className="mt-3 text-muted">No Press Releases Found</h4>
                  <p className="text-muted">Get started by creating your first press release.</p>
                  <Link to="/admin/press-release/create" className="btn btn-primary">
                    Create Press Release
                  </Link>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>PDF</th>
                        <th>Downloads</th>
                        <th>Published</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pressReleases.map((press) => (
                        <tr key={press._id}>
                          <td>
                            <div>
                              <strong>{press.title}</strong>
                              {press.description && (
                                <small className="d-block text-muted">
                                  {press.description.substring(0, 60)}...
                                </small>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark">{press.category}</span>
                          </td>
                          <td>
                            <span className={`badge ${
                              press.status === 'published' 
                                ? 'bg-success' 
                                : 'bg-warning text-dark'
                            }`}>
                              {press.status}
                            </span>
                          </td>
                          <td>
                            {press.pdfFile ? (
                              <i className="bi bi-file-earmark-pdf text-danger fs-5"></i>
                            ) : (
                              <span className="text-muted">No PDF</span>
                            )}
                          </td>
                          <td>
                            <span className="badge bg-info">{press.downloadCount || 0}</span>
                          </td>
                          <td>
                            <small className="text-muted">
                              {formatDate(press.publishedDate)}
                            </small>
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <Link 
                                to={`/press-release/${press._id}`} 
                                target="_blank"
                                className="btn btn-outline-primary"
                              >
                                <i className="bi bi-eye"></i>
                              </Link>
                              <Link 
                                to={`/admin/press-release/edit/${press._id}`}
                                className="btn btn-outline-secondary"
                              >
                                <i className="bi bi-pencil"></i>
                              </Link>
                              <button
                                onClick={() => handleDelete(press._id)}
                                disabled={deleteLoading === press._id}
                                className="btn btn-outline-danger"
                              >
                                {deleteLoading === press._id ? (
                                  <span className="spinner-border spinner-border-sm" role="status"></span>
                                ) : (
                                  <i className="bi bi-trash"></i>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css"
      />
    </div>
    </AdminLayout>
  );
};

export default PressReleaseAdmin;