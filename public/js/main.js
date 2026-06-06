/* ─── Main JavaScript — Navigation, Animations, Utilities ── */

// ─── Navbar Scroll Behavior ───────────────────────────────
const navbar = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

let lastScroll = 0;

window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset;

  if (currentScroll > 80) {
    navbar.classList.add('scrolled');
    navbar.classList.remove('hero-nav');
  } else {
    navbar.classList.remove('scrolled');
    if (document.body.classList.contains('has-hero')) {
      navbar.classList.add('hero-nav');
    }
  }

  lastScroll = currentScroll;
}, { passive: true });

// ─── Mobile Navigation Toggle ─────────────────────────────
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

// ─── Active nav link based on current page ────────────────
const currentPath = window.location.pathname;
document.querySelectorAll('.nav-link').forEach(link => {
  link.classList.remove('active');
  const href = link.getAttribute('href');
  if (
    href === currentPath ||
    (currentPath === '/' && href === '/') ||
    (currentPath !== '/' && href !== '/' && currentPath.startsWith(href.replace('.html', '')))
  ) {
    link.classList.add('active');
  }
});

// ─── Intersection Observer for Animations ─────────────────
const animateObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, {
  threshold: 0.12,
  rootMargin: '0px 0px -40px 0px'
});

document.querySelectorAll('.animate-fade-up').forEach(el => {
  animateObserver.observe(el);
});

// ─── Counter Animation ────────────────────────────────────
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseInt(el.dataset.target);
      let current = 0;
      const duration = 1500;
      const step = target / (duration / 16);

      const timer = setInterval(() => {
        current += step;
        if (current >= target) {
          el.textContent = target + '+';
          clearInterval(timer);
        } else {
          el.textContent = Math.floor(current) + '+';
        }
      }, 16);

      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.counter').forEach(el => {
  counterObserver.observe(el);
});

// ─── Smooth Scroll for Anchor Links ──────────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.pageYOffset - 90;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

// ─── Form Utilities ───────────────────────────────────────
const FormUtils = {
  showAlert(containerId, type, message) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.className = `alert alert-${type} show`;
    container.innerHTML = `<span class="alert-icon">${type === 'success' ? '✅' : '❌'}</span><span>${message}</span>`;
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (type === 'success') {
      setTimeout(() => container.classList.remove('show'), 6000);
    }
  },

  setLoading(btn, isLoading, originalText = 'Submit') {
    if (isLoading) {
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner"></span> Processing...`;
    } else {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  },

  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  validatePhone(phone) {
    return /^[0-9+\-\s()]{7,20}$/.test(phone);
  }
};

// Make globally available
window.FormUtils = FormUtils;

// ─── Toast Notification ────────────────────────────────────
function showToast(message, type = 'success', duration = 4000) {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = `
      position: fixed; bottom: 100px; right: 24px; z-index: 9999;
      display: flex; flex-direction: column; gap: 10px;
    `;
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  toast.style.cssText = `
    background: ${type === 'success' ? '#065f46' : type === 'error' ? '#991b1b' : '#1e40af'};
    color: white; padding: 14px 18px; border-radius: 12px; display: flex; align-items: center;
    gap: 10px; font-family: var(--font-body, sans-serif); font-size: 0.88rem; font-weight: 500;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3); max-width: 340px; animation: slideInToast 0.3s ease;
  `;
  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInToast {
      from { transform: translateX(100px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  if (!document.getElementById('toast-style')) {
    style.id = 'toast-style';
    document.head.appendChild(style);
  }

  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'none';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

window.showToast = showToast;

// ─── Initialize ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Mark body for hero detection
  if (document.querySelector('.hero')) {
    document.body.classList.add('has-hero');
    navbar.classList.add('hero-nav');
  }
});
