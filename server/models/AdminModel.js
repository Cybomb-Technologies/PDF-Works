const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    // No hashing - store as plain text
  }
}, {
  timestamps: true
});

// Remove any pre-save hooks that hash passwords
// Just save the password as plain text

module.exports = mongoose.model("Admin", adminSchema);