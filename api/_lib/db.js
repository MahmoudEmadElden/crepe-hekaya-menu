/**
 * MongoDB Connection Utility (Cached for Vercel Serverless)
 * Reuses existing connection across invocations in the same container.
 */
const mongoose = require('mongoose');
const dns = require('dns');

try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {}


let cachedConnection = null;

async function connectDB() {
  if (cachedConnection && cachedConnection.readyState === 1) {
    return cachedConnection;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    const conn = await mongoose.connect(uri, {
      bufferCommands: false,
      maxPoolSize: 10, // Optimize for M0 free tier (prevents exceeding 500 connection limit)
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    cachedConnection = conn.connection;
    return cachedConnection;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    throw error;
  }
}

module.exports = { connectDB };
