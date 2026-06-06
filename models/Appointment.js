const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Patient name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[0-9+\-\s()]{7,20}$/, 'Please enter a valid phone number']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  service: {
    type: String,
    required: [true, 'Service selection is required'],
    enum: [
      'Smile Designing',
      'Dental Implants',
      'Pediatric Dentistry',
      'Metal Braces',
      'Ceramic Braces',
      'Lingual Braces / Hidden Braces',
      'Self-Ligating Braces',
      'Root Canal Treatment',
      'Teeth Scaling & Polishing',
      'Dentures & Bridges',
      'Invisalign / Clear Aligners',
      'General Dentistry'
    ]
  },
  date: {
    type: String,
    required: [true, 'Appointment date is required']
  },
  timeSlot: {
    type: String,
    required: [true, 'Time slot is required']
  },
  message: {
    type: String,
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters'],
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient slot querying
appointmentSchema.index({ date: 1, timeSlot: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
