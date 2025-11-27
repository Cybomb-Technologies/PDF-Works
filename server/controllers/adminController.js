// adminController.js
const Admin = require("../models/AdminModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// CREATE NEW ADMIN
const createAdmin = async (req, res) => {
  try {
    const { name, username, email, password, role = 'admin' } = req.body;

    // Validate required fields based on your model
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Name, email, and password are required"
      });
    }

    // Check if admin already exists by email or username
    const existingAdmin = await Admin.findOne({
      $or: [{ email }, { username: username || email }]
    });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        error: "Admin with this email or username already exists"
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new admin - use name as required by your model
    const newAdmin = new Admin({
      name,
      username: username || email, // Use email as username if not provided
      email,
      password: hashedPassword,
      role: role || 'admin'
    });

    await newAdmin.save();

    // Return admin data without password
    const adminResponse = {
      id: newAdmin._id,
      name: newAdmin.name,
      username: newAdmin.username,
      email: newAdmin.email,
      role: newAdmin.role,
      createdAt: newAdmin.createdAt,
      updatedAt: newAdmin.updatedAt
    };

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      admin: adminResponse
    });

  } catch (error) {
    console.error("Error creating admin:", error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: errors.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      error: "Server error while creating admin"
    });
  }
};

// ADMIN LOGIN
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required"
      });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({
        success: false,
        error: "Admin not found"
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: "Invalid credentials"
      });
    }

    const token = jwt.sign(
      {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        username: admin.username,
        role: admin.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      success: true,
      message: "Admin login successful",
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "Server error during login"
    });
  }
};

// GET ALL ADMINS
const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find({}, "-password").sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      admins: admins.map(admin => ({
        id: admin._id,
        name: admin.name,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt
      }))
    });
  } catch (error) {
    console.error("Error fetching admins:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching admins"
    });
  }
};

// GET ADMIN BY ID
const getAdminById = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).select("-password");
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        error: "Admin not found"
      });
    }

    res.status(200).json({
      success: true,
      admin: {
        id: admin._id,
        name: admin.name,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt
      }
    });
  } catch (error) {
    console.error("Error fetching admin:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: "Invalid admin ID"
      });
    }
    
    res.status(500).json({
      success: false,
      error: "Server error while fetching admin"
    });
  }
};

// UPDATE ADMIN
const updateAdmin = async (req, res) => {
  try {
    const { name, username, email, password, role } = req.body;
    const adminId = req.params.id;
    
    // Check if admin exists
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        error: "Admin not found"
      });
    }

    // Check if email is already taken by another admin
    if (email && email !== admin.email) {
      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin && existingAdmin._id.toString() !== adminId) {
        return res.status(400).json({
          success: false,
          error: "Email already exists"
        });
      }
    }

    // Check if username is already taken by another admin
    if (username && username !== admin.username) {
      const existingAdmin = await Admin.findOne({ username });
      if (existingAdmin && existingAdmin._id.toString() !== adminId) {
        return res.status(400).json({
          success: false,
          error: "Username already exists"
        });
      }
    }

    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name;
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    
    // Hash new password if provided
    if (password) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(
      adminId,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Admin updated successfully",
      admin: updatedAdmin
    });
  } catch (error) {
    console.error("Error updating admin:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: "Invalid admin ID"
      });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: errors.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      error: "Server error while updating admin"
    });
  }
};

// DELETE ADMIN
const deleteAdmin = async (req, res) => {
  try {
    const adminId = req.params.id;
    
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        error: "Admin not found"
      });
    }

    // Prevent deletion of superadmin accounts (optional safety check)
    if (admin.role === 'superadmin') {
      const superadminCount = await Admin.countDocuments({ role: 'superadmin' });
      if (superadminCount <= 1) {
        return res.status(400).json({
          success: false,
          error: "Cannot delete the only superadmin account"
        });
      }
    }

    await Admin.findByIdAndDelete(adminId);
    
    res.status(200).json({
      success: true,
      message: "Admin deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting admin:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: "Invalid admin ID"
      });
    }
    
    res.status(500).json({
      success: false,
      error: "Server error while deleting admin"
    });
  }
};

module.exports = { 
  createAdmin,
  loginAdmin, 
  getAllAdmins, 
  getAdminById, 
  updateAdmin, 
  deleteAdmin 
};