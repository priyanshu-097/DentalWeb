require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ─────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Static Files ───────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ─── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/admin', require('./routes/admin'));

// ─── SPA Fallback for Admin Panel ──────────────────────────────────────────
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'dashboard.html'));
});

// ─── Health Check ───────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'LOL Dental API is running.',
    timestamp: new Date().toISOString(),
    dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ─── 404 Handler ────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'API endpoint not found.' });
  }
  // For non-API routes, serve index.html (SPA behavior)
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Global Error Handler ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Server] Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred. Please try again.'
  });
});

// ─── MongoDB Connection ──────────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/loldental';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected:', MONGODB_URI);
    app.listen(PORT, () => {
      console.log(`🦷 LOL Dental server running at http://localhost:${PORT}`);
      console.log(`🔒 Admin panel: http://localhost:${PORT}/admin`);
      console.log(`📡 API Health: http://localhost:${PORT}/api/health`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

// ─── Graceful Shutdown ───────────────────────────────────────────────────────
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

module.exports = app;
