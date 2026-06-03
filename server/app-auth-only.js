// MINIMAL TEST - Auth Only
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/estateiq')
  .then(() => console.log('[DB] Connected'))
  .catch(err => console.error('[DB] Error:', err.message));

// Auth routes only
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message, err.stack);
  res.status(500).json({ success: false, message: err.message, data: null });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));
