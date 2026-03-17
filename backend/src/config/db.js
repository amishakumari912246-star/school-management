const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUrl = process.env.MONGO_URI;
  if (!mongoUrl) {
    console.warn('MONGO_URI is missing. Running backend without database connection.');
    return;
  }

  try {
    await mongoose.connect(mongoUrl);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
