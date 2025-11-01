const jwt = require("jsonwebtoken");

// allowed admin panel origins
const allowedOrigins = [
  "https://admin.cybomb.com",
  "http://localhost:5173",
];

const verifyToken = (req, res, next) => {
  const origin = req.headers.origin;

  // 🔓 if the request comes from admin domains — skip token verification
  if (allowedOrigins.includes(origin)) {
    return next();
  }

  // 🔒 otherwise verify token normally
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: "Invalid token" });
  }
};

const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    // skip admin check if origin is in allowed list
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) return next();

    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Admin access only" });
    }
    next();
  });
};

module.exports = { verifyToken, verifyAdmin };
