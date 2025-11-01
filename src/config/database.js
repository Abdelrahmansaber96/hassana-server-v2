const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// load environment variables from project root .env during local development
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectDB = async () => {
  try {
    // use MONGODB_URI from .env or environment, fallback to DATABASE_URL
    const mongoURI = process.env.MONGODB_URI;
    console.log('Attempting to connect to:', mongoURI);

    if (!mongoURI) {
      console.error('❌ Missing MongoDB connection string. Set MONGODB_URI in your .env or environment.');
      process.exit(1);
    }
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;