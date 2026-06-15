const mongoose = require('mongoose');
const config = require('./env');

const connectDB = async () => {
  try {
    mongoose.set('strictQuery', true);

    const conn = await mongoose.connect(config.MONGO_URI);

    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
