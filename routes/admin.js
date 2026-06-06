const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Appointment = require('../models/Appointment');
const Contact = require('../models/Contact');
const authMiddleware = require('../middleware/auth');

// POST /api/admin/login — Admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (email !== adminEmail || password !== adminPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { email: adminEmail, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      expiresIn: '24h'
    });

  } catch (err) {
    console.error('[Admin] Login error:', err.message);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// GET /api/admin/appointments — All appointments with filters (protected)
router.get('/appointments', authMiddleware, async (req, res) => {
  try {
    const { date, status, service, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (date) filter.date = date;
    if (status) filter.status = status;
    if (service) filter.service = service;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [appointments, total] = await Promise.all([
      Appointment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Appointment.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: appointments,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (err) {
    console.error('[Admin] Error fetching appointments:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/admin/stats — Dashboard statistics (protected)
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const weekStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);

    const todayStr = todayStart.toISOString().split('T')[0];
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const todayEndStr = todayEnd.toISOString().split('T')[0];

    const [
      totalBookings,
      todayBookings,
      weekBookings,
      pendingCount,
      confirmedCount,
      completedCount,
      cancelledCount,
      totalContacts
    ] = await Promise.all([
      Appointment.countDocuments(),
      Appointment.countDocuments({ date: todayStr }),
      Appointment.countDocuments({ date: { $gte: weekStartStr, $lte: todayStr } }),
      Appointment.countDocuments({ status: 'pending' }),
      Appointment.countDocuments({ status: 'confirmed' }),
      Appointment.countDocuments({ status: 'completed' }),
      Appointment.countDocuments({ status: 'cancelled' }),
      Contact.countDocuments()
    ]);

    res.json({
      success: true,
      stats: {
        totalBookings,
        todayBookings,
        weekBookings,
        pendingCount,
        confirmedCount,
        completedCount,
        cancelledCount,
        totalContacts
      }
    });

  } catch (err) {
    console.error('[Admin] Error fetching stats:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PATCH /api/admin/appointments/:id — Update appointment status (protected)
router.patch('/appointments/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    res.json({
      success: true,
      message: `Appointment status updated to "${status}".`,
      appointment
    });

  } catch (err) {
    console.error('[Admin] Error updating appointment:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE /api/admin/appointments/:id — Delete appointment (protected)
router.delete('/appointments/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findByIdAndDelete(id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    res.json({
      success: true,
      message: 'Appointment deleted successfully.'
    });

  } catch (err) {
    console.error('[Admin] Error deleting appointment:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/admin/contacts — View all contact submissions (protected)
router.get('/contacts', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [contacts, total] = await Promise.all([
      Contact.find().sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Contact.countDocuments()
    ]);

    res.json({
      success: true,
      data: contacts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (err) {
    console.error('[Admin] Error fetching contacts:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
