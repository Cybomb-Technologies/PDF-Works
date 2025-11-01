// adminSeed.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./models/AdminModel");
require("dotenv").config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    const existingAdmin = await Admin.findOne({ email: "admin10@gmail.com" });
    if (existingAdmin) {
      console.log("Admin already exists");
      return process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("123456", 10);

    const newAdmin = new Admin({
      name: "admin",
      email: "admin10@gmail.com",
      password: hashedPassword,
      role: "admin"
    });

    await newAdmin.save();
    console.log("Admin created:", newAdmin);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

createAdmin();
