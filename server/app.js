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
const DEFAULT_FRONTEND_ORIGIN = 'https://real-estate-app-client-amber.vercel.app';

const normalizeOrigin = (value) => String(value || '').trim().replace(/\/+$/, '');
const allowedOrigins = new Set(
  [
    process.env.FRONTEND_ORIGIN,
    process.env.FRONTEND_URL,
    DEFAULT_FRONTEND_ORIGIN
  ]
    .filter(Boolean)
    .map(normalizeOrigin)
);

if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_ORIGIN && !process.env.FRONTEND_URL) {
  console.warn('[CORS] FRONTEND_ORIGIN is missing. Falling back to the default production frontend domain.');
}

console.log('[CORS] Allowed origins:', Array.from(allowedOrigins).join(', '));

if (process.env.NODE_ENV !== 'production') {
  [
    'http://localhost:4200',
    'http://127.0.0.1:4200',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ].forEach(origin => allowedOrigins.add(normalizeOrigin(origin)));
}

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    const normalizedOrigin = normalizeOrigin(origin);
    if (allowedOrigins.has(normalizedOrigin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200
};

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/estateiq';
mongoose.connect(mongoURI)
  .then(() => console.log('[DB] MongoDB connected'))
  .catch(err => console.error('[DB] MongoDB error:', err.message));

// Core middleware - MUST be before routes
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'EstateIQ API',
    endpoints: [
      '/api/health',
      '/api/auth',
      '/api/properties',
      '/api/valuation',
      '/api/dashboard',
      '/api/market',
      '/api/upload'
    ]
  });
});

// Route handlers - Import and mount AFTER core middleware
const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const valuationRoutes = require('./routes/valuationRoutes');
const searchRoutes = require('./routes/searchRoutes');
const investmentRoutes = require('./routes/investmentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const marketRoutes = require('./routes/marketRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/properties', searchRoutes);
app.use('/api/properties', investmentRoutes);
app.use('/api/upload', uploadRoutes);
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

// Start server only when running locally
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`[SERVER] EstateIQ running on port ${PORT}`);
  });
}

module.exports = app;
