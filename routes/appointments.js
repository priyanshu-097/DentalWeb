const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const { sendPatientConfirmationEmail, sendAdminNotificationEmail } = require('../utils/sendEmail');
const { sendPatientWhatsApp, sendClinicOwnerWhatsApp } = require('../utils/sendWhatsApp');

// Generate available time slots for a given date (Mon–Sat, 9 AM – 7 PM, 30-min slots)
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 9; hour < 19; hour++) {
    const h12 = hour > 12 ? hour - 12 : hour;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12Start = h12 === 0 ? 12 : h12;
    slots.push(`${h12Start}:00 ${ampm}`);
    slots.push(`${h12Start}:30 ${ampm}`);
  }
  return slots;
};

// GET /api/appointments/slots?date=YYYY-MM-DD
router.get('/slots', async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Date parameter is required.' });
    }

    // Validate date format
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date format.' });
    }

    // Check if Sunday (0 = Sunday)
    const dayOfWeek = parsedDate.getDay();
    if (dayOfWeek === 0) {
      return res.json({
        success: true,
        available: false,
        message: 'Clinic is closed on Sundays.',
        slots: []
      });
    }

    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parsedDate < today) {
      return res.json({
        success: true,
        available: false,
        message: 'Cannot book appointments for past dates.',
        slots: []
      });
    }

    const allSlots = generateTimeSlots();

    // Get existing bookings for this date (only active ones)
    const existingBookings = await Appointment.find({
      date,
      status: { $nin: ['cancelled'] }
    }).select('timeSlot');

    // Count bookings per slot
    const slotCounts = {};
    existingBookings.forEach(booking => {
      slotCounts[booking.timeSlot] = (slotCounts[booking.timeSlot] || 0) + 1;
    });

    const MAX_PER_SLOT = 2;

    const availableSlots = allSlots.filter(slot => {
      return (slotCounts[slot] || 0) < MAX_PER_SLOT;
    });

    res.json({
      success: true,
      available: availableSlots.length > 0,
      date,
      slots: availableSlots,
      totalSlots: allSlots.length,
      availableCount: availableSlots.length
    });

  } catch (err) {
    console.error('[Slots] Error fetching slots:', err.message);
    res.status(500).json({ success: false, message: 'Server error fetching slots.' });
  }
});

// POST /api/appointments — Book an appointment
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, service, date, timeSlot, message } = req.body;

    // Basic validation
    if (!name || !phone || !email || !service || !date || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields.'
      });
    }

    // Check if slot is still available
    const parsedDate = new Date(date);
    const dayOfWeek = parsedDate.getDay();
    if (dayOfWeek === 0) {
      return res.status(400).json({
        success: false,
        message: 'Clinic is closed on Sundays.'
      });
    }

    const slotCount = await Appointment.countDocuments({
      date,
      timeSlot,
      status: { $nin: ['cancelled'] }
    });

    if (slotCount >= 2) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is fully booked. Please choose another slot.'
      });
    }

    // Create appointment
    const appointment = new Appointment({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      service,
      date,
      timeSlot,
      message: message ? message.trim() : ''
    });

    await appointment.save();

    // Send emails and WhatsApp notifications (non-blocking)
    Promise.all([
      sendPatientConfirmationEmail(appointment),
      sendAdminNotificationEmail(appointment),
      sendPatientWhatsApp(appointment),
      sendClinicOwnerWhatsApp(appointment)
    ]).catch(err => console.error('[Notifications] Error sending notifications:', err.message));

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully! You will receive a confirmation shortly.',
      appointment: {
        id: appointment._id,
        name: appointment.name,
        service: appointment.service,
        date: appointment.date,
        timeSlot: appointment.timeSlot,
        status: appointment.status
      }
    });

  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    console.error('[Appointments] Error creating appointment:', err.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

module.exports = router;
