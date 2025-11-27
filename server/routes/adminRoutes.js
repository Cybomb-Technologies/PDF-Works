// adminRoutes.js
const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const { 
  createAdmin,
  loginAdmin, 
  getAllAdmins, 
  getAdminById, 
  updateAdmin, 
  deleteAdmin 
} = require("../controllers/adminController");

// ✅ Allowed domains for bypass
const ALLOWED_DOMAINS = [
  "http://localhost:5173",
  "http://localhost:5174", 
  "http://localhost:3000",
  "https://pfdworksadmin.pfdworks.com"
];

// ✅ Auth Middleware with bypass (using same verifyToken logic)
const verifyToken = (req, res, next) => {
  const origin = req.headers.origin;
  const referer = req.headers.referer || "";

  // If request is from allowed domain, skip token check
  if (
    (origin && ALLOWED_DOMAINS.includes(origin)) ||
    ALLOWED_DOMAINS.some((d) => referer.startsWith(d))
  ) {
    console.log("✅ Domain allowed without token:", origin || referer);
    return next();
  }

  // Otherwise, use normal token verification
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "No token provided",
      message: "User not authenticated. Please login again.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log("User authenticated via token:", {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    });
    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    return res.status(401).json({
      success: false,
      error: "Invalid token",
      message: "User not authenticated. Please login again.",
    });
  }
};

// Add CORS middleware
router.use((req, res, next) => {
  const origin = req.headers.origin;
  if (ALLOWED_DOMAINS.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

// Handle preflight requests
router.options('*', (req, res) => {
  const origin = req.headers.origin;
  if (ALLOWED_DOMAINS.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.status(200).send();
});

// Create new admin (no auth required for simplicity)
router.post("/", createAdmin);

// Admin login
router.post("/login", loginAdmin);

// Get all admins
router.get("/", verifyToken, getAllAdmins);

// Get admin by ID
router.get("/:id", verifyToken, getAdminById);

// Update admin
router.put("/update/:id", verifyToken, updateAdmin);

// Delete admin
router.delete("/delete/:id", verifyToken, deleteAdmin);

module.exports = router;