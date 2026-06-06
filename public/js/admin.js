/* ─── Admin Dashboard JavaScript ──────────────────────────── */

// ─── Auth Check ─────────────────────────────────────────────
const token = localStorage.getItem('lolDentalAdminToken');
if (!token) {
  window.location.href = '/admin/index.html';
}

const API_HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
};

// ─── State ───────────────────────────────────────────────────
let currentPage = { appointments: 1, contacts: 1 };
let activeAppointmentId = null;
let deleteTargetId = null;

// ─── Clock ───────────────────────────────────────────────────
function updateClock() {
  const clockEl = document.getElementById('adminClock');
  if (clockEl) {
    const now = new Date();
    clockEl.textContent = now.toLocaleString('en-IN', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
}
updateClock();
setInterval(updateClock, 60000);

// ─── Sidebar Toggle ──────────────────────────────────────────
function toggleSidebar() {
  const sidebar = document.getElementById('adminSidebar');
  const main = document.querySelector('.admin-main');
  const isWide = window.innerWidth > 1024;

  if (isWide) {
    sidebar.classList.toggle('collapsed');
    main.classList.toggle('expanded');
  } else {
    sidebar.classList.toggle('open');
  }
}

window.toggleSidebar = toggleSidebar;

// Close sidebar on overlay click for mobile
document.addEventListener('click', (e) => {
  if (window.innerWidth <= 1024) {
    const sidebar = document.getElementById('adminSidebar');
    const toggle = document.getElementById('sidebarToggle');
    if (sidebar && !sidebar.contains(e.target) && !toggle.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  }
});

// ─── Section Navigation ──────────────────────────────────────
function showSection(sectionId, linkEl) {
  // Hide all sections
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  document.getElementById(`section-${sectionId}`).classList.add('active');

  // Update nav links
  document.querySelectorAll('.sidebar-nav-link').forEach(l => l.classList.remove('active'));
  if (linkEl) linkEl.classList.add('active');

  // Update header title
  const titles = { overview: 'Overview', appointments: 'Appointments', contacts: 'Messages' };
  document.getElementById('headerTitle').textContent = titles[sectionId] || sectionId;

  // Load data
  if (sectionId === 'appointments') loadAppointments();
  if (sectionId === 'contacts') loadContacts();

  // Prevent link navigation
  return false;
}

window.showSection = showSection;

// ─── Load Stats ──────────────────────────────────────────────
async function loadStats() {
  try {
    const res = await fetch('/api/admin/stats', { headers: API_HEADERS });
    if (res.status === 401 || res.status === 403) return handleAuthError();
    const data = await res.json();

    if (data.success) {
      const s = data.stats;
      document.getElementById('stat-today').textContent = s.todayBookings;
      document.getElementById('stat-week').textContent = s.weekBookings;
      document.getElementById('stat-pending').textContent = s.pendingCount;
      document.getElementById('stat-confirmed').textContent = s.confirmedCount;
      document.getElementById('stat-completed').textContent = s.completedCount;
      document.getElementById('stat-contacts').textContent = s.totalContacts;

      // Update pending badge
      const badge = document.getElementById('pendingBadge');
      if (badge) {
        badge.textContent = s.pendingCount;
        badge.style.display = s.pendingCount > 0 ? 'inline' : 'none';
      }

      // Remove loading class
      document.querySelectorAll('.stat-card.loading').forEach(c => c.classList.remove('loading'));
    }
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

// ─── Load Recent Appointments (for Overview) ─────────────────
async function loadRecentAppointments() {
  const container = document.getElementById('recentAppointments');
  if (!container) return;

  try {
    const res = await fetch('/api/admin/appointments?limit=5&page=1', { headers: API_HEADERS });
    if (res.status === 401 || res.status === 403) return handleAuthError();
    const data = await res.json();

    if (data.success && data.data.length > 0) {
      container.innerHTML = renderAppointmentsTable(data.data, true);
    } else {
      container.innerHTML = `
        <div class="admin-empty">
          <div class="admin-empty-icon">📅</div>
          <div class="admin-empty-text">No appointments yet</div>
          <div class="admin-empty-sub">New bookings will appear here</div>
        </div>
      `;
    }
  } catch (err) {
    container.innerHTML = '<div class="admin-loading">Failed to load appointments</div>';
  }
}

// ─── Load Appointments ────────────────────────────────────────
async function loadAppointments(page = 1) {
  const container = document.getElementById('appointmentsTableWrap');
  if (!container) return;

  const date = document.getElementById('filterDate')?.value || '';
  const status = document.getElementById('filterStatus')?.value || '';
  const service = document.getElementById('filterService')?.value || '';

  const params = new URLSearchParams({ page, limit: 15 });
  if (date) params.set('date', date);
  if (status) params.set('status', status);
  if (service) params.set('service', service);

  container.innerHTML = '<div class="admin-loading">Loading appointments...</div>';

  try {
    const res = await fetch(`/api/admin/appointments?${params}`, { headers: API_HEADERS });
    if (res.status === 401 || res.status === 403) return handleAuthError();
    const data = await res.json();

    if (data.success) {
      const countEl = document.getElementById('appointmentCount');
      if (countEl) countEl.textContent = `${data.pagination.total} total`;

      if (data.data.length === 0) {
        container.innerHTML = `
          <div class="admin-empty">
            <div class="admin-empty-icon">📅</div>
            <div class="admin-empty-text">No appointments found</div>
            <div class="admin-empty-sub">Try adjusting your filters</div>
          </div>
        `;
      } else {
        container.innerHTML = renderAppointmentsTable(data.data, false);
      }

      renderPagination('appointmentsPagination', data.pagination, loadAppointments);
    }
  } catch (err) {
    container.innerHTML = '<div class="admin-loading">Failed to load. Try refreshing.</div>';
  }
}

window.loadAppointments = loadAppointments;

// ─── Render Appointments Table ────────────────────────────────
function renderAppointmentsTable(appointments, compact = false) {
  const rows = appointments.map(apt => {
    const dateStr = apt.date;
    const statusBadge = `<span class="badge badge-${apt.status}">${apt.status}</span>`;
    const actions = compact ? '' : `
      <div class="table-actions">
        <button class="action-btn action-btn-status" onclick="openStatusModal('${apt._id}', '${apt.name}')">✏️ Status</button>
        <button class="action-btn action-btn-delete" onclick="openDeleteModal('${apt._id}')">🗑️ Delete</button>
      </div>
    `;

    return `
      <tr>
        <td><div class="table-patient-name">${apt.name}</div></td>
        <td><a href="tel:${apt.phone}" class="table-phone">${apt.phone}</a></td>
        <td>${apt.service}</td>
        <td>${dateStr}</td>
        <td>${apt.timeSlot}</td>
        <td>${statusBadge}</td>
        ${compact ? '' : `<td>${actions}</td>`}
        <td style="font-size:0.78rem;color:var(--text-muted);">${new Date(apt.createdAt).toLocaleDateString('en-IN')}</td>
      </tr>
    `;
  }).join('');

  return `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Patient</th>
          <th>Phone</th>
          <th>Service</th>
          <th>Date</th>
          <th>Time</th>
          <th>Status</th>
          ${compact ? '' : '<th>Actions</th>'}
          <th>Booked On</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

// ─── Load Contacts ────────────────────────────────────────────
async function loadContacts(page = 1) {
  const container = document.getElementById('contactsList');
  if (!container) return;

  container.innerHTML = '<div class="admin-loading">Loading messages...</div>';

  try {
    const res = await fetch(`/api/admin/contacts?page=${page}&limit=10`, { headers: API_HEADERS });
    if (res.status === 401 || res.status === 403) return handleAuthError();
    const data = await res.json();

    if (data.success) {
      const countEl = document.getElementById('contactCount');
      if (countEl) countEl.textContent = `${data.pagination.total} total`;

      if (data.data.length === 0) {
        container.innerHTML = `
          <div class="admin-empty">
            <div class="admin-empty-icon">📩</div>
            <div class="admin-empty-text">No messages yet</div>
            <div class="admin-empty-sub">Contact form submissions will appear here</div>
          </div>
        `;
        return;
      }

      const html = data.data.map(c => `
        <div class="contact-message-item">
          <div class="contact-msg-header">
            <div class="contact-msg-sender">${c.name}</div>
            <div class="contact-msg-meta">${new Date(c.createdAt).toLocaleString('en-IN')}</div>
          </div>
          <div class="contact-msg-contact">
            <span>✉️ <a href="mailto:${c.email}">${c.email}</a></span>
            ${c.phone ? `<span>📞 <a href="tel:${c.phone}">${c.phone}</a></span>` : ''}
          </div>
          <div class="contact-msg-body">${c.message}</div>
        </div>
      `).join('');

      container.innerHTML = `<div class="contacts-list">${html}</div>`;
      renderPagination('contactsPagination', data.pagination, loadContacts);
    }
  } catch (err) {
    container.innerHTML = '<div class="admin-loading">Failed to load messages.</div>';
  }
}

window.loadContacts = loadContacts;

// ─── Pagination ───────────────────────────────────────────────
function renderPagination(containerId, pagination, loadFn) {
  const container = document.getElementById(containerId);
  if (!container || pagination.pages <= 1) {
    if (container) container.innerHTML = '';
    return;
  }

  let html = '';
  for (let i = 1; i <= pagination.pages; i++) {
    html += `<button class="page-btn ${i === pagination.page ? 'active' : ''}" onclick="${loadFn.name}(${i})">${i}</button>`;
  }
  container.innerHTML = html;
}

// ─── Status Modal ─────────────────────────────────────────────
function openStatusModal(id, name) {
  activeAppointmentId = id;
  document.getElementById('modalPatientName').textContent = `Patient: ${name}`;
  document.getElementById('statusModal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('statusModal').style.display = 'none';
  activeAppointmentId = null;
}

window.openStatusModal = openStatusModal;
window.closeModal = closeModal;

async function updateStatus(status) {
  if (!activeAppointmentId) return;

  try {
    const res = await fetch(`/api/admin/appointments/${activeAppointmentId}`, {
      method: 'PATCH',
      headers: API_HEADERS,
      body: JSON.stringify({ status })
    });
    const data = await res.json();

    if (data.success) {
      closeModal();
      loadAppointments();
      loadStats();
      showAdminToast(`Status updated to "${status}" ✅`);
    } else {
      showAdminToast('Failed to update status ❌', 'error');
    }
  } catch (err) {
    showAdminToast('Network error ❌', 'error');
  }
}

window.updateStatus = updateStatus;

// ─── Delete Modal ─────────────────────────────────────────────
function openDeleteModal(id) {
  deleteTargetId = id;
  document.getElementById('deleteModal').style.display = 'flex';
}

function closeDeleteModal() {
  document.getElementById('deleteModal').style.display = 'none';
  deleteTargetId = null;
}

window.openDeleteModal = openDeleteModal;
window.closeDeleteModal = closeDeleteModal;

async function confirmDelete() {
  if (!deleteTargetId) return;

  const btn = document.getElementById('confirmDeleteBtn');
  btn.disabled = true;
  btn.textContent = 'Deleting...';

  try {
    const res = await fetch(`/api/admin/appointments/${deleteTargetId}`, {
      method: 'DELETE',
      headers: API_HEADERS
    });
    const data = await res.json();

    if (data.success) {
      closeDeleteModal();
      loadAppointments();
      loadStats();
      showAdminToast('Appointment deleted ✅');
    } else {
      showAdminToast('Failed to delete ❌', 'error');
    }
  } catch (err) {
    showAdminToast('Network error ❌', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Delete';
  }
}

window.confirmDelete = confirmDelete;

// ─── Filters ──────────────────────────────────────────────────
function clearFilters() {
  document.getElementById('filterDate').value = '';
  document.getElementById('filterStatus').value = '';
  document.getElementById('filterService').value = '';
  loadAppointments();
}

window.clearFilters = clearFilters;

// ─── Logout ───────────────────────────────────────────────────
function handleLogout() {
  localStorage.removeItem('lolDentalAdminToken');
  window.location.href = '/admin/index.html';
}

window.handleLogout = handleLogout;

// ─── Auth Error ───────────────────────────────────────────────
function handleAuthError() {
  localStorage.removeItem('lolDentalAdminToken');
  window.location.href = '/admin/index.html';
}

// ─── Admin Toast ──────────────────────────────────────────────
function showAdminToast(message, type = 'success') {
  let container = document.getElementById('admin-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'admin-toast-container';
    container.style.cssText = 'position:fixed;top:80px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.style.cssText = `
    background: ${type === 'error' ? '#991b1b' : '#065f46'};
    color: white; padding: 12px 18px; border-radius: 10px;
    font-size: 0.85rem; font-weight: 600;
    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    animation: fadeInUp 0.3s ease both;
    font-family: var(--font-body, sans-serif);
  `;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ─── Close modals on overlay click ───────────────────────────
document.getElementById('statusModal')?.addEventListener('click', (e) => {
  if (e.target === document.getElementById('statusModal')) closeModal();
});
document.getElementById('deleteModal')?.addEventListener('click', (e) => {
  if (e.target === document.getElementById('deleteModal')) closeDeleteModal();
});

// ─── Initialize ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  loadRecentAppointments();
});
