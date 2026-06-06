// Contact Form Handler
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('contactSubmitBtn');
    const originalText = submitBtn.innerHTML;

    const name = document.getElementById('contactName').value.trim();
    const phone = document.getElementById('contactPhone').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const message = document.getElementById('contactMessage').value.trim();

    // Validation
    if (!name) { window.FormUtils.showAlert('contact-alert', 'error', 'Please enter your name.'); return; }
    if (!email || !window.FormUtils.validateEmail(email)) { window.FormUtils.showAlert('contact-alert', 'error', 'Please enter a valid email address.'); return; }
    if (!message) { window.FormUtils.showAlert('contact-alert', 'error', 'Please enter your message.'); return; }

    window.FormUtils.setLoading(submitBtn, true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, message })
      });

      const data = await response.json();

      if (data.success) {
        window.FormUtils.showAlert('contact-alert', 'success', data.message);
        form.reset();
        window.showToast('Message sent! We\'ll be in touch soon. 😊', 'success');
      } else {
        window.FormUtils.showAlert('contact-alert', 'error', data.message || 'Failed to send message. Please try again.');
      }
    } catch (err) {
      window.FormUtils.showAlert('contact-alert', 'error', 'Network error. Please check your connection and try again.');
    } finally {
      window.FormUtils.setLoading(submitBtn, false, originalText);
    }
  });
});
