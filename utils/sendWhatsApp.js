let twilioClient = null;
let twilioConfigured = false;

// Initialize Twilio only if credentials are provided
if (
  process.env.TWILIO_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_SID !== 'your_twilio_account_sid' &&
  process.env.TWILIO_AUTH_TOKEN !== 'your_token'
) {
  try {
    const twilio = require('twilio');
    twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
    twilioConfigured = true;
    console.log('[WhatsApp] Twilio configured successfully.');
  } catch (err) {
    console.warn('[WhatsApp] Twilio initialization failed:', err.message);
  }
} else {
  console.log('[WhatsApp] Twilio not configured. Using wa.me fallback.');
}

/**
 * Send WhatsApp message to patient
 */
const sendPatientWhatsApp = async (appointment) => {
  const clinicWhatsApp = process.env.CLINIC_WHATSAPP_NUMBER || '919229090268';

  const message = `Hello ${appointment.name}! 👋 Your appointment at LOL Dental by Dr. Sparsh is confirmed for ${appointment.date} at ${appointment.timeSlot} for ${appointment.service}. For queries, call us at +919229090268. We look forward to seeing you! 😊🦷`;

  if (twilioConfigured && twilioClient) {
    // Remove non-digit characters from phone for WhatsApp formatting
    let patientPhone = appointment.phone.replace(/\D/g, '');
    // Add country code if not present (default to India +91)
    if (patientPhone.length === 10) {
      patientPhone = '91' + patientPhone;
    }

    try {
      const result = await twilioClient.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886',
        to: `whatsapp:+${patientPhone}`,
        body: message
      });
      console.log(`[WhatsApp] Patient message sent. SID: ${result.sid}`);
    } catch (err) {
      console.error('[WhatsApp] Failed to send patient WhatsApp via Twilio:', err.message);
      // Fallback to wa.me link
      const waLink = generateWaLink(patientPhone, message);
      console.log(`[WhatsApp] Fallback wa.me link for patient: ${waLink}`);
    }
  } else {
    // Fallback: log wa.me link
    let patientPhone = appointment.phone.replace(/\D/g, '');
    if (patientPhone.length === 10) patientPhone = '91' + patientPhone;
    const waLink = generateWaLink(patientPhone, message);
    console.log(`[WhatsApp] Patient wa.me fallback link: ${waLink}`);
  }
};

/**
 * Send WhatsApp notification to clinic owner
 */
const sendClinicOwnerWhatsApp = async (appointment) => {
  const clinicWhatsApp = process.env.CLINIC_WHATSAPP_NUMBER || '919229090268';

  const baseUrl = process.env.APP_URL || 'http://localhost:3000';
  const message = `🦷 New Appointment!\nPatient: ${appointment.name}\nPhone: ${appointment.phone}\nService: ${appointment.service}\nDate & Time: ${appointment.date} at ${appointment.timeSlot}\n\nView dashboard: ${baseUrl}/admin/dashboard.html`;

  if (twilioConfigured && twilioClient) {
    try {
      const result = await twilioClient.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886',
        to: process.env.CLINIC_WHATSAPP || `whatsapp:+${clinicWhatsApp}`,
        body: message
      });
      console.log(`[WhatsApp] Clinic owner message sent. SID: ${result.sid}`);
    } catch (err) {
      console.error('[WhatsApp] Failed to send clinic WhatsApp via Twilio:', err.message);
      const waLink = generateWaLink(clinicWhatsApp, message);
      console.log(`[WhatsApp] Fallback wa.me link for clinic: ${waLink}`);
    }
  } else {
    // Fallback: log wa.me link
    const waLink = generateWaLink(clinicWhatsApp, message);
    console.log(`[WhatsApp] Clinic owner wa.me fallback link: ${waLink}`);
    return waLink;
  }
};

/**
 * Generate wa.me deep link with pre-filled message
 */
const generateWaLink = (phone, message) => {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${encoded}`;
};

module.exports = {
  sendPatientWhatsApp,
  sendClinicOwnerWhatsApp,
  generateWaLink,
  twilioConfigured
};
