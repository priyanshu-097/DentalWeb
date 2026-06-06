/* Home page specific JS — particle system, orbit */
document.addEventListener('DOMContentLoaded', () => {

  // ─── Particle System ────────────────────────────────────
  const particleContainer = document.getElementById('heroParticles');
  if (particleContainer) {
    const particleCount = 25;
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      const size = Math.random() * 6 + 2;
      const left = Math.random() * 100;
      const delay = Math.random() * 15;
      const duration = Math.random() * 10 + 10;
      particle.style.cssText = `
        width: ${size}px; height: ${size}px;
        left: ${left}%;
        animation-delay: ${delay}s;
        animation-duration: ${duration}s;
        opacity: ${Math.random() * 0.4 + 0.1};
      `;
      particleContainer.appendChild(particle);
    }
  }

  // ─── Hero Entrance Animation ────────────────────────────
  const heroElements = document.querySelectorAll('.hero .animate-fade-up');
  heroElements.forEach((el, i) => {
    el.style.animation = `fadeInUp 0.8s ease ${i * 0.15}s both`;
  });

});
