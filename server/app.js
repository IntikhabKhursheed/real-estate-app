// Set up public DNS servers to resolve MongoDB Atlas SRV records correctly
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsError) {
  console.warn('Warning: Failed to set public DNS servers, falling back to system default:', dnsError.message);
}

// Load environment variables from .env first before any imports access them
const path = require('path');
const dotenvResult = require('dotenv').config({ path: path.join(__dirname, '../.env') });

if (dotenvResult.error) {
  console.error('ERROR: Failed to load .env file:', dotenvResult.error);
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const valuationRoutes = require('./routes/valuationRoutes');

const app = express();

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/estateiq';
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/valuation', valuationRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`EstateIQ Server Running on Port ${PORT}`);
});

module.exports = app;
