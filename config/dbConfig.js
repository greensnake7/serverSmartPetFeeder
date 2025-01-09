const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Lấy thông tin kết nối từ biến môi trường
    const dbURI = process.env.MONGODB_URI;
    await mongoose.connect(dbURI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
