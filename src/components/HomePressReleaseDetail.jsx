// components/HomePressReleaseDetail.js
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const API_URL = import.meta.env.VITE_API_URL;

function HomePressReleaseDetail() {
  const { id } = useParams();
  const [press, setPress] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchPressRelease();
  }, [id]);

  const fetchPressRelease = async () => {
    try {
      const response = await fetch(`${API_URL}/api/pressrelease/${id}`);
      const data = await response.json();
      setPress(data);
    } catch (error) {
      console.error("Error fetching press release:", error);
    }
  };

  const handleDownload = async () => {
    if (!press?.pdfFile) return;

    setDownloading(true);
    try {
      // Increment download count
      await fetch(`${API_URL}/api/pressrelease/${id}/download`, {
        method: "POST",
      });

      // Trigger download
      const link = document.createElement("a");
      link.href = `${API_URL}${press.pdfFile}`;
      link.download = press.pdfFileName || "press-release.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Refresh data to update download count
      fetchPressRelease();
    } catch (error) {
      console.error("Download error:", error);
    } finally {
      setDownloading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "N/A";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  const splitContentIntoPoints = (content) => {
    if (!content) return [];
    const points = content
      .split(/\n|(?<=\.)\s+(?=[A-Z])|(?<=\d)\.\s+/)
      .filter((point) => point.trim().length > 0)
      .map((point) => point.trim());
    return points;
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case "published":
        return "bg-success";
      case "draft":
        return "bg-warning text-dark";
      case "archived":
        return "bg-secondary";
      default:
        return "bg-primary";
    }
  };

  if (!press) {
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
            <p className="mt-3 text-muted">Loading press release...</p>
          </div>
        </div>
      </div>
    );
  }

  const contentPoints = splitContentIntoPoints(press.content);

  return (
    <div className="container my-5">
      {/* Back Button */}
      <Link
        to="/"
        className="btn btn-lg btn-outline-primary mb-4 d-inline-flex align-items-center"
      >
        <i className="bi bi-arrow-left me-2"></i>
        Back to Press Releases
      </Link>

      {/* Main Card */}
      <div className="card shadow-lg border-0 overflow-hidden">
        {/* Header Image */}
        {press.image && !imageError && (
          <div className="position-relative">
            <img
              src={press.image}
              className="card-img-top"
              alt={press.title}
              style={{ height: "400px", objectFit: "cover", width: "100%" }}
              onError={() => setImageError(true)}
            />
            <div className="position-absolute top-0 start-0 m-3">
              <span
                className={`badge ${getStatusBadgeClass(press.status)} fs-6`}
              >
                {press.status}
              </span>
            </div>
          </div>
        )}

        {/* Placeholder if no image or image failed to load */}
        {(!press.image || imageError) && (
          <div
            className="position-relative bg-light d-flex align-items-center justify-content-center"
            style={{ height: "400px" }}
          >
            <div className="text-center text-muted">
              <i className="bi bi-newspaper" style={{ fontSize: "4rem" }}></i>
              <p className="mt-3 fs-5">No Image Available</p>
            </div>
            <div className="position-absolute top-0 start-0 m-3">
              <span
                className={`badge ${getStatusBadgeClass(press.status)} fs-6`}
              >
                {press.status}
              </span>
            </div>
          </div>
        )}

        {/* Card Body */}
        <div className="card-body p-4 p-lg-5">
          {/* Category */}
          <div className="mb-3">
            <span className="badge bg-light text-dark fs-6 border">
              <i className="bi bi-tag me-1"></i>
              {press.category}
            </span>
          </div>

          {/* Title */}
          <h1 className="card-title display-5 fw-bold text-dark mb-3">
            {press.title}
          </h1>

          {/* Description */}
          {press.description && (
            <p
              className="lead text-muted mb-4"
              style={{
                fontSize: "1.1rem",
                lineHeight: "1.7",
                textAlign: "justify",
              }}
            >
              {press.description}
            </p>
          )}

          {/* PDF Download Section */}
          {press.pdfFile && (
            <div className="pdf-section mb-5 p-4 bg-light rounded border">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <div className="d-flex align-items-center">
                    <i className="bi bi-file-earmark-pdf text-danger display-4 me-4"></i>
                    <div>
                      <h5 className="fw-bold mb-1">
                        Download Press Release PDF
                      </h5>
                      <p className="text-muted mb-1">
                        <strong>File:</strong> {press.pdfFileName}
                      </p>
                      <p className="text-muted mb-0">
                        <strong>Size:</strong> {formatFileSize(press.fileSize)}{" "}
                        •<strong> Downloads:</strong> {press.downloadCount || 0}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 text-md-end mt-3 mt-md-0">
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="btn btn-danger btn-lg px-4"
                  >
                    {downloading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                        ></span>
                        Downloading...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-download me-2"></i>
                        Download PDF
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Meta Information */}
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="d-flex align-items-center text-muted mb-2">
                <i className="bi bi-person-circle me-2"></i>
                <strong className="me-2">Author:</strong>
                <span>{press.author || "Unknown"}</span>
              </div>
            </div>
            <div className="col-md-6">
              <div className="d-flex align-items-center text-muted mb-2">
                <i className="bi bi-calendar-event me-2"></i>
                <strong className="me-2">Published:</strong>
                <span>
                  {press.publishedDate
                    ? new Date(press.publishedDate).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="content-section mt-4">
            <h4 className="fw-bold text-primary mb-4 border-bottom pb-2">
              Content
            </h4>

            {contentPoints.length > 1 ? (
              <div className="points-container">
                {contentPoints.map((point, index) => (
                  <div
                    key={index}
                    className="point-item mb-3 p-3 bg-light rounded"
                  >
                    <div className="d-flex align-items-start">
                      <i className="bi bi-caret-right-fill text-primary me-3 mt-1 fs-5"></i>
                      <p className="mb-0 fs-5 text-dark lh-base">{point}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="single-paragraph">
                <p
                  className="fs-5 lh-base text-dark"
                  style={{ textAlign: "justify", lineHeight: "1.8" }}
                >
                  {press.content}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-5 pt-4 border-top">
            <div className="row">
              <div className="col-md-6">
                <small className="text-muted">
                  <i className="bi bi-clock me-1"></i>
                  Last updated:{" "}
                  {press.publishedDate
                    ? new Date(press.publishedDate).toLocaleString()
                    : "N/A"}
                </small>
              </div>
              <div className="col-md-6 text-md-end">
                <Link to="/" className="btn btn-primary">
                  <i className="bi bi-newspaper me-2"></i>
                  View All Press Releases
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bootstrap Icons */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css"
      />

      {/* Custom Styles */}
      <style>{`
        .card {
          border-radius: 15px;
          transition: transform 0.2s ease-in-out;
        }

        .card:hover {
          transform: translateY(-5px);
        }

        .point-item {
          transition: all 0.3s ease;
          border-left: 4px solid #0d6efd;
        }

        .point-item:hover {
          background-color: #e3f2fd !important;
          transform: translateX(5px);
        }

        .content-section {
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
          border-radius: 10px;
          padding: 2rem;
        }

        .display-5 {
          background: linear-gradient(135deg, #2c3e50, #3498db);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .single-paragraph {
          background: white;
          padding: 2rem;
          border-radius: 10px;
          border-left: 4px solid #0d6efd;
        }

        .pdf-section {
          border-left: 4px solid #dc3545 !important;
        }
      `}</style>
    </div>
  );
}

export default HomePressReleaseDetail;
