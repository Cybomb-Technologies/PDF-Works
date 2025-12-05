const mongoose = require("mongoose");

const topupPackageSchema = new mongoose.Schema(
  {
    // Basic info
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    
    // Pricing
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD" },
    
    // Credit allocation
    conversionCredits: { type: Number, default: 0 },
    editToolsCredits: { type: Number, default: 0 },
    organizeToolsCredits: { type: Number, default: 0 },
    securityToolsCredits: { type: Number, default: 0 },
    optimizeToolsCredits: { type: Number, default: 0 },
    advancedToolsCredits: { type: Number, default: 0 },
    convertToolsCredits: { type: Number, default: 0 },
    
    // Total for quick reference
    totalCredits: { type: Number, default: 0 },
    
    // UI/Display
    icon: {
      type: String,
      default: "Zap",
      enum: ["Zap", "Battery", "BatteryCharging", "Bolt", "Sparkles", "Gem", "Package", "Crown"]
    },
    color: { type: String, default: "from-blue-500 to-cyan-600" },
    popular: { type: Boolean, default: false },
    badgeText: { type: String, default: "" },
    
    // Control
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    
    // Stats
    purchaseCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Calculate total credits before saving
topupPackageSchema.pre('save', function(next) {
  this.totalCredits = 
    this.conversionCredits +
    this.editToolsCredits +
    this.organizeToolsCredits +
    this.securityToolsCredits +
    this.optimizeToolsCredits +
    this.advancedToolsCredits +
    this.convertToolsCredits;
  next();
});

module.exports = mongoose.model("TopupPackage", topupPackageSchema);