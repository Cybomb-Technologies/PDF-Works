const jwt = require("jsonwebtoken");

// Domains allowed without token
const allowedOrigins = [
  "http://localhost:5173",
  "https://cybombadmin.cybomb.com"
];

const verifyToken = (req, res, next) => {
  const origin = req.headers.origin;

  // 1️⃣ If request is from allowed domain → skip token check
  if (allowedOrigins.includes(origin)) {
    console.log("Bypassed token (allowed origin):", origin);
    return next();
  }

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


// Admin verification (bypass also applied)
const verifyAdmin = (req, res, next) => {
  const origin = req.headers.origin;

  // Allow same bypass for admin routes
  if (allowedOrigins.includes(origin)) {
    console.log("Bypassed admin token (allowed origin):", origin);
    return next();
  }

  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "No token provided",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Admin access only",
      });
    }
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: "Invalid token",
    });
  }
};


// Optional auth stays same
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      //
    }
  }
  next();
};

module.exports = {
  verifyToken,
  verifyAdmin,
  protect: verifyToken,
  optionalAuth,
};
