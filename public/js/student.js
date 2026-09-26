/**
 * College Event Hub - Student Dashboard Logic
 * Manages fetching student's registered events and cancelling registrations.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Ensure user is an authenticated student
  const user = await enforceAuth('student');
  if (!user) return;

  // Set greeting
  const greetingEl = document.getElementById('student-greeting');
  if (greetingEl) {
    greetingEl.textContent = `Welcome, ${user.name}!`;
  }

  loadStudentDashboard();
});

async function loadStudentDashboard() {
  const container = document.getElementById('registered-events-container');
  const countEl = document.getElementById('stat-registered-count');
  if (!container) return;

  container.innerHTML = `
    <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
      Loading your registrations...
    </div>
  `;

  try {
    const res = await fetch('/api/registrations/my');
    const data = await res.json();

    if (!res.ok) {
      container.innerHTML = `
        <div class="alert alert-error">
          ${data.message || 'Error fetching registrations.'}
        </div>
      `;
      return;
    }

    const registrations = data.registrations || [];

    if (countEl) {
      countEl.textContent = registrations.length;
    }

    if (registrations.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 3rem 1.5rem;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🎫</div>
          <h3 style="margin-bottom: 0.5rem;">No Event Registrations Yet</h3>
          <p style="color: var(--text-muted); margin-bottom: 1.5rem;">
            You have not registered for any upcoming events. Discover exciting campus happenings today!
          </p>
          <a href="events.html" class="btn btn-primary">Browse All Events</a>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="grid-3">
        ${registrations.map((reg) => renderRegistrationCard(reg)).join('')}
      </div>
    `;
  } catch (err) {
    console.error('Failed to load dashboard:', err);
    container.innerHTML = `
      <div class="alert alert-error">Network error: Could not load registrations.</div>
    `;
  }
}

function renderRegistrationCard(reg) {
  const event = reg.event;
  if (!event) return '';

  const registeredDate = new Date(reg.registeredAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const categoryClass = `category-${(event.category || 'technical').toLowerCase()}`;
  const imgUrl = event.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60';

  return `
    <div class="event-card">
      <div class="event-card-banner" style="background-image: url('${imgUrl}');">
        <span class="event-badge ${categoryClass}">${escapeHtml(event.category)}</span>
        <span class="event-badge status-open">Registered</span>
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
            <span>🎟️</span>
            <span>Registered on: ${registeredDate}</span>
          </div>
        </div>

        <div style="display: flex; gap: 0.5rem; margin-top: auto;">
          <a href="event-details.html?id=${event._id}" class="btn btn-outline btn-sm" style="flex: 1;">
            Details
          </a>
          <button onclick="handleCancelMyRegistration('${reg._id}')" class="btn btn-danger btn-sm">
            Cancel
          </button>
        </div>
      </div>
    </div>
  `;
}

async function handleCancelMyRegistration(registrationId) {
  if (!confirm('Are you sure you want to cancel your event registration? This action cannot be undone.')) {
    return;
  }

  try {
    const res = await fetch(`/api/registrations/${registrationId}`, {
      method: 'DELETE'
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || 'Could not cancel registration.');
      return;
    }

    alert('Registration cancelled successfully.');
    loadStudentDashboard();
  } catch (err) {
    console.error('Cancellation error:', err);
    alert('Network error while cancelling registration.');
  }
}
