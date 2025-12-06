// controllers/userController.js (OTP REQUIRED FOR EVERY LOGIN EXCEPT GOOGLE AUTH)
const User = require("../models/UserModel");
const PricingPlan = require("../models/Pricing"); // ADD THIS IMPORT
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const ExcelJS = require("exceljs");
const csv = require("csv-parser");
const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");
const { OAuth2Client } = require("google-auth-library");

// Initialize Google OAuth2 client with proper configuration
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Function to generate a 6-digit numeric OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Configure Nodemailer transporter with correct security settings for Hostinger
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true, // Use SSL/TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Send OTP Email
const sendOTPEmail = async (email, name, otp) => {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: "Email Verification OTP - PDF Works",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="text-align: center; color: #333;">Email Verification</h2>
        <p>Hi ${name},</p>
        <p>Thank you for using PDF Works! Please use the following OTP to verify your login. This OTP is valid for 10 minutes.</p>
        <p style="text-align: center; font-size: 24px; font-weight: bold; color: #fff; background-color: #8A2BE2; padding: 15px; border-radius: 8px; letter-spacing: 2px;">${otp}</p>
        <p>If you did not request this verification, please ignore this email.</p>
        <p style="margin-top: 30px; font-size: 12px; color: #666;">This is an automated message, please do not reply to this email.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

// SEND OTP FOR VERIFICATION
const sendVerificationOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Generate OTP and set expiry (10 minutes)
    const otp = generateOTP();
    const tokenExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    user.emailVerificationToken = otp;
    user.emailVerificationExpires = tokenExpiry;
    await user.save();

    // Send OTP email
    await sendOTPEmail(user.email, user.name, otp);

    res.json({
      success: true,
      message: "OTP sent to your email for verification",
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send OTP",
    });
  }
};

// VERIFY OTP AND COMPLETE LOGIN/REGISTRATION
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: "Email and OTP are required",
      });
    }

    const user = await User.findOne({
      email,
      emailVerificationToken: otp,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired OTP",
      });
    }

    // Mark email as verified and clear OTP fields
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Generate JWT token for immediate login
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      success: true,
      message: "Email verified successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        planName: user.planName,
        billingCycle: user.billingCycle,
        subscriptionStatus: user.subscriptionStatus,
        planExpiry: user.planExpiry,
        usage: user.usage,
        autoRenewal: user.autoRenewal,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to verify OTP",
    });
  }
};

// RESEND OTP
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Generate new OTP and set expiry (10 minutes)
    const otp = generateOTP();
    const tokenExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    user.emailVerificationToken = otp;
    user.emailVerificationExpires = tokenExpiry;
    await user.save();

    // Send new OTP email
    await sendOTPEmail(user.email, user.name, otp);

    res.json({
      success: true,
      message: "New OTP sent to your email",
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to resend OTP",
    });
  }
};

// GOOGLE AUTH: Generate Google OAuth URL
const getGoogleAuthURL = (req, res) => {
  try {
    const authUrl = googleClient.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
      prompt: "consent",
    });

    res.json({
      success: true,
      authUrl,
    });
  } catch (error) {
    console.error("Google auth URL error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate Google auth URL",
    });
  }
};

// GOOGLE AUTH: Handle Google callback and authenticate user
const googleAuthCallback = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: "Authorization code is required",
      });
    }

    // Exchange code for tokens
    const { tokens } = await googleClient.getToken(code);
    googleClient.setCredentials(tokens);

    // Get user info from Google
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    // Check if user already exists
    let user = await User.findOne({
      $or: [{ email }, { googleId }],
    });

    if (user) {
      // Update user with Google ID if not already set
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      // Create new user with Google auth
      const defaultPassword = await bcrypt.hash(googleId + Date.now(), 10);

      user = new User({
        name,
        email,
        password: defaultPassword,
        googleId,
        role: "user",
        planName: "Free",
        subscriptionStatus: "active",
        billingCycle: "monthly",
        isEmailVerified: true, // Google users are automatically verified
        usage: {
          conversions: 0,
          compressions: 0,
          ocr: 0,
          signatures: 0,
          edits: 0,
          organizes: 0,
          securityOps: 0,
          operations: 0,
          storageUsedBytes: 0,
          editTools: 0,
          organizeTools: 0,
          securityTools: 0,
          optimizeTools: 0,
          advancedTools: 0,
          resetDate: new Date(),
        },
      });
      await user.save();
    }

    // Generate JWT token for immediate login (NO OTP for Google users)
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Redirect to frontend with success
    const redirectUrl = `${process.env.FRONTEND_URL}/login?googleSuccess=true`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error("Google auth callback error:", error);
    const errorRedirectUrl = `${process.env.FRONTEND_URL}/login?error=google_auth_failed`;
    res.redirect(errorRedirectUrl);
  }
};

// GOOGLE AUTH: Direct authentication (for frontend) - UPDATED VERSION (NO OTP)
const googleAuth = async (req, res) => {
  try {
    const { token: googleToken } = req.body;

    if (!googleToken) {
      return res.status(400).json({
        success: false,
        error: "Google token is required",
      });
    }

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    // Check if user already exists
    let user = await User.findOne({
      $or: [{ email }, { googleId }],
    });

    if (user) {
      // Update user with Google ID if not already set
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      // Create new user with Google auth
      const defaultPassword = await bcrypt.hash(googleId + Date.now(), 10);

      user = new User({
        name,
        email,
        password: defaultPassword,
        googleId,
        role: "user",
        planName: "Free",
        subscriptionStatus: "active",
        billingCycle: "monthly",
        isEmailVerified: true, // Google users are automatically verified
        usage: {
          conversions: 0,
          compressions: 0,
          ocr: 0,
          signatures: 0,
          edits: 0,
          organizes: 0,
          securityOps: 0,
          operations: 0,
          storageUsedBytes: 0,
          editTools: 0,
          organizeTools: 0,
          securityTools: 0,
          optimizeTools: 0,
          advancedTools: 0,
          resetDate: new Date(),
        },
      });
      await user.save();
    }

    // Generate JWT token for immediate login (NO OTP for Google users)
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      success: true,
      message: "Google authentication successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        planName: user.planName,
        billingCycle: user.billingCycle,
        subscriptionStatus: user.subscriptionStatus,
        planExpiry: user.planExpiry,
        usage: user.usage,
        autoRenewal: user.autoRenewal,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({
      success: false,
      error: "Google authentication failed",
      details: error.message,
    });
  }
};

// REGISTER USER (WITH OTP SEND)
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ success: false, error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP for email verification
    const otp = generateOTP();
    const tokenExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      emailVerificationToken: otp,
      emailVerificationExpires: tokenExpiry,
      isEmailVerified: false,
      // Default subscription values
      planName: "Free",
      subscriptionStatus: "active",
      billingCycle: "monthly",
      usage: {
        conversions: 0,
        compressions: 0,
        ocr: 0,
        signatures: 0,
        edits: 0,
        organizes: 0,
        securityOps: 0,
        operations: 0,
        storageUsedBytes: 0,
        editTools: 0,
        organizeTools: 0,
        securityTools: 0,
        optimizeTools: 0,
        advancedTools: 0,
        resetDate: new Date(),
      },
    });
    await newUser.save();

    // Send OTP email
    await sendOTPEmail(email, name, otp);

    res.status(201).json({
      success: true,
      message:
        "User registered successfully. Please check your email for verification OTP.",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        plan: newUser.plan,
        planName: newUser.planName,
        subscriptionStatus: newUser.subscriptionStatus,
        isEmailVerified: newUser.isEmailVerified,
      },
      requiresVerification: true,
    });
  } catch (error) {
    console.error("Register user error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// LOGIN USER (WITH OTP REQUIRED FOR EVERY LOGIN)
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid credentials" });
    }

    // ALWAYS send OTP for login (regardless of verification status)
    const otp = generateOTP();
    const tokenExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    user.emailVerificationToken = otp;
    user.emailVerificationExpires = tokenExpiry;
    await user.save();

    // Send OTP email
    await sendOTPEmail(user.email, user.name, otp);

    return res.status(403).json({
      success: false,
      error: "OTP verification required",
      requiresVerification: true,
      message: "Please enter the OTP sent to your email to login.",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// FORGOT PASSWORD
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Generate a 6-digit OTP
    const otp = generateOTP();
    const tokenExpiry = Date.now() + 3600000; // 1 hour

    user.resetPasswordToken = otp;
    user.resetPasswordExpires = tokenExpiry;
    await user.save();

    // Send the password reset email
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: user.email,
      subject: "Password Reset OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="text-align: center; color: #333;">Password Reset</h2>
          <p>Hi ${user.name},</p>
          <p>You requested a password reset for your account. Please use the following code to reset your password. This code is valid for 1 hour.</p>
          <p style="text-align: center; font-size: 24px; font-weight: bold; color: #fff; background-color: #8A2BE2; padding: 15px; border-radius: 8px; letter-spacing: 2px;">${otp}</p>
          <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
        </div>
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Email send error:", error);
        return res
          .status(500)
          .json({ success: false, error: "Error sending email" });
      }
      res.status(200).json({
        success: true,
        message: "Password reset OTP sent to your email",
      });
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// RESET PASSWORD
const resetPassword = async (req, res) => {
  try {
    const { otp, newPassword } = req.body; // Correctly get 'otp' from the body

    // Find user by OTP and check for expiry
    const user = await User.findOne({
      resetPasswordToken: otp, // Use 'otp' for the database query
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid or expired OTP" });
    }

    // Hash the new password and save
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password has been reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// GET CURRENT USER PROFILE
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        planName: user.planName,
        billingCycle: user.billingCycle,
        subscriptionStatus: user.subscriptionStatus,
        planExpiry: user.planExpiry,
        usage: user.usage,
        autoRenewal: user.autoRenewal,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// UPDATE USER PROFILE
const updateUserProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: "Name is required",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        name: name.trim(),
      },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        planName: user.planName,
        billingCycle: user.billingCycle,
        subscriptionStatus: user.subscriptionStatus,
        planExpiry: user.planExpiry,
        usage: user.usage,
        autoRenewal: user.autoRenewal,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update profile",
    });
  }
};

// UPDATE USER TO FREE PLAN
const updateToFreePlan = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        plan: null,
        planName: "Free",
        subscriptionStatus: "active",
        billingCycle: "monthly",
        autoRenewal: false,
        usage: {
          conversions: 0,
          compressions: 0,
          ocr: 0,
          signatures: 0,
          edits: 0,
          organizes: 0,
          securityOps: 0,
          operations: 0,
          storageUsedBytes: 0,
          editTools: 0,
          organizeTools: 0,
          securityTools: 0,
          optimizeTools: 0,
          advancedTools: 0,
          resetDate: new Date(),
        },
      },
      { new: true }
    ).select("-password");

    res.json({
      success: true,
      message: "Plan updated to Free",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        planName: user.planName,
        billingCycle: user.billingCycle,
        subscriptionStatus: user.subscriptionStatus,
        usage: user.usage,
      },
    });
  } catch (error) {
    console.error("Update to free plan error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update plan",
    });
  }
};

// GET ALL USERS (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, "-password"); // exclude password
    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// EXPORT USERS TO EXCEL (Admin only)
const exportUsers = async (req, res) => {
  try {
    const users = await User.find({}, "-password").sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Users");

    // Add headers
    worksheet.columns = [
      { header: "Name", key: "name", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Role", key: "role", width: 15 },
      { header: "Plan", key: "planName", width: 15 },
      { header: "Subscription Status", key: "subscriptionStatus", width: 20 },
      { header: "Billing Cycle", key: "billingCycle", width: 15 },
      { header: "Email Verified", key: "isEmailVerified", width: 15 },
      { header: "Joined Date", key: "createdAt", width: 20 },
      { header: "User ID", key: "userId", width: 30 },
    ];

    // Style headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE6E6FA" },
    };

    // Add data
    users.forEach((user) => {
      worksheet.addRow({
        name: user.name,
        email: user.email,
        role: user.role,
        planName: user.planName,
        subscriptionStatus: user.subscriptionStatus,
        billingCycle: user.billingCycle,
        isEmailVerified: user.isEmailVerified ? "Yes" : "No",
        createdAt: user.createdAt.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        userId: user._id.toString(),
      });
    });

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=users-${
        new Date().toISOString().split("T")[0]
      }.xlsx`
    );

    // Send file
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Export users error:", error);
    res.status(500).json({
      success: false,
      error: "Export failed",
      message: error.message,
    });
  }
};

// DOWNLOAD USER IMPORT TEMPLATE (Admin only)
const downloadUserTemplate = async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("User Import Template");

    // Add headers with styling - NO PASSWORD FIELD
    worksheet.columns = [
      { header: "Name", key: "name", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Role", key: "role", width: 15 },
      { header: "Plan", key: "planName", width: 15 },
      // No Joined Date - it will be auto-generated
    ];

    // Style headers
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4F46E5" },
    };
    worksheet.getRow(1).alignment = { horizontal: "center" };

    // Add example data - NO PASSWORD
    const examples = [
      {
        name: "John Doe",
        email: "john.doe@example.com",
        role: "user",
        planName: "Free",
      },
      { 
        name: "Jane Smith",
        email: "jane.smith@example.com",
        role: "admin",
        planName: "Professional",
      },
      {
        name: "Mike Johnson",
        email: "mike.johnson@example.com",
        role: "user",
        planName: "Free",
      },
    ];

    examples.forEach((example) => {
      worksheet.addRow(example);
    });

    // Add instructions - UPDATED FOR NO PASSWORD
    worksheet.addRow([]);
    worksheet.addRow(["Instructions:"]);
    worksheet.addRow([
      "1. Fill in your user data following the examples above",
    ]);
    worksheet.addRow(["2. Required fields: Name, Email"]);
    worksheet.addRow([
      '3. Optional fields: Role (default: "user"), Plan (default: "Free")',
    ]);
    worksheet.addRow(["4. Email addresses must be unique"]);
    worksheet.addRow([
      "5. Joined Date will be automatically set to import time",
    ]);
    worksheet.addRow(["6. Remove example rows before importing your data"]);
    worksheet.addRow(["7. Save file as .xlsx or .csv before importing"]);

    // Style instructions
    for (let i = 3; i <= 10; i++) {
      worksheet.getRow(i).font = { italic: true, color: { argb: "FF6B7280" } };
    }

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=user-import-template.xlsx"
    ); 

    // Send file
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Download user template error:", error);
    res.status(500).json({
      success: false,
      error: "Template download failed",
      message: error.message,
    });
  }
};

// IMPORT USERS FROM CSV/EXCEL (Admin only)
const importUsers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    let users = [];

    // Parse file based on extension
    if (fileExtension === ".csv") {
      users = await parseUserCSV(filePath);
    } else if (fileExtension === ".xlsx" || fileExtension === ".xls") {
      users = await parseUserExcel(filePath);
    } else {
      // Clean up uploaded file
      fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        error: "Unsupported file format. Please upload CSV or Excel files.",
      });
    }

    if (users.length === 0) {
      // Clean up uploaded file
      fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        error: "No valid user data found in the file.",
      });
    }

    // Process and save users
    const results = await processUsers(users);

    // Clean up uploaded file after processing
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: `Import completed successfully. ${results.added} new users added. ${results.skipped} duplicates skipped.`,
      data: {
        totalProcessed: users.length,
        added: results.added,
        skipped: results.skipped,
        errors: results.errors,
      },
    });
  } catch (error) {
    console.error("Import users error:", error);

    // Clean up uploaded file in case of error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      error: "Import failed",
      message: error.message,
    });
  }
};

// Parse CSV file for users
const parseUserCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const users = [];

    fs.createReadStream(filePath)
      .pipe(
        csv({
          mapHeaders: ({ header }) => header.trim().toLowerCase(),
          mapValues: ({ value }) => value.trim(),
        })
      )
      .on("data", (row) => {
        users.push(row);
      })
      .on("end", () => {
        resolve(users);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
};

// Parse Excel file for users
const parseUserExcel = (filePath) => {
  return new Promise((resolve, reject) => {
    try {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

      if (data.length < 2) {
        resolve([]);
        return;
      }

      // Get headers (first row)
      const headers = data[0].map((header) =>
        header ? header.toString().trim().toLowerCase() : ""
      );

      // Process data rows
      const users = [];
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const user = {};

        headers.forEach((header, index) => {
          if (header && row[index] !== undefined) {
            user[header] = row[index] ? row[index].toString().trim() : "";
          }
        });

        // Only add if there's at least name and email (NO PASSWORD REQUIRED)
        if (user.name && user.email) {
          users.push(user);
        }
      }

      resolve(users);
    } catch (error) {
      reject(error);
    }
  });
};

// Process and save users to database
const processUsers = async (users) => {
  const results = {
    added: 0,
    skipped: 0,
    errors: [],
  };

  for (const userData of users) {
    try {
      // Map and validate data - NO PASSWORD
      const name = userData.name || userData.Name;
      const email = userData.email || userData.Email;
      const role = userData.role || userData.Role || "user";
      const planName =
        userData.planname || userData.planName || userData.Plan || "Free";

      if (!name || !email) {
        results.errors.push("Missing required fields (name or email) in row");
        continue;
      }

      // Check for duplicate email
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        results.skipped++;
        continue;
      }

      // Generate a default password (users can reset via forgot password)
      const defaultPassword = await bcrypt.hash("TempPassword123!", 10);

      // Create new user with subscription fields
      const user = new User({
        name: name,
        email: email.toLowerCase(),
        password: defaultPassword, // Set default password
        role: role,
        planName: planName,
        subscriptionStatus: "active",
        billingCycle: "monthly",
        isEmailVerified: false, // OTP required for imported users too
        usage: {
          conversions: 0,
          compressions: 0,
          ocr: 0,
          signatures: 0,
          edits: 0,
          organizes: 0,
          securityOps: 0,
          operations: 0,
          storageUsedBytes: 0,
          editTools: 0,
          organizeTools: 0,
          securityTools: 0,
          optimizeTools: 0,
          advancedTools: 0,
          resetDate: new Date(),
        },
        // createdAt is automatically set by MongoDB
      });

      await user.save();
      results.added++;
    } catch (error) {
      if (error.code === 11000) {
        results.skipped++;
      } else {
        results.errors.push(
          `Error processing ${userData.email}: ${error.message}`
        );
      }
    }
  }

  return results;
};

// NEW: GET USER USAGE LIMITS (UPDATED WITH EDIT TOOLS)
const getUserLimits = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    let plan = null;

    // Get user's plan
    if (user.plan) {
      plan = await PricingPlan.findById(user.plan);
    }

    if (!plan && user.planName) {
      plan = await PricingPlan.findOne({
        $or: [{ planId: user.planName.toLowerCase() }, { name: user.planName }],
      });
    }

    // Fallback to free plan
    if (!plan) {
      plan = await PricingPlan.findOne({ planId: "free" });
    }

    // Ensure usage object has all required fields
    const defaultUsage = {
      conversions: 0,
      compressions: 0,
      ocr: 0,
      signatures: 0,
      edits: 0,
      organizes: 0,
      securityOps: 0,
      operations: 0,
      storageUsedBytes: 0,

      // NEW: Tool-specific usage tracking
      editTools: 0,
      organizeTools: 0,
      securityTools: 0,
      optimizeTools: 0,
      advancedTools: 0,

      resetDate: new Date(),
    };

    // Merge with existing usage, filling in missing fields
    const userUsage = { ...defaultUsage, ...(user.usage || {}) };

    // Calculate usage percentages
    const conversionPercentage =
      plan?.conversionLimit > 0
        ? Math.min(100, (userUsage.conversions / plan.conversionLimit) * 100)
        : 0;

    const editToolsPercentage =
      plan?.editToolsLimit > 0
        ? Math.min(100, (userUsage.editTools / plan.editToolsLimit) * 100)
        : 0;

    const organizeToolsPercentage =
      plan?.organizeToolsLimit > 0
        ? Math.min(
            100,
            (userUsage.organizeTools / plan.organizeToolsLimit) * 100
          )
        : 0;

    const securityToolsPercentage =
      plan?.securityToolsLimit > 0
        ? Math.min(
            100,
            (userUsage.securityTools / plan.securityToolsLimit) * 100
          )
        : 0;

    const optimizeToolsPercentage =
      plan?.optimizeToolsLimit > 0
        ? Math.min(
            100,
            (userUsage.optimizeTools / plan.optimizeToolsLimit) * 100
          )
        : 0;

    const advancedToolsPercentage =
      plan?.advancedToolsLimit > 0
        ? Math.min(
            100,
            (userUsage.advancedTools / plan.advancedToolsLimit) * 100
          )
        : 0;

    res.json({
      success: true,
      usage: userUsage,
      usagePercentages: {
        conversions: conversionPercentage,
        editTools: editToolsPercentage,
        organizeTools: organizeToolsPercentage,
        securityTools: securityToolsPercentage,
        optimizeTools: optimizeToolsPercentage,
        advancedTools: advancedToolsPercentage,
      },
      plan: {
        name: plan?.name || "Free",
        planId: plan?.planId || "free",
        conversionLimit: plan?.conversionLimit || 10,
        // NEW: Tool-specific limits
        editToolsLimit: plan?.editToolsLimit || 5,
        organizeToolsLimit: plan?.organizeToolsLimit || 5,
        securityToolsLimit: plan?.securityToolsLimit || 3,
        optimizeToolsLimit: plan?.optimizeToolsLimit || 3,
        advancedToolsLimit: plan?.advancedToolsLimit || 0,
        maxFileSize: plan?.maxFileSize || 5,
        storage: plan?.storage || 1,

        // Feature toggles
        hasOCR: plan?.hasOCR || false,
        hasBatchProcessing: plan?.hasBatchProcessing || false,
        hasDigitalSignatures: plan?.hasDigitalSignatures || false,
        hasWatermarks: plan?.hasWatermarks || false,
        hasAPIAccess: plan?.hasAPIAccess || false,
        hasTeamCollaboration: plan?.hasTeamCollaboration || false,
      },
      subscriptionStatus: user.subscriptionStatus,
      planExpiry: user.planExpiry,
      // Add cycle information
      cycleInfo: user.getCycleDates
        ? user.getCycleDates()
        : {
            daysRemaining: 30,
            cycleStart: new Date(user.usage?.resetDate || user.createdAt),
            cycleEnd: new Date(
              new Date(user.usage?.resetDate || user.createdAt).getTime() +
                30 * 24 * 60 * 60 * 1000
            ),
          },
    });
  } catch (error) {
    console.error("Error fetching user limits:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch user limits",
    });
  }
};

// CHECK TOP-UP ELIGIBILITY (UPDATED - DYNAMIC PLAN CHECK)
const checkTopupEligibility = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get the actual plan details from PricingPlan
    let planDetails = null;
    
    // If user has plan ObjectId, fetch the pricing plan
    if (user.plan) {
      planDetails = await PricingPlan.findById(user.plan);
    }
    
    // If no plan found by ID, try to find by planName
    if (!planDetails && user.planName) {
      planDetails = await PricingPlan.findOne({
        $or: [
          { planId: user.planName.toLowerCase() },
          { name: user.planName }
        ]
      });
    }

    // Check if it's a free plan
    const isFreePlan = planDetails ? 
      planDetails.planId === "free" || planDetails.price === 0 : 
      (user.planName || "").toLowerCase() === "free";
    
    // Check subscription status
    const hasActiveSubscription = user.subscriptionStatus === "active";
    
    // User is eligible if:
    // 1. Has active subscription
    // 2. NOT on a free plan
    // 3. Plan has a price > 0 (paid plan)
    const isEligible = hasActiveSubscription && 
                      !isFreePlan && 
                      (planDetails ? planDetails.price > 0 : true);

    return res.json({
      success: true,
      eligible: isEligible,
      userPlan: planDetails ? planDetails.planId : null,
      planName: planDetails ? planDetails.name : user.planName || "Unknown",
      subscriptionStatus: user.subscriptionStatus,
      message: isEligible 
        ? "You are eligible to purchase top-up credits"
        : !hasActiveSubscription
          ? "Your subscription is not active"
          : isFreePlan
            ? "Top-up credits are only available for paid subscriptions"
            : "You are not eligible for top-up credits",
      debug: {
        userPlanId: user.plan,
        userPlanName: user.planName,
        foundPlanId: planDetails?.planId,
        foundPlanName: planDetails?.name,
        planPrice: planDetails?.price,
        isFreePlan,
        hasActiveSubscription
      }
    });
  } catch (error) {
    console.error("Check topup eligibility error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check eligibility",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  updateToFreePlan,
  getAllUsers,
  exportUsers,
  downloadUserTemplate,
  importUsers,
  getUserLimits,
  updateUserProfile,
  // Google Auth exports
  getGoogleAuthURL,
  googleAuthCallback,
  googleAuth,
  // OTP Verification exports
  sendVerificationOTP,
  verifyOTP,
  resendOTP,
  checkTopupEligibility,
};
