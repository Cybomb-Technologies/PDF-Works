const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

// Existing routes
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const contactRoutes = require("./routes/contactRoutes");
const convertRoutes = require("./routes/tools-routes/Convert/Convert-Routes");

// ✅ Add Press Release Routes
const pressReleaseRoutes = require("./routes/pressrelease"); // Add this line

// ✅ Other routes
const AdvancedRoutes = require("./routes/tools-routes/Advanced/Advanced-Route");
const OrganizeRoutes = require("./routes/tools-routes/Organize/Organize-Route");
const SecurityRoutes = require("./routes/tools-routes/Security/Security-Routes");
const EditRoutes = require("./routes/tools-routes/Edit/Edit-Route");
const fileRoutes = require("./routes/fileRoutes");
const blogRoutes = require("./routes/blogRoutes");

const app = express();

// Ensure uploads directories exist on server start
const ensureUploadsDirs = () => {
  const uploadsDir = path.join(__dirname, "uploads");
  const tempDir = path.join(uploadsDir, "temp");
  const conversionsDir = path.join(uploadsDir, "conversions");
  const convertedFilesDir = path.join(uploadsDir, "converted_files");
  const pressReleasesDir = path.join(uploadsDir, "press-releases"); // Add this line

  [uploadsDir, tempDir, conversionsDir, convertedFilesDir, pressReleasesDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
};

// Create directories on startup
ensureUploadsDirs();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// CORS setup - improved
app.use(
  cors({
    origin: [
      "http://localhost:3001",
      "http://localhost:5173",
      "http://localhost:3000",
      "https://pdfworks.in",
      "https://cybombadmin.cybomb.com",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "password",
    ],
    credentials: true,
  })
);

// Handle preflight requests
app.options("*", cors());

// ✅ Add Press Release Routes here
app.use("/api/pressrelease", pressReleaseRoutes); // Add this line

// Other Routes
app.use("/api/auth", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/convert", convertRoutes);

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/organize", OrganizeRoutes);
app.use("/api/security", SecurityRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/advanced", AdvancedRoutes);
app.use("/api/tools/pdf-editor", EditRoutes);
app.use('/api/blogs', blogRoutes);

// Static file serving
app.use('/uploads', express.static('uploads'));

// Apply multer to file-rename route
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

// Global error handling middleware
app.use((error, req, res, next) => {
  console.error("Global Error Handler:", error);

  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "File too large",
        details: "File size must be less than 50MB",
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

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// MongoDB connect with improved error handling
mongoose
  .connect("mongodb://localhost:27017/pdf-tools")
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  await mongoose.connection.close();
  process.exit(0);
});

// Start server
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});