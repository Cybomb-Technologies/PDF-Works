const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

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
const fileRoutes = require("./routes/fileRoutes");
const blogRoutes = require("./routes/blogRoutes");

const app = express();

// Ensure Upload Folders
const ensureUploadsDirs = () => {
  const uploadsDir = path.join(__dirname, "uploads");
  const tempDir = path.join(uploadsDir, "temp");
  const conversionsDir = path.join(uploadsDir, "conversions");
  const convertedFilesDir = path.join(uploadsDir, "converted_files");
  const pressReleasesDir = path.join(uploadsDir, "press-releases");

  [
    uploadsDir,
    tempDir,
    conversionsDir,
    convertedFilesDir,
    pressReleasesDir,
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

// FIXED CORS CONFIGURATION - Moved to top and expanded
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

// ROUTES
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

// REMOVED DUPLICATE CORS MIDDLEWARE - This was causing issues
// app.use(corsMiddleware);

// For File Rename
app.use(
  "/api/edit",
  (req, res, next) => {
    if (req.path === "/file-rename" && req.method === "POST") {
      upload.array("files")(req, res, next);
    } else {
      next();
    }
  },
  EditRoutes
);

// Add a test route to verify CORS is working
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

// GLOBAL ERROR HANDLER
app.use((error, req, res, next) => {
  console.error("Global Error Handler:", error);

  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      error: "File too large",
      details: "File size must be less than 500MB",
    });
  }

  res.status(500).json({
    error: "Internal server error",
    details:
      process.env.NODE_ENV === "development"
        ? error.message
        : "Something went wrong",
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// MONGODB
mongoose
  .connect("mongodb://localhost:27017/pdf-tools")
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
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(
    `CORS enabled for origins: ${[
      "http://localhost:3001",
      "http://localhost:5173",
      "http://localhost:3000",
      "https://pdfworks.in",
      "https://www.pdfworks.in",
      "https://cybombadmin.cybomb.com",
    ].join(", ")}`
  );
});
