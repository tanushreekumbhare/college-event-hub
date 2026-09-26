/**
 * College Event Hub - Events Module
 * Handles event discovery, search, filtering, and single event registration.
 */

let activeCategory = 'All';
let searchDebounceTimeout = null;

// Default placeholder image for events
const DEFAULT_EVENT_IMAGE = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60';

// -------------------------------------------------------------
// Events Listing Page Functions
// -------------------------------------------------------------

async function loadEvents(search = '', category = 'All') {
  const container = document.getElementById('events-container');
  const countIndicator = document.getElementById('events-count');
  if (!container) return;

  container.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
      <p style="color: var(--text-muted); font-size: 1.1rem;">Loading events...</p>
    </div>
  `;

  try {
    const params = new URLSearchParams();
    if (search && search.trim() !== '') params.append('search', search.trim());
    if (category && category !== 'All') params.append('category', category);

    const res = await fetch(`/api/events?${params.toString()}`);
    const data = await res.json();

    if (!res.ok) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1;" class="alert alert-error">
          ${data.message || 'Failed to load events.'}
        </div>
      `;
      return;
    }

    const events = data.events || [];

    if (countIndicator) {
      countIndicator.textContent = `Showing ${events.length} event${events.length === 1 ? '' : 's'}`;
    }

    if (events.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;" class="card">
          <h3 style="margin-bottom: 0.5rem; color: var(--text-main);">No events found</h3>
          <p style="color: var(--text-muted);">Try adjusting your search terms or filter categories.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = events.map((event) => renderEventCard(event)).join('');
  } catch (err) {
    console.error('Error loading events:', err);
    container.innerHTML = `
      <div style="grid-column: 1 / -1;" class="alert alert-error">
        Network error: Could not reach the server to load events.
      </div>
    `;
  }
}

function renderEventCard(event) {
  const imgUrl = event.imageUrl || DEFAULT_EVENT_IMAGE;
  const categoryClass = `category-${(event.category || 'technical').toLowerCase()}`;
  const statusBadge = event.isFull
    ? '<span class="event-badge status-full">Full</span>'
    : `<span class="event-badge status-open">${event.spotsLeft} spots left</span>`;

  return `
    <div class="event-card">
      <div class="event-card-banner" style="background-image: url('${imgUrl}');">
        <span class="event-badge ${categoryClass}">${escapeHtml(event.category)}</span>
        ${statusBadge}
      </div>
      <div class="event-card-body">
        <h3 class="event-card-title">${escapeHtml(event.title)}</h3>
        <p class="event-card-desc">${escapeHtml(event.description)}</p>
        
        <div class="event-meta">
          <div class="event-meta-item">
            <span>📅</span>
            <strong>${escapeHtml(event.date)}</strong> at ${escapeHtml(event.time)}
          </div>
          <div class="event-meta-item">
            <span>📍</span>
            <span>${escapeHtml(event.venue)}</span>
          </div>
          <div class="event-meta-item">
            <span>🏢</span>
            <span>By: ${escapeHtml(event.organizer)}</span>
          </div>
        </div>

        <div class="event-card-footer">
          <span style="font-size: 0.85rem; color: var(--text-muted);">
            Cap: <strong>${event.registrationCount}/${event.maxParticipants}</strong>
          </span>
          <a href="event-details.html?id=${event._id}" class="btn btn-primary btn-sm">
            View Details
          </a>
        </div>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// Single Event Details Page Functions
// -------------------------------------------------------------

async function loadEventDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('id');

  if (!eventId) {
    window.location.href = 'events.html';
    return;
  }

  const detailContainer = document.getElementById('event-detail-content');
  if (!detailContainer) return;

  try {
    const res = await fetch(`/api/events/${eventId}`);
    const data = await res.json();

    if (!res.ok) {
      detailContainer.innerHTML = `
        <div class="alert alert-error">
          ${data.message || 'Event not found.'}
        </div>
        <a href="events.html" class="btn btn-outline">Back to Events</a>
      `;
      return;
    }

    const event = data.event;
    const currentUser = await getCurrentUser();
    renderEventDetailView(event, currentUser);
  } catch (err) {
    console.error('Error fetching event detail:', err);
    detailContainer.innerHTML = `
      <div class="alert alert-error">Could not load event details.</div>
    `;
  }
}

function renderEventDetailView(event, user) {
  const container = document.getElementById('event-detail-content');
  const imgUrl = event.imageUrl || DEFAULT_EVENT_IMAGE;
  const categoryClass = `category-${(event.category || 'technical').toLowerCase()}`;
  const percentFilled = Math.min(100, Math.round((event.registrationCount / event.maxParticipants) * 100));

  // Determine user registration action CTA
  let actionBoxHtml = '';

  if (!user) {
    actionBoxHtml = `
      <div class="card" style="margin-top: 1.5rem; text-align: center;">
        <h4 style="margin-bottom: 0.5rem;">Join this Event</h4>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;">
          Please sign in with your college account to register.
        </p>
        <a href="login.html?redirect=event-details.html?id=${event._id}" class="btn btn-primary" style="width: 100%;">
          Login to Register
        </a>
      </div>
    `;
  } else if (user.role === 'admin') {
    actionBoxHtml = `
      <div class="card" style="margin-top: 1.5rem;">
        <h4 style="margin-bottom: 0.5rem;">Admin Management</h4>
        <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1rem;">
          You are viewing this event with administrator privileges.
        </p>
        <a href="create-event.html?id=${event._id}" class="btn btn-secondary" style="width: 100%; margin-bottom: 0.5rem;">
          ✏️ Edit Event Details
        </a>
        <a href="admin-dashboard.html" class="btn btn-outline" style="width: 100%;">
          View Attendees in Dashboard
        </a>
      </div>
    `;
  } else if (event.isRegistered) {
    actionBoxHtml = `
      <div class="card" style="margin-top: 1.5rem; border-color: var(--success); background-color: #f0fdf4;">
        <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--success); font-weight: 700; margin-bottom: 0.5rem;">
          <span>✅</span>
          <span>You are Registered!</span>
        </div>
        <p style="color: #166534; font-size: 0.85rem; margin-bottom: 1rem;">
          Your registration is confirmed. We look forward to seeing you at the event!
        </p>
        <button onclick="handleCancelRegistration('${event.registrationId}')" class="btn btn-danger btn-sm" style="width: 100%;">
          Cancel Registration
        </button>
      </div>
    `;
  } else if (event.isFull) {
    actionBoxHtml = `
      <div class="card" style="margin-top: 1.5rem; text-align: center; border-color: var(--danger);">
        <h4 style="color: var(--danger); margin-bottom: 0.5rem;">Event is Full</h4>
        <p style="color: var(--text-muted); font-size: 0.9rem;">
          All ${event.maxParticipants} seats have been reserved.
        </p>
        <button class="btn btn-outline" disabled style="width: 100%; margin-top: 1rem;">
          Registration Closed
        </button>
      </div>
    `;
  } else {
    actionBoxHtml = `
      <div class="card" style="margin-top: 1.5rem;">
        <h4 style="margin-bottom: 0.5rem;">Confirm Registration</h4>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.25rem;">
          Reserve your seat now. Spots are allocated on a first-come, first-served basis.
        </p>
        <button id="register-btn" onclick="handleEventRegistration('${event._id}')" class="btn btn-primary btn-lg" style="width: 100%;">
          Register Now 🎟️
        </button>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="event-header">
      <div class="event-banner-large" style="background-image: url('${imgUrl}');">
        <div class="event-banner-info">
          <span class="event-badge ${categoryClass}" style="margin-bottom: 0.75rem;">
            ${escapeHtml(event.category)}
          </span>
          <h1 style="font-size: 2.25rem; font-weight: 800; line-height: 1.2;">${escapeHtml(event.title)}</h1>
        </div>
      </div>
    </div>

    <div id="registration-alert"></div>

    <div class="event-details-grid">
      <!-- Main Details Column -->
      <div>
        <div class="card" style="margin-bottom: 1.5rem;">
          <h3 style="margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">
            About This Event
          </h3>
          <p style="white-space: pre-line; line-height: 1.8; color: var(--text-main);">
            ${escapeHtml(event.description)}
          </p>
        </div>

        <div class="card">
          <h3 style="margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">
            Event Logistics & Location
          </h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div>
              <strong style="color: var(--text-muted); font-size: 0.85rem; display: block;">DATE & TIME</strong>
              <span style="font-size: 1.05rem; font-weight: 600;">📅 ${escapeHtml(event.date)}</span>
              <div style="color: var(--text-muted); font-size: 0.9rem;">⏰ ${escapeHtml(event.time)}</div>
            </div>
            <div>
              <strong style="color: var(--text-muted); font-size: 0.85rem; display: block;">VENUE / ROOM</strong>
              <span style="font-size: 1.05rem; font-weight: 600;">📍 ${escapeHtml(event.venue)}</span>
            </div>
            <div>
              <strong style="color: var(--text-muted); font-size: 0.85rem; display: block;">ORGANIZING CLUB / DEPT</strong>
              <span style="font-size: 1.05rem; font-weight: 600;">🏢 ${escapeHtml(event.organizer)}</span>
            </div>
            <div>
              <strong style="color: var(--text-muted); font-size: 0.85rem; display: block;">EVENT CATEGORY</strong>
              <span style="font-size: 1.05rem; font-weight: 600;">🏷️ ${escapeHtml(event.category)}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar Column -->
      <div>
        <div class="card">
          <h4 style="margin-bottom: 1rem;">Capacity Status</h4>
          
          <div style="display: flex; justify-content: space-between; font-size: 0.95rem; font-weight: 600;">
            <span>${event.registrationCount} Registered</span>
            <span style="color: var(--text-muted);">${event.spotsLeft} Available</span>
          </div>

          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${percentFilled}%;"></div>
          </div>

          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.5rem; text-align: right;">
            Maximum: ${event.maxParticipants} Attendees
          </div>
        </div>

        ${actionBoxHtml}
      </div>
    </div>
  `;
}

// Handle Student Event Registration
async function handleEventRegistration(eventId) {
  const registerBtn = document.getElementById('register-btn');
  clearAlert('registration-alert');

  try {
    if (registerBtn) {
      registerBtn.disabled = true;
      registerBtn.textContent = 'Registering...';
    }

    const res = await fetch('/api/registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId })
    });

    const data = await res.json();

    if (!res.ok) {
      showAlert('registration-alert', data.message || 'Registration failed.');
      if (registerBtn) {
        registerBtn.disabled = false;
        registerBtn.textContent = 'Register Now 🎟️';
      }
      return;
    }

    showAlert('registration-alert', 'Registration successful! You have secured your spot.', 'success');
    setTimeout(() => {
      loadEventDetails();
    }, 1000);
  } catch (err) {
    console.error('Registration failed:', err);
    showAlert('registration-alert', 'Network error registering for event.');
    if (registerBtn) {
      registerBtn.disabled = false;
      registerBtn.textContent = 'Register Now 🎟️';
    }
  }
}

// Handle Cancel Registration
async function handleCancelRegistration(registrationId) {
  if (!confirm('Are you sure you want to cancel your registration for this event?')) {
    return;
  }

  clearAlert('registration-alert');

  try {
    const res = await fetch(`/api/registrations/${registrationId}`, {
      method: 'DELETE'
    });

    const data = await res.json();

    if (!res.ok) {
      showAlert('registration-alert', data.message || 'Failed to cancel registration.');
      return;
    }

    showAlert('registration-alert', 'Registration cancelled successfully.', 'success');
    setTimeout(() => {
      loadEventDetails();
    }, 1000);
  } catch (err) {
    console.error('Error cancelling registration:', err);
    showAlert('registration-alert', 'Network error cancelling registration.');
  }
}

// -------------------------------------------------------------
// Filters & Search Setup
// -------------------------------------------------------------
function setupSearchAndFilters() {
  const searchInput = document.getElementById('search-input');
  const chipButtons = document.querySelectorAll('.chip-btn');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchDebounceTimeout);
      searchDebounceTimeout = setTimeout(() => {
        loadEvents(e.target.value, activeCategory);
      }, 300);
    });
  }

  if (chipButtons) {
    chipButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        chipButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        activeCategory = btn.getAttribute('data-category');
        const searchTerm = searchInput ? searchInput.value : '';
        loadEvents(searchTerm, activeCategory);
      });
    });
  }
}
