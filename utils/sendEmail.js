const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

const emailStyles = `
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f5f7fa; }
    .wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #2FC0C9, #1a8fa5); padding: 32px 40px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.5px; }
    .header p { color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px; }
    .tooth-icon { font-size: 40px; margin-bottom: 10px; display: block; }
    .body { padding: 36px 40px; }
    .greeting { font-size: 18px; color: #1a1a2e; font-weight: 600; margin-bottom: 12px; }
    .message { font-size: 15px; color: #444; line-height: 1.7; margin-bottom: 24px; }
    .card { background: #f0fbfc; border-left: 4px solid #2FC0C9; border-radius: 8px; padding: 20px 24px; margin-bottom: 24px; }
    .card-title { font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #2FC0C9; font-weight: 700; margin-bottom: 14px; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0f5f7; font-size: 14px; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #666; font-weight: 500; }
    .detail-value { color: #1a1a2e; font-weight: 600; text-align: right; }
    .cta-section { text-align: center; margin: 28px 0; }
    .cta-btn { display: inline-block; background: linear-gradient(135deg, #2FC0C9, #1a8fa5); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 30px; font-size: 15px; font-weight: 600; }
    .divider { height: 1px; background: #eee; margin: 28px 0; }
    .footer { background: #1a1a2e; padding: 28px 40px; text-align: center; }
    .footer p { color: #aaa; font-size: 13px; margin: 4px 0; }
    .footer a { color: #2FC0C9; text-decoration: none; }
    .contact-row { display: flex; justify-content: center; gap: 24px; margin-top: 12px; flex-wrap: wrap; }
    .contact-item { color: #ccc; font-size: 13px; }
    .badge { display: inline-block; background: #e8f9fa; color: #2FC0C9; border: 1px solid #b8e8ec; border-radius: 20px; padding: 4px 14px; font-size: 13px; font-weight: 600; margin-top: 8px; }
  </style>
`;

/**
 * Send appointment confirmation email to patient
 */
const sendPatientConfirmationEmail = async (appointment) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('[Email] SMTP not configured. Skipping patient email.');
    return;
  }

  const transporter = createTransporter();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>${emailStyles}</head>
    <body>
      <div class="wrapper">
        <div class="header">
          <span class="tooth-icon">🦷</span>
          <h1>LOL Dental by Dr. Sparsh</h1>
          <p>Your Friendly Neighbourhood Dentist</p>
        </div>
        <div class="body">
          <p class="greeting">Hello ${appointment.name}! 👋</p>
          <p class="message">
            Thank you for choosing <strong>LOL Dental by Dr. Sparsh</strong>. 
            Your appointment has been received and is currently <strong>pending confirmation</strong>. 
            We'll reach out to confirm your slot shortly.
          </p>
          
          <div class="card">
            <div class="card-title">📋 Appointment Details</div>
            <div class="detail-row">
              <span class="detail-label">Patient Name</span>
              <span class="detail-value">${appointment.name}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Service</span>
              <span class="detail-value">${appointment.service}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date</span>
              <span class="detail-value">${appointment.date}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Time Slot</span>
              <span class="detail-value">${appointment.timeSlot}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Doctor</span>
              <span class="detail-value">Dr. Sparsh Sharma, BDS</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status</span>
              <span class="detail-value"><span class="badge">⏳ Pending Confirmation</span></span>
            </div>
          </div>

          <div class="card">
            <div class="card-title">📍 Clinic Information</div>
            <div class="detail-row">
              <span class="detail-label">Address</span>
              <span class="detail-value" style="max-width:300px;">Plot No. 91, Shri Narsingh Vihar Colony, above Culture Cafe, near SKIT College, Jagatpura, Jaipur, Rajasthan 302017</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Phone</span>
              <span class="detail-value">+91 9229090268</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">WhatsApp</span>
              <span class="detail-value">+91 9229090268</span>
            </div>
          </div>

          <p class="message" style="font-size:14px; color:#666;">
            ⏰ <strong>Clinic Hours:</strong> Monday–Saturday, 9:00 AM – 7:00 PM<br>
            📵 Closed on Sundays
          </p>

          <div class="cta-section">
            <a href="https://wa.me/919229090268" class="cta-btn">💬 Chat on WhatsApp</a>
          </div>

          <div class="divider"></div>
          <p class="message" style="font-size:13px; color:#999;">
            If you need to reschedule or cancel, please contact us at least 2 hours before your appointment. 
            We look forward to giving you a healthy, beautiful smile! 😊
          </p>
        </div>
        <div class="footer">
          <p><strong style="color:#2FC0C9;">LOL Dental by Dr. Sparsh</strong></p>
          <p>Best Dental Clinic in Jagatpura | Multispeciality Dental Care</p>
          <div class="contact-row">
            <span class="contact-item">📞 +91 9229090268</span>
            <span class="contact-item">✉️ loldentaljagatpura@gmail.com</span>
            <span class="contact-item">🌐 www.loldental.in</span>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"LOL Dental by Dr. Sparsh" <${process.env.SMTP_USER}>`,
    to: appointment.email,
    subject: 'Appointment Confirmed – LOL Dental by Dr. Sparsh',
    html
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Email] Patient confirmation sent to ${appointment.email}`);
  } catch (err) {
    console.error('[Email] Failed to send patient email:', err.message);
  }
};

/**
 * Send new appointment notification to admin/clinic
 */
const sendAdminNotificationEmail = async (appointment) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('[Email] SMTP not configured. Skipping admin email.');
    return;
  }

  const transporter = createTransporter();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>${emailStyles}</head>
    <body>
      <div class="wrapper">
        <div class="header">
          <span class="tooth-icon">🔔</span>
          <h1>New Appointment Alert</h1>
          <p>LOL Dental by Dr. Sparsh — Admin Notification</p>
        </div>
        <div class="body">
          <p class="greeting">New appointment received!</p>
          <p class="message">
            A new appointment has been booked through the website. Please review the details below and confirm the slot.
          </p>
          
          <div class="card">
            <div class="card-title">👤 Patient Details</div>
            <div class="detail-row">
              <span class="detail-label">Name</span>
              <span class="detail-value">${appointment.name}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Phone</span>
              <span class="detail-value">${appointment.phone}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Email</span>
              <span class="detail-value">${appointment.email}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Service Requested</span>
              <span class="detail-value">${appointment.service}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Preferred Date</span>
              <span class="detail-value">${appointment.date}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Preferred Time</span>
              <span class="detail-value">${appointment.timeSlot}</span>
            </div>
            ${appointment.message ? `
            <div class="detail-row">
              <span class="detail-label">Message</span>
              <span class="detail-value">${appointment.message}</span>
            </div>` : ''}
          </div>

          <div class="cta-section">
            <a href="${process.env.APP_URL || 'http://localhost:3000'}/admin/dashboard.html" class="cta-btn">🖥️ View Admin Dashboard</a>
          </div>
        </div>
        <div class="footer">
          <p><strong style="color:#2FC0C9;">LOL Dental Admin System</strong></p>
          <p>This is an automated notification. Do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"LOL Dental Website" <${process.env.SMTP_USER}>`,
    to: process.env.ADMIN_EMAIL || 'loldentaljagatpura@gmail.com',
    subject: `New Appointment: ${appointment.name}`,
    html
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Email] Admin notification sent for appointment by ${appointment.name}`);
  } catch (err) {
    console.error('[Email] Failed to send admin notification:', err.message);
  }
};

/**
 * Send contact form notification to admin
 */
const sendContactNotificationEmail = async (contact) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('[Email] SMTP not configured. Skipping contact email.');
    return;
  }

  const transporter = createTransporter();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>${emailStyles}</head>
    <body>
      <div class="wrapper">
        <div class="header">
          <span class="tooth-icon">📩</span>
          <h1>New Contact Message</h1>
          <p>LOL Dental by Dr. Sparsh — Contact Form</p>
        </div>
        <div class="body">
          <p class="greeting">A new message has been received!</p>
          <div class="card">
            <div class="card-title">✉️ Message Details</div>
            <div class="detail-row">
              <span class="detail-label">Name</span>
              <span class="detail-value">${contact.name}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Phone</span>
              <span class="detail-value">${contact.phone || 'Not provided'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Email</span>
              <span class="detail-value">${contact.email}</span>
            </div>
            <div class="detail-row" style="flex-direction:column; gap:8px;">
              <span class="detail-label">Message</span>
              <span class="detail-value" style="text-align:left; background:#fff; padding:12px; border-radius:6px; margin-top:8px;">${contact.message}</span>
            </div>
          </div>
          <div class="cta-section">
            <a href="${process.env.APP_URL || 'http://localhost:3000'}/admin/dashboard.html" class="cta-btn">🖥️ View Admin Dashboard</a>
          </div>
        </div>
        <div class="footer">
          <p><strong style="color:#2FC0C9;">LOL Dental Admin System</strong></p>
          <p>This is an automated notification.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"LOL Dental Website" <${process.env.SMTP_USER}>`,
    to: process.env.ADMIN_EMAIL || 'loldentaljagatpura@gmail.com',
    subject: `New Contact Message from ${contact.name}`,
    html
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Email] Contact notification sent for message from ${contact.name}`);
  } catch (err) {
    console.error('[Email] Failed to send contact notification:', err.message);
  }
};

module.exports = {
  sendPatientConfirmationEmail,
  sendAdminNotificationEmail,
  sendContactNotificationEmail
};
