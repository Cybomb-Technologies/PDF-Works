// middleware/corsMiddleware.js
const cors = require("cors");

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:3000",
      "https://pdfworks.in",
      "https://www.pdfworks.in",
    ];

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
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
  maxAge: 86400, // 24 hours
};

const corsMiddleware = cors(corsOptions);

// Handle preflight requests
const handlePreflight = (req, res) => {
  res.status(200).end();
};

module.exports = { corsMiddleware, handlePreflight };
