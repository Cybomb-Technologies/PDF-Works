const TopupPackage = require("../models/TopupPackage");
const asyncHandler = require("express-async-handler");

// GLOBAL EXCHANGE RATE (USD → INR)
const EXCHANGE_RATE = process.env.EXCHANGE_RATE
  ? Number(process.env.EXCHANGE_RATE)
  : 83.5;

// =========================================================
// 🔹 FORMAT TOPUP PACKAGE FOR CLIENT
// =========================================================
const formatTopup = (pkg) => ({
  id: pkg._id,
  name: pkg.name,
  description: pkg.description,
  
  // Pricing
  price: pkg.price,
  currency: pkg.currency,
  inrPrice: Math.round(pkg.price * EXCHANGE_RATE),
  
  // Credits breakdown
  credits: {
    conversion: pkg.conversionCredits,
    editTools: pkg.editToolsCredits,
    organizeTools: pkg.organizeToolsCredits,
    securityTools: pkg.securityToolsCredits,
    optimizeTools: pkg.optimizeToolsCredits,
    advancedTools: pkg.advancedToolsCredits,
    convertTools: pkg.convertToolsCredits,
  },
  totalCredits: pkg.totalCredits,
  
  // UI
  icon: pkg.icon,
  color: pkg.color,
  popular: pkg.popular,
  badgeText: pkg.badgeText,
  featured: pkg.featured,
  
  // Status
  isActive: pkg.isActive,
  
  // Value calculation
  valueScore: pkg.totalCredits / Math.max(pkg.price, 1)
});

// =========================================================
// 🔹 GET ALL TOPUP PACKAGES (PUBLIC)
// =========================================================
const getTopupPackages = asyncHandler(async (req, res) => {
  try {
    const packages = await TopupPackage.find({ isActive: true })
      .sort({ order: 1, price: 1 });

    res.json({
      success: true,
      count: packages.length,
      packages: packages.map(formatTopup),
    });
  } catch (error) {
    console.error("Error fetching topup packages:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching topup packages",
    });
  }
});

// =========================================================
// 🔹 GET FEATURED TOPUP PACKAGES (For Billing Page)
// =========================================================
const getFeaturedTopups = asyncHandler(async (req, res) => {
  try {
    const packages = await TopupPackage.find({ 
      isActive: true,
      featured: true 
    })
    .sort({ order: 1 })
    .limit(4);

    res.json({
      success: true,
      count: packages.length,
      packages: packages.map(formatTopup),
    });
  } catch (error) {
    console.error("Error fetching featured topups:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching featured topups",
    });
  }
});

// =========================================================
// 🔹 GET TOPUP PACKAGES FOR ADMIN
// =========================================================
const getTopupPackagesAdmin = asyncHandler(async (req, res) => {
  try {
    const packages = await TopupPackage.find()
      .sort({ order: 1, price: 1 });

    res.json({
      success: true,
      count: packages.length,
      packages,
    });
  } catch (error) {
    console.error("Error fetching topup packages for admin:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching topup packages",
    });
  }
});

// =========================================================
// 🔹 CREATE TOPUP PACKAGE (ADMIN)
// =========================================================
const createTopupPackage = asyncHandler(async (req, res) => {
  try {
    const package = await TopupPackage.create(req.body);

    res.status(201).json({
      success: true,
      message: "Topup package created successfully",
      package,
    });
  } catch (error) {
    console.error("Error creating topup package:", error);
    res.status(500).json({
      success: false,
      message: "Error creating topup package",
    });
  }
});

// =========================================================
// 🔹 UPDATE TOPUP PACKAGE (ADMIN)
// =========================================================
const updateTopupPackage = asyncHandler(async (req, res) => {
  try {
    const package = await TopupPackage.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!package) {
      return res.status(404).json({
        success: false,
        message: "Topup package not found",
      });
    }

    res.json({
      success: true,
      message: "Topup package updated successfully",
      package,
    });
  } catch (error) {
    console.error("Error updating topup package:", error);
    res.status(500).json({
      success: false,
      message: "Error updating topup package",
    });
  }
});

// =========================================================
// 🔹 DELETE TOPUP PACKAGE (ADMIN)
// =========================================================
const deleteTopupPackage = asyncHandler(async (req, res) => {
  try {
    const package = await TopupPackage.findById(req.params.id);

    if (!package) {
      return res.status(404).json({
        success: false,
        message: "Topup package not found",
      });
    }

    await TopupPackage.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Topup package deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting topup package:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting topup package",
    });
  }
});

// =========================================================
// 🔹 INITIALIZE DEFAULT TOPUP PACKAGES
// =========================================================
const initializeDefaultTopups = asyncHandler(async (req, res) => {
  try {
    await TopupPackage.deleteMany({});

    const defaultPackages = [
      {
        name: "Mini Boost",
        description: "Small credit boost for occasional needs",
        price: 4.99,
        conversionCredits: 25,
        editToolsCredits: 10,
        organizeToolsCredits: 10,
        securityToolsCredits: 5,
        optimizeToolsCredits: 5,
        advancedToolsCredits: 2,
        convertToolsCredits: 10,
        icon: "Zap",
        color: "from-yellow-500 to-orange-500",
        popular: false,
        badgeText: "Quick Fix",
        order: 1,
      },
      {
        name: "Power Pack",
        description: "Perfect balance for regular users",
        price: 9.99,
        conversionCredits: 75,
        editToolsCredits: 40,
        organizeToolsCredits: 40,
        securityToolsCredits: 25,
        optimizeToolsCredits: 25,
        advancedToolsCredits: 15,
        convertToolsCredits: 40,
        icon: "BatteryCharging",
        color: "from-green-500 to-emerald-600",
        popular: true,
        badgeText: "Most Popular",
        featured: true,
        order: 2,
      },
      {
        name: "Pro Reserve",
        description: "Large credit reserve for power users",
        price: 19.99,
        conversionCredits: 200,
        editToolsCredits: 100,
        organizeToolsCredits: 100,
        securityToolsCredits: 75,
        optimizeToolsCredits: 75,
        advancedToolsCredits: 50,
        convertToolsCredits: 100,
        icon: "Crown",
        color: "from-blue-500 to-cyan-600",
        popular: false,
        badgeText: "Best Value",
        featured: true,
        order: 3,
      },
      {
        name: "Conversion Focus",
        description: "Extra conversion credits for heavy PDF work",
        price: 7.99,
        conversionCredits: 150,
        editToolsCredits: 20,
        organizeToolsCredits: 20,
        securityToolsCredits: 15,
        optimizeToolsCredits: 15,
        advancedToolsCredits: 10,
        convertToolsCredits: 30,
        icon: "Bolt",
        color: "from-purple-500 to-pink-500",
        popular: false,
        badgeText: "For Heavy Users",
        order: 4,
      },
    ];

    const inserted = await TopupPackage.insertMany(defaultPackages);

    res.json({
      success: true,
      message: "Default topup packages initialized",
      packages: inserted,
    });
  } catch (error) {
    console.error("Error initializing topup packages:", error);
    res.status(500).json({
      success: false,
      message: "Error initializing default topup packages",
    });
  }
});

module.exports = {
  getTopupPackages,
  getFeaturedTopups,
  getTopupPackagesAdmin,
  createTopupPackage,
  updateTopupPackage,
  deleteTopupPackage,
  initializeDefaultTopups,
};