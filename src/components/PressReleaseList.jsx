// components/PressReleaseList.js
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Metatags from "../SEO/metatags";

const API_URL = import.meta.env.VITE_API_URL;

function PressReleaseList() {
  const [pressReleases, setPressReleases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPressReleases();
  }, []);

  const fetchPressReleases = async () => {
    try {
      const response = await fetch(`${API_URL}/api/pressrelease`);
      const data = await response.json();
      setPressReleases(data);
    } catch (error) {
      console.error("Error fetching press releases:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "N/A";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  if (loading) {
    return (
      <div className="container my-5">
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ minHeight: "50vh" }}
        >
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading press releases...</p>
          </div>
        </div>
      </div>
    );
  }

  const metaPropsData = {
    title: "Press Releases Free PDF Tools News Updates PDF Works",
    description:
      "Browse all press releases about PDF Works free PDF tools platform Read latest news updates free online PDF editor converter compressor announcements",
    keyword:
      "free pdf tools press releases, pdf works news, online pdf editor updates, free pdf converter announcements, pdf tools company news",
    image:
      "https://res.cloudinary.com/dcfjt8shw/image/upload/v1761288318/wn8m8g8skdpl6iz2rwoa.svg",
    url: "https://pdfworks.in/press",
  };

  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="container my-5">
        <div className="row">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h1 className="display-4 fw-bold text-primary">Press Releases</h1>
              <Link
                to="/press-release/create"
                className="btn btn-primary btn-lg"
              >
                <i className="bi bi-plus-circle me-2"></i>
                Add New Press Release
              </Link>
            </div>
          </div>
        </div>

        <div className="row">
          {pressReleases.map((press) => (
            <div key={press._id} className="col-lg-6 col-xl-4 mb-4">
              <div className="card h-100 shadow-sm border-0 hover-shadow">
                {press.image && (
                  <img
                    src={press.image}
                    className="card-img-top"
                    alt={press.title}
                    style={{ height: "200px", objectFit: "cover" }}
                  />
                )}

                <div className="card-body d-flex flex-column">
                  <div className="mb-2">
                    <span className="badge bg-primary me-2">
                      {press.category}
                    </span>
                    <span
                      className={`badge ${
                        press.status === "published"
                          ? "bg-success"
                          : "bg-warning"
                      }`}
                    >
                      {press.status}
                    </span>
                  </div>

                  <h5 className="card-title fw-bold text-dark">
                    {press.title}
                  </h5>

                  {press.description && (
                    <p className="card-text text-muted flex-grow-1">
                      {press.description.length > 120
                        ? `${press.description.substring(0, 120)}...`
                        : press.description}
                    </p>
                  )}

                  {/* PDF File Info */}
                  {press.pdfFile && (
                    <div className="mt-2 p-3 bg-light rounded">
                      <div className="d-flex align-items-center mb-2">
                        <i className="bi bi-file-earmark-pdf text-danger fs-4 me-2"></i>
                        <div>
                          <strong className="d-block">
                            {press.pdfFileName}
                          </strong>
                          <small className="text-muted">
                            {formatFileSize(press.fileSize)} •{" "}
                            {press.downloadCount || 0} downloads
                          </small>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-top">
                    <div className="row">
                      <div className="col-6">
                        <small className="text-muted">
                          <i className="bi bi-person me-1"></i>
                          {press.author}
                        </small>
                      </div>
                      <div className="col-6 text-end">
                        <small className="text-muted">
                          {new Date(press.publishedDate).toLocaleDateString()}
                        </small>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card-footer bg-transparent border-top-0">
                  <div className="d-grid gap-2">
                    <Link
                      to={`/press-release/${press._id}`}
                      className="btn btn-outline-primary"
                    >
                      <i className="bi bi-eye me-2"></i>
                      View Details
                    </Link>
                    {press.pdfFile && (
                      <a
                        href={`${API_URL}${press.pdfFile}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-danger"
                        onClick={() => {
                          // Increment download count
                          fetch(
                            `${API_URL}/api/pressrelease/${press._id}/download`,
                            {
                              method: "POST",
                            }
                          );
                        }}
                      >
                        <i className="bi bi-download me-2"></i>
                        Download PDF
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {pressReleases.length === 0 && (
          <div className="text-center py-5">
            <i className="bi bi-inbox display-1 text-muted"></i>
            <h3 className="text-muted mt-3">No Press Releases Found</h3>
            <p className="text-muted">
              Get started by creating your first press release.
            </p>
            <Link to="/press-release/create" className="btn btn-primary btn-lg">
              Create Press Release
            </Link>
          </div>
        )}

        {/* Bootstrap Icons */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css"
        />

        <style>{`
        .hover-shadow {
          transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }
        .hover-shadow:hover {
          transform: translateY(-5px);
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
        }
      `}</style>
      </div>
    </>
  );
}

export default PressReleaseList;
