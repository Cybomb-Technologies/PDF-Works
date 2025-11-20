const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  
  // Check if authorization header exists and has Bearer token
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ 
      success: false, 
      error: "No token provided",
      message: "User not authenticated. Please login again."
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    
    console.log('User authenticated via token:', {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    });
    
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.status(401).json({ 
      success: false, 
      error: "Invalid token",
      message: "User not authenticated. Please login again."
    });
  }
};

const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ 
      success: false, 
      error: "No token provided" 
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    
    // Check if user has admin role
    if (req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Admin access only" 
      });
    }
    next();
  } catch (err) {
    return res.status(401).json({ 
      success: false, 
      error: "Invalid token" 
    });
  }
};

// For routes that don't require authentication but should still extract user if token exists
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      // Ignore token errors for optional auth
    }
  }
  next();
};

module.exports = { verifyToken, verifyAdmin, protect: verifyToken, optionalAuth };