const User = require("../models/UserModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const ExcelJS = require("exceljs");
const csv = require("csv-parser");
const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");

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

// REGISTER USER
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
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: { id: newUser._id, name: newUser.name, email: newUser.email },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// LOGIN USER
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

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
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
      { header: "Plan", key: "plan", width: 15 },
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
        plan: user.plan,
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
      { header: "Plan", key: "plan", width: 15 },
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
        plan: "free",
      },
      {
        name: "Jane Smith",
        email: "jane.smith@example.com",
        role: "admin",
        plan: "premium",
      },
      {
        name: "Mike Johnson",
        email: "mike.johnson@example.com",
        role: "user",
        plan: "free",
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
      '3. Optional fields: Role (default: "user"), Plan (default: "free")',
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
      const plan = userData.plan || userData.Plan || "free";

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

      // Create new user
      const user = new User({
        name: name,
        email: email.toLowerCase(),
        password: defaultPassword, // Set default password
        role: role,
        plan: plan,
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

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getAllUsers,
  exportUsers,
  downloadUserTemplate,
  importUsers,
};
