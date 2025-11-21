const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// ✅ Fix OverwriteModelError by using correct name
module.exports = mongoose.models.Contact || mongoose.model("Contact", contactSchema);
