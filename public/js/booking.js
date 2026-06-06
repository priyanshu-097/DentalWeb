// Booking Page — Full Step Wizard + Real-time Slot Picker
document.addEventListener('DOMContentLoaded', () => {
  // ─── Pre-fill service from URL params ─────────────────────
  const params = new URLSearchParams(window.location.search);
  const preService = params.get('service');
  if (preService) {
    const select = document.getElementById('serviceSelect');
    if (select) {
      for (let opt of select.options) {
        if (opt.value === preService) {
          select.value = preService;
          break;
        }
      }
    }
  }

  // ─── Set min date to today ─────────────────────────────────
  const dateInput = document.getElementById('appointmentDate');
  if (dateInput) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateInput.min = `${yyyy}-${mm}-${dd}`;

    // Set max to 60 days from now
    const maxDate = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
    const mxY = maxDate.getFullYear();
    const mxM = String(maxDate.getMonth() + 1).padStart(2, '0');
    const mxD = String(maxDate.getDate()).padStart(2, '0');
    dateInput.max = `${mxY}-${mxM}-${mxD}`;

    dateInput.addEventListener('change', handleDateChange);
  }

  // ─── Terms checkbox ────────────────────────────────────────
  const termsCheck = document.getElementById('termsCheck');
  const submitBtn = document.getElementById('bookingSubmitBtn');
  if (termsCheck && submitBtn) {
    termsCheck.addEventListener('change', () => {
      submitBtn.disabled = !termsCheck.checked;
    });
  }

  // ─── Form submit ───────────────────────────────────────────
  const form = document.getElementById('bookingForm');
  if (form) {
    form.addEventListener('submit', handleBookingSubmit);
  }
});

// ─── Step Navigation ────────────────────────────────────────
function goToStep(step) {
  // Validate before moving forward
  if (step === 2) {
    if (!validateStep1()) return;
  }

  if (step === 3) {
    if (!validateStep2()) return;
    populateSummary();
  }

  // Update step content visibility
  document.querySelectorAll('.booking-step-content').forEach(s => s.classList.remove('active'));
  document.getElementById(`step-${step}`).classList.add('active');

  // Update step indicators
  document.querySelectorAll('.booking-step').forEach((el, i) => {
    el.classList.remove('active', 'completed');
    if (i + 1 === step) {
      el.classList.add('active');
    } else if (i + 1 < step) {
      el.classList.add('completed');
      el.querySelector('.step-num').textContent = '✓';
    } else {
      el.querySelector('.step-num').textContent = i + 1;
    }
  });

  // Scroll to top of form
  document.querySelector('.booking-form-wrap').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── Validate Step 1 ────────────────────────────────────────
function validateStep1() {
  const name = document.getElementById('patientName').value.trim();
  const phone = document.getElementById('patientPhone').value.trim();
  const email = document.getElementById('patientEmail').value.trim();
  const service = document.getElementById('serviceSelect').value;

  if (!name) {
    window.FormUtils.showAlert('booking-alert', 'error', 'Please enter your full name.');
    return false;
  }
  if (!phone || !/^[0-9+\-\s()]{7,20}$/.test(phone)) {
    window.FormUtils.showAlert('booking-alert', 'error', 'Please enter a valid phone number.');
    return false;
  }
  if (!email || !window.FormUtils.validateEmail(email)) {
    window.FormUtils.showAlert('booking-alert', 'error', 'Please enter a valid email address.');
    return false;
  }
  if (!service) {
    window.FormUtils.showAlert('booking-alert', 'error', 'Please select a service.');
    return false;
  }

  // Hide alert if valid
  document.getElementById('booking-alert').classList.remove('show');
  return true;
}

// ─── Validate Step 2 ────────────────────────────────────────
function validateStep2() {
  const date = document.getElementById('appointmentDate').value;
  const slot = document.getElementById('selectedSlot').value;

  if (!date) {
    window.FormUtils.showAlert('booking-alert', 'error', 'Please select a date.');
    return false;
  }
  if (!slot) {
    window.FormUtils.showAlert('booking-alert', 'error', 'Please select a time slot.');
    return false;
  }

  document.getElementById('booking-alert').classList.remove('show');
  return true;
}

// ─── Date Change Handler ─────────────────────────────────────
async function handleDateChange() {
  const date = document.getElementById('appointmentDate').value;
  if (!date) return;

  // Check if Sunday
  const dayOfWeek = new Date(date).getDay();
  if (dayOfWeek === 0) {
    showSlotMessage('📵 Clinic is closed on Sundays. Please select Mon–Sat.');
    clearSlot();
    return;
  }

  // Show loading
  document.getElementById('slotInfo').style.display = 'none';
  document.getElementById('slotLoading').style.display = 'flex';
  document.getElementById('slotsGrid').innerHTML = '';
  clearSlot();

  try {
    const response = await fetch(`/api/appointments/slots?date=${date}`);
    const data = await response.json();

    document.getElementById('slotLoading').style.display = 'none';

    if (!data.success) {
      showSlotMessage('❌ Failed to load slots. Please try again.');
      return;
    }

    if (!data.available || data.slots.length === 0) {
      showSlotMessage('😔 No available slots for this date. Please try another day.');
      return;
    }

    renderSlots(data.slots);

    // Update next button state
    updateStep2Next();

  } catch (err) {
    document.getElementById('slotLoading').style.display = 'none';
    showSlotMessage('⚠️ Error fetching slots. Please check your connection.');
  }
}

// ─── Render Slots ────────────────────────────────────────────
function renderSlots(availableSlots) {
  const grid = document.getElementById('slotsGrid');
  grid.innerHTML = '';

  if (availableSlots.length === 0) {
    grid.innerHTML = '<div class="no-slots-msg">No slots available for this date.</div>';
    return;
  }

  availableSlots.forEach(slot => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'slot-btn';
    btn.textContent = slot;
    btn.dataset.slot = slot;
    btn.addEventListener('click', () => selectSlot(slot, btn));
    grid.appendChild(btn);
  });
}

// ─── Select Slot ─────────────────────────────────────────────
function selectSlot(slot, btn) {
  // Deselect all
  document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('selected'));

  // Select this one
  btn.classList.add('selected');
  document.getElementById('selectedSlot').value = slot;

  // Show selected display
  const display = document.getElementById('selectedSlotDisplay');
  document.getElementById('selectedSlotText').textContent = slot;
  display.style.display = 'flex';

  updateStep2Next();
}

// ─── Clear Slot ───────────────────────────────────────────────
function clearSlot() {
  document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById('selectedSlot').value = '';
  document.getElementById('selectedSlotDisplay').style.display = 'none';
  updateStep2Next();
}

// Make globally available
window.clearSlot = clearSlot;

// ─── Update Step 2 Next Button ───────────────────────────────
function updateStep2Next() {
  const date = document.getElementById('appointmentDate').value;
  const slot = document.getElementById('selectedSlot').value;
  const btn = document.getElementById('step2NextBtn');
  if (btn) btn.disabled = !(date && slot);
}

// ─── Show Slot Message ────────────────────────────────────────
function showSlotMessage(msg) {
  const info = document.getElementById('slotInfo');
  info.textContent = msg;
  info.style.display = 'flex';
  document.getElementById('slotsGrid').innerHTML = '';
}

// ─── Populate Summary ─────────────────────────────────────────
function populateSummary() {
  const name = document.getElementById('patientName').value.trim();
  const phone = document.getElementById('patientPhone').value.trim();
  const email = document.getElementById('patientEmail').value.trim();
  const service = document.getElementById('serviceSelect').value;
  const date = document.getElementById('appointmentDate').value;
  const slot = document.getElementById('selectedSlot').value;

  // Format date nicely
  const dateObj = new Date(date + 'T00:00:00');
  const dateStr = dateObj.toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  document.getElementById('summary-name').textContent = name;
  document.getElementById('summary-phone').textContent = phone;
  document.getElementById('summary-email').textContent = email;
  document.getElementById('summary-service').textContent = service;
  document.getElementById('summary-date').textContent = dateStr;
  document.getElementById('summary-slot').textContent = slot;
}

// ─── Booking Form Submit ──────────────────────────────────────
async function handleBookingSubmit(e) {
  e.preventDefault();

  const submitBtn = document.getElementById('bookingSubmitBtn');
  const originalText = submitBtn.innerHTML;

  const formData = {
    name: document.getElementById('patientName').value.trim(),
    phone: document.getElementById('patientPhone').value.trim(),
    email: document.getElementById('patientEmail').value.trim(),
    service: document.getElementById('serviceSelect').value,
    date: document.getElementById('appointmentDate').value,
    timeSlot: document.getElementById('selectedSlot').value,
    message: document.getElementById('messageInput').value.trim()
  };

  window.FormUtils.setLoading(submitBtn, true);

  try {
    const response = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (data.success) {
      // Show success state
      document.getElementById('bookingForm').style.display = 'none';
      const successDiv = document.getElementById('bookingSuccess');
      successDiv.style.display = 'block';

      // Populate success details
      const detailsEl = document.getElementById('successDetails');
      const dateObj = new Date(formData.date + 'T00:00:00');
      const dateStr = dateObj.toLocaleDateString('en-IN', {
        weekday: 'short', year: 'numeric', month: 'long', day: 'numeric'
      });
      detailsEl.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:8px;font-size:0.85rem;">
          <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-muted)">Service</span><strong>${formData.service}</strong></div>
          <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-muted)">Date</span><strong>${dateStr}</strong></div>
          <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-muted)">Time</span><strong>${formData.timeSlot}</strong></div>
          <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-muted)">Doctor</span><strong>Dr. Sparsh Sharma</strong></div>
        </div>
      `;

      window.showToast('Appointment booked! Check your email. 🦷', 'success', 5000);
    } else {
      window.FormUtils.showAlert('booking-alert', 'error', data.message || 'Booking failed. Please try again.');
      window.FormUtils.setLoading(submitBtn, false, originalText);
    }
  } catch (err) {
    window.FormUtils.showAlert('booking-alert', 'error', 'Network error. Please check your connection and try again.');
    window.FormUtils.setLoading(submitBtn, false, originalText);
  }
}
