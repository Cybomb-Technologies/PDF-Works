const mongoose = require("mongoose");

const AdvancedSchema = new mongoose.Schema({
  featureType: {
    type: String,
    enum: ["automation", "api-connect", "analytics"],
    required: true,
  },
  inputData: { type: Object },
  resultData: { type: Object },
  status: { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("AdvancedTool", AdvancedSchema);
