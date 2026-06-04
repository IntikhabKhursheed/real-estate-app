// Set up public DNS servers to resolve MongoDB Atlas SRV records correctly
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsError) {
  console.warn('Warning: Failed to set public DNS servers, falling back to system default:', dnsError.message);
}

// Load environment variables from .env
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), debug: false });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/estateiq';
mongoose.connect(mongoURI)
  .then(() => console.log('[DB] MongoDB connected'))
  .catch(err => console.error('[DB] MongoDB error:', err.message));

// Core middleware - MUST be before routes
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Route handlers - Import and mount AFTER core middleware
const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const valuationRoutes = require('./routes/valuationRoutes');
const searchRoutes = require('./routes/searchRoutes');
const investmentRoutes = require('./routes/investmentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const marketRoutes = require('./routes/marketRoutes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/properties', searchRoutes);
app.use('/api/properties', investmentRoutes);
app.use('/api/valuation', valuationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/market', marketRoutes);

// Error handler - MUST be last
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error',
    data: null
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[SERVER] EstateIQ running on port ${PORT}`);
});

module.exports = app;
