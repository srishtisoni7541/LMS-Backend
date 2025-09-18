const mongoose = require("mongoose");
const dotenv = require("dotenv");
const userModel = require("../models/user.model");

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const existingAdmin = await userModel.findOne({ email: "admin@lms.com" });

    if (existingAdmin) {
      console.log("⚠️ Admin already exists");
      process.exit(0);
    }

    const admin = new userModel({
      name: "Srishti Soni",
      email: "admin@lms.com",
      password: "Admin@123", 
      role: "admin",
    });

    await admin.save();

    console.log(" Admin user created successfully!");
    process.exit(0);
  } catch (error) {
    console.error(" Error seeding admin:", error);
    process.exit(1);
  }
};

seedAdmin();
