// Set up public DNS servers to resolve MongoDB Atlas SRV records correctly.
// This is harmless in Vercel and helps local/SRV lookups stay reliable.
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsError) {
  console.warn('[DNS] Failed to set public DNS servers, falling back to system defaults:', dnsError.message);
}

const fs = require('fs');
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Load local env only when it exists. Vercel injects env vars at runtime.
const localEnvPath = path.join(__dirname, '../.env');
if (fs.existsSync(localEnvPath)) {
  require('dotenv').config({ path: localEnvPath, debug: false });
}

const app = express();
app.disable('x-powered-by');

const DEFAULT_FRONTEND_ORIGIN = 'https://real-estate-app-client-amber.vercel.app';
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1' || process.env.VERCEL_ENV === 'production';

const normalizeOrigin = (value) => String(value || '').trim().replace(/\/+$/, '');
const configuredFrontendOrigin = normalizeOrigin(process.env.FRONTEND_ORIGIN) || DEFAULT_FRONTEND_ORIGIN;

const allowedOrigins = new Set();
allowedOrigins.add(configuredFrontendOrigin);

if (!isProduction) {
  [
    'http://localhost:4200',
    'http://127.0.0.1:4200',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ]
    .map(normalizeOrigin)
    .forEach((origin) => allowedOrigins.add(origin));
}

if (isProduction && !process.env.FRONTEND_ORIGIN) {
  console.warn(`[CORS] FRONTEND_ORIGIN is missing. Falling back to ${DEFAULT_FRONTEND_ORIGIN}.`);
}

if (isProduction && !process.env.MONGODB_URI) {
  console.warn('[ENV] MONGODB_URI is missing in production. Database routes will fail until it is set.');
}

if (isProduction && !process.env.JWT_SECRET) {
  console.warn('[ENV] JWT_SECRET is missing in production. Auth tokens may fail until it is set.');
}

console.log('[CORS] Allowed origins:', Array.from(allowedOrigins).join(', '));

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = normalizeOrigin(origin);
    if (allowedOrigins.has(normalizedOrigin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200
};

// Connect to MongoDB once per warm instance.
const mongoURI = process.env.MONGODB_URI || (!isProduction ? 'mongodb://127.0.0.1:27017/estateiq' : '');
if (mongoURI) {
  mongoose
    .connect(mongoURI)
    .then(() => console.log('[DB] MongoDB connected'))
    .catch((err) => console.error('[DB] MongoDB error:', err.message));
}

// Core middleware - MUST be before routes.
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health checks.
const healthPayload = { status: 'ok' };
app.get('/health', (req, res) => {
  res.status(200).json(healthPayload);
});

app.get('/api/health', (req, res) => {
  res.status(200).json(healthPayload);
});

app.get('/', (req, res) => {
  res.status(200).json({
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

// Route handlers - Import and mount AFTER core middleware.
const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const valuationRoutes = require('./routes/valuationRoutes');
const searchRoutes = require('./routes/searchRoutes');
const investmentRoutes = require('./routes/investmentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const marketRoutes = require('./routes/marketRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/properties', searchRoutes);
app.use('/api/properties', investmentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/valuation', valuationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/market', marketRoutes);

// Error handler - MUST be last.
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error',
    data: null
  });
});

module.exports = app;
