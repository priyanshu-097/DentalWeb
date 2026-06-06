const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const { sendContactNotificationEmail } = require('../utils/sendEmail');

// POST /api/contact — Save contact form submission
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required.'
      });
    }

    const contact = new Contact({
      name: name.trim(),
      phone: phone ? phone.trim() : '',
      email: email.trim().toLowerCase(),
      message: message.trim()
    });

    await contact.save();

    // Send email notification (non-blocking)
    sendContactNotificationEmail(contact).catch(err =>
      console.error('[Contact] Notification email failed:', err.message)
    );

    res.status(201).json({
      success: true,
      message: "Thank you for reaching out! We'll get back to you within 24 hours."
    });

  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    console.error('[Contact] Error saving contact:', err.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

module.exports = router;
