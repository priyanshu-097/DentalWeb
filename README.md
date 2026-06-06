# 🦷 LOL Dental by Dr. Sparsh — Full-Stack Dental Clinic Website

A complete, production-ready dental clinic website with a Node.js/Express backend, MongoDB database, JWT admin authentication, Nodemailer email confirmations, and Twilio WhatsApp notifications.

---

## 🌟 Features

- **6 Frontend Pages**: Home, Services, About, Contact, Booking, Admin Dashboard
- **3-step Appointment Booking** with real-time slot availability
- **Admin Dashboard** with JWT authentication, stats, appointment management, contact messages
- **Email Notifications** via Gmail SMTP (patient confirmation + admin alert)
- **WhatsApp Messages** via Twilio API (with wa.me fallback)
- **MongoDB** for data persistence (Appointments + Contacts)
- **Fully responsive** mobile-first design
- **Premium aesthetic** — Cormorant Garamond + Plus Jakarta Sans, teal brand color

---

## 📁 Project Structure

```
lol-dental/
├── server.js                  # Express server entry point
├── .env.example               # Environment variable template
├── package.json
├── /models
│   ├── Appointment.js         # Mongoose model for appointments
│   └── Contact.js             # Mongoose model for contact submissions
├── /routes
│   ├── appointments.js        # Booking + slot availability routes
│   ├── contact.js             # Contact form route
│   └── admin.js               # Protected admin routes (JWT)
├── /middleware
│   └── auth.js                # JWT authentication middleware
├── /utils
│   ├── sendEmail.js           # Nodemailer email utility
│   └── sendWhatsApp.js        # Twilio WhatsApp / wa.me fallback
└── /public                    # All frontend files (served statically)
    ├── index.html             # Homepage
    ├── services.html          # All 12 services
    ├── about.html             # Clinic story + doctor profile
    ├── contact.html           # Contact form + Google Maps
    ├── booking.html           # 3-step appointment booking wizard
    ├── /css/
    │   ├── global.css         # Design system + components
    │   ├── home.css           # Homepage styles
    │   ├── services.css       # Services page styles
    │   ├── about.css          # About page styles
    │   ├── contact.css        # Contact page styles
    │   ├── booking.css        # Booking wizard styles
    │   └── admin.css          # Admin panel styles
    ├── /js/
    │   ├── main.js            # Shared nav, animations, form utils
    │   ├── home.js            # Home page particles
    │   ├── contact.js         # Contact form submission
    │   ├── booking.js         # Booking wizard + slot picker
    │   └── admin.js           # Admin dashboard
    └── /admin/
        ├── index.html         # Admin login page
        └── dashboard.html     # Admin dashboard
```

---

## 🚀 Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/try/download/community) running locally OR MongoDB Atlas connection string

---

### Step 1: Install Dependencies

```bash
cd lol-dental
npm install
```

---

### Step 2: Configure Environment Variables

Copy the example file:
```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/loldental
JWT_SECRET=change_this_to_a_long_random_string_for_production
ADMIN_EMAIL=loldentaljagatpura@gmail.com
ADMIN_PASSWORD=YourSecureAdminPassword

# Gmail SMTP (see setup below)
SMTP_USER=loldentaljagatpura@gmail.com
SMTP_PASS=your_gmail_app_password

# Twilio (optional — uses wa.me fallback if not set)
TWILIO_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
CLINIC_WHATSAPP=whatsapp:+919229090268
```

---

### Step 3: Gmail App Password Setup (for Nodemailer)

1. Go to your Google Account → **Security** tab
2. Enable **2-Step Verification** if not already enabled
3. Search for **"App Passwords"** in the security page
4. Select **"Mail"** as the app, **"Other"** as the device → click Generate
5. Copy the 16-character password → paste into `.env` as `SMTP_PASS`

> **Note:** Regular Gmail passwords won't work. You must use an App Password.

---

### Step 4: Twilio WhatsApp Setup (Optional)

1. Sign up at [twilio.com](https://www.twilio.com/)
2. Navigate to **Messaging → Try it out → Send a WhatsApp message**
3. Follow the Twilio Sandbox setup (send "join [word]" to the sandbox number)
4. Copy your **Account SID** and **Auth Token** from the Console
5. Set them in `.env`

> **Without Twilio:** The app automatically falls back to generating `wa.me` links and logging them to the console. No configuration needed for this fallback.

---

### Step 5: Start MongoDB

```bash
# Local MongoDB
mongod

# Or use MongoDB Atlas (paste connection string in .env MONGODB_URI)
```

---

### Step 6: Run the Application

**Development (with auto-restart):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The server will start at: **http://localhost:3000**

---

## 🔐 Admin Panel Access

1. Navigate to: `http://localhost:3000/admin`
2. Login with credentials from `.env`:
   - Email: `ADMIN_EMAIL`
   - Password: `ADMIN_PASSWORD`
3. Dashboard at: `http://localhost:3000/admin/dashboard.html`

---

## 📡 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/appointments` | Book appointment | No |
| GET | `/api/appointments/slots?date=YYYY-MM-DD` | Get available slots | No |
| POST | `/api/contact` | Submit contact form | No |
| POST | `/api/admin/login` | Admin login → JWT | No |
| GET | `/api/admin/appointments` | All appointments (filtered) | JWT |
| GET | `/api/admin/stats` | Dashboard statistics | JWT |
| PATCH | `/api/admin/appointments/:id` | Update status | JWT |
| DELETE | `/api/admin/appointments/:id` | Delete appointment | JWT |
| GET | `/api/admin/contacts` | All contact messages | JWT |
| GET | `/api/health` | Server health check | No |

---

## ⏰ Slot System

- **Working hours:** 9:00 AM – 7:00 PM
- **Closed:** Sundays
- **Slot duration:** 30 minutes
- **Max bookings per slot:** 2
- Slots dynamically show as available/unavailable based on existing bookings

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Primary | `#2FC0C9` (Teal) |
| Dark | `#1a1a2e` (Charcoal) |
| Accent | `#e8c96d` (Gold) |
| Heading Font | Cormorant Garamond |
| Body Font | Plus Jakarta Sans |

---

## 🚢 Deployment Notes

For production deployment (e.g., Railway, Render, DigitalOcean):

1. Set all `.env` values as environment variables in your hosting dashboard
2. Change `JWT_SECRET` to a long, random, secret string
3. Change `ADMIN_PASSWORD` to a strong password
4. Use **MongoDB Atlas** for the database
5. Update `CLINIC_WHATSAPP` environment variable with the actual clinic WhatsApp

---

## 📞 Clinic Details

- **Name:** LOL Dental by Dr. Sparsh
- **Doctor:** Dr. Sparsh Sharma, BDS (SDM College, Dharwad — RGUHS)
- **Address:** Plot No. 91, Shri Narsingh Vihar Colony, above Culture Cafe, near SKIT College, Jagatpura, Jaipur 302017
- **Phone:** +91 9229090268
- **WhatsApp:** +91 9229090268
- **Email:** loldentaljagatpura@gmail.com
- **Website:** www.loldental.in

---

*Built with ❤️ for LOL Dental by Dr. Sparsh — Jagatpura's Favourite Dentist!* 🦷
