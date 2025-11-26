const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const { runCleanupTask } = require("./utils/cleanup");

// ROUTES
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const contactRoutes = require("./routes/contactRoutes");
const convertRoutes = require("./routes/tools-routes/Convert/Convert-Routes");
const pressReleaseRoutes = require("./routes/pressrelease");
const pricingRoutes = require("./routes/pricing");
const paymentRoutes = require("./routes/paymentRoutes");
const AdvancedRoutes = require("./routes/tools-routes/Advanced/Advanced-Route");
const OrganizeRoutes = require("./routes/tools-routes/Organize/Organize-Route");
const SecurityRoutes = require("./routes/tools-routes/Security/Security-Routes");
const EditRoutes = require("./routes/tools-routes/Edit/Edit-Route");
const optimizeRoutes = require("./routes/tools-routes/Optimize/Optimize-Route");
const fileRoutes = require("./routes/fileRoutes");
const blogRoutes = require("./routes/blogRoutes");
const dashboardRoutes = require("./routes/dashboard/dashboard-routes");
const activitiesRoutes = require("./routes/activities/activities-routes");
const adminDashboardRoutes = require("./routes/adminDashboardRoutes");

const app = express();

// Ensure Upload Folders - COMBINED VERSION
const ensureUploadsDirs = () => {
  const uploadsDir = path.join(__dirname, "uploads");
  const tempDir = path.join(uploadsDir, "temp");
  const conversionsDir = path.join(uploadsDir, "conversions");
  const convertedFilesDir = path.join(uploadsDir, "converted_files");
  const pressReleasesDir = path.join(uploadsDir, "press-releases");
  const editedDir = path.join(uploadsDir, "edited");
  const sessionsDir = path.join(uploadsDir, "sessions");
  const securityDir = path.join(uploadsDir, "security");

  [
    uploadsDir,
    tempDir,
    conversionsDir,
    convertedFilesDir,
    pressReleasesDir,
    editedDir,
    sessionsDir,
    securityDir,
  ].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
};

ensureUploadsDirs();

// GLOBAL MULTER – 500MB LIMIT
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
});

// BODY SIZE LIMIT
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ extended: true, limit: "500mb" }));

// FIXED CORS CONFIGURATION - Using the expanded version from file 1
app.use(
  cors({
    origin: [
      "http://localhost:3001",
      "http://localhost:5173",
      "http://localhost:3000",
      "https://pdfworks.in",
      "https://www.pdfworks.in",
      "https://cybombadmin.cybomb.com",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "password",
      "Accept",
      "Origin",
      "Access-Control-Request-Method",
      "Access-Control-Request-Headers",
    ],
    exposedHeaders: [
      "Content-Range",
      "X-Content-Range",
      "Access-Control-Allow-Origin",
      "Access-Control-Allow-Credentials",
    ],
    credentials: true,
    maxAge: 86400, // 24 hours
  })
);

// Handle preflight requests globally
app.options("*", cors());

// ROUTES - COMBINED AND ORGANIZED
app.use("/api/payments", paymentRoutes);
app.use("/api/pricing", pricingRoutes);
app.use("/api/pressrelease", pressReleaseRoutes);
app.use("/api/auth", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/convert", convertRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/organize", OrganizeRoutes);
app.use("/api/security", SecurityRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/advanced", AdvancedRoutes);
app.use("/api/tools/pdf-editor", EditRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/activities", activitiesRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);

// TOOLS ROUTES (from file 2)
app.use("/api/tools/advanced", AdvancedRoutes);
app.use("/api/tools/organize", OrganizeRoutes);
app.use("/api/tools/optimize", optimizeRoutes);
app.use("/api/tools/security", SecurityRoutes);

// Serve static files
app.use(
  "/api/tools/pdf-editor/downloads",
  express.static(path.join(__dirname, "uploads/edited"))
);
app.use(
  "/api/tools/security/downloads",
  express.static(path.join(__dirname, "uploads/security"))
);

// For File Rename - UPDATED to use correct path (from file 2)
app.use(
  "/api/tools/pdf-editor",
  (req, res, next) => {
    if (req.path === "/file-rename" && req.method === "POST") {
      upload.array("files")(req, res, next);
    } else {
      next();
    }
  },
  EditRoutes
);

// HEALTH CHECK AND TEST ROUTES
app.get("/api/test-cors", (req, res) => {
  res.json({
    success: true,
    message: "CORS is working correctly!",
    timestamp: new Date().toISOString(),
    allowedOrigins: [
      "http://localhost:3001",
      "http://localhost:5173",
      "http://localhost:3000",
      "https://pdfworks.in",
      "https://www.pdfworks.in",
      "https://cybombadmin.cybomb.com",
    ],
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "PDF Works Server is running!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// Test route for all tools
app.get("/api/tools", (req, res) => {
  res.json({
    success: true,
    tools: [
      {
        name: "Organize Tools",
        path: "/api/tools/organize",
        description: "PDF organization and management tools",
      },
      {
        name: "Security Tools",
        path: "/api/tools/security",
        description: "File encryption, 2FA protection, and access control",
      },
      {
        name: "PDF Editor Tools",
        path: "/api/tools/pdf-editor",
        description: "PDF editing and manipulation tools",
      },
      {
        name: "Advanced Tools",
        path: "/api/advanced",
        description: "Advanced PDF processing tools",
      },
      {
        name: "Convert Tools",
        path: "/api/convert",
        description: "File conversion tools",
      },
      {
        name: "Optimize Tools",
        path: "/api/tools/optimize",
        description: "PDF optimization tools",
      },
    ],
  });
});

// GLOBAL ERROR HANDLER - COMBINED VERSION
app.use((error, req, res, next) => {
  console.error("Global Error Handler:", error);

  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "File too large",
        details: "File size must be less than 500MB",
      });
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        error: "Unexpected file field",
        details: "Check file field name in form data",
      });
    }
  }

  res.status(500).json({
    error: "Internal server error",
    details:
      process.env.NODE_ENV === "development"
        ? error.message
        : "Something went wrong",
  });
});

// 404 - IMPROVED with all routes
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
    availableRoutes: [
      // Security Routes
      "POST   /api/tools/security/encrypt",
      "POST   /api/tools/security/decrypt",
      "POST   /api/tools/security/protect-pdf-2fa",
      "POST   /api/tools/security/access-pdf-2fa",
      "GET    /api/tools/security/list-2fa-files",
      "DELETE /api/tools/security/remove-2fa-file",
      "POST   /api/tools/security/share-file",
      "POST   /api/tools/security/add-user-access",
      "POST   /api/tools/security/access-shared-file",
      "GET    /api/tools/security/file-access-list",
      "GET    /api/tools/security/list-shared-files",
      "GET    /api/tools/security/download/:filename",
      "GET    /api/tools/security/history",
      "GET    /api/tools/security/test",
      // PDF Editor Routes
      "POST   /api/tools/pdf-editor/upload",
      "GET    /api/tools/pdf-editor/structure/:sessionId",
      "POST   /api/tools/pdf-editor/update-text",
      "POST   /api/tools/pdf-editor/get-edits",
      "POST   /api/tools/pdf-editor/export",
      "POST   /api/tools/pdf-editor/apply-edits",
      "GET    /api/tools/pdf-editor/download/:sessionId",
      "GET    /api/tools/pdf-editor/background/:sessionId/page-:pageNum.png",
      "POST   /api/tools/pdf-editor/save-pdf-edit",
      "POST   /api/tools/pdf-editor/save-image-crop",
      "POST   /api/tools/pdf-editor/save-file-rename",
      "GET    /api/tools/pdf-editor/download-edited/:filename",
      "GET    /api/tools/pdf-editor/history",
      // Organize Routes
      "POST   /api/tools/organize/merge",
      "POST   /api/tools/organize/split",
      "POST   /api/tools/organize/compress",
      "POST   /api/tools/organize/rotate",
      // Test & Health Routes
      "GET    /api/test-cors",
      "GET    /api/health",
      "GET    /api/tools",
    ],
  });
});

// MONGODB
mongoose
  .connect("mongodb://localhost:27017/pdf-tools")
  //.connect("mongodb://localhost:27017/pdf-tools")
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// SHUTDOWN
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  await mongoose.connection.close();
  process.exit(0);
});

// START SERVER
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(
    `📚 CORS enabled for origins: ${[
      "http://localhost:3001",
      "http://localhost:5173",
      "http://localhost:3000",
      "https://pdfworks.in",
      "https://www.pdfworks.in",
      "https://cybombadmin.cybomb.com",
    ].join(", ")}`
  );
  console.log("");
  console.log("🔗 Test URLs:");
  console.log(`  Health Check: http://localhost:${PORT}/api/health`);
  console.log(`  CORS Test: http://localhost:${PORT}/api/test-cors`);
  console.log(`  Tools List: http://localhost:${PORT}/api/tools`);
  console.log(
    `  Security Test: http://localhost:${PORT}/api/tools/security/test`
  );
  console.log("");
  console.log("✅ All tools are now available!");
});

setInterval(runCleanupTask, 10 * 60 * 1000); // every 10 min
console.log("⏳ Auto cleanup system enabled (1 hour expiration)");
