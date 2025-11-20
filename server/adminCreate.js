const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const Admin = require("../models/AdminModel"); // mongoose model

// CREATE ADMIN (POST /api/admin/create)
router.post("/create", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: "All fields required" });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ success: false, error: "Admin already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({
      name,
      email,
      password: hashedPassword,
      role: "admin",
      createdAt: new Date()
    });

    await newAdmin.save();

    // Return admin data without password
    const { password: pw, ...adminWithoutPassword } = newAdmin.toObject();
    res.status(201).json({ success: true, admin: adminWithoutPassword });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

module.exports = router;
