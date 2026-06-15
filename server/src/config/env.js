const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const config = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/vidyaerp',
  JWT_SECRET: process.env.JWT_SECRET || 'changeme_jwt_secret',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'changeme_refresh_secret',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development',
  SCHOOL_ID: process.env.SCHOOL_ID || 'vidyaerp_default',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || 'rzp_test_123456',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || 'testsecret123',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || 'webhooksecret123',
};

module.exports = config;
