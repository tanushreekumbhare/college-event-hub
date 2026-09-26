/**
 * College Event Hub - Admin Operations Module
 * Handles admin dashboard metrics, event management table, attendee lists modal,
 * and creating/updating events.
 */

// -------------------------------------------------------------
// Admin Dashboard
// -------------------------------------------------------------

async function initAdminDashboard() {
  const user = await enforceAuth('admin');
  if (!user) return;

  loadAdminStats();
  loadAdminAnalytics();
  loadAdminEventsTable();
}

async function loadAdminAnalytics() {
  const topEventsContainer = document.getElementById('analytics-top-events-container');
  const trendContainer = document.getElementById('analytics-trend-container');

  if (!topEventsContainer && !trendContainer) return;

  try {
    const res = await fetch('/api/admin/analytics');
    const data = await res.json();

    if (!res.ok || !data.success) {
      if (topEventsContainer) topEventsContainer.innerHTML = '<p style="color: var(--text-muted);">No analytics available.</p>';
      return;
    }

    const { topEvents, registrationsOverTime } = data.analytics;

    // Render Top Events Bar Chart
    if (topEventsContainer) {
      if (!topEvents || topEvents.length === 0) {
        topEventsContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">No event signups recorded yet.</p>';
      } else {
        const maxSignups = Math.max(...topEvents.map(e => e.signupCount), 1);
        topEventsContainer.innerHTML = topEvents.map(item => {
          const percentage = Math.round((item.signupCount / maxSignups) * 100);
          return `
            <div style="margin-bottom: 0.85rem;">
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.25rem;">
                <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 75%;">${escapeHtml(item.title)}</span>
                <span style="color: var(--primary);">${item.signupCount} signups</span>
              </div>
              <div style="background-color: var(--border-color); height: 10px; border-radius: 5px; overflow: hidden;">
                <div style="width: ${percentage}%; background-color: var(--primary); height: 100%; border-radius: 5px; transition: width 0.5s ease;"></div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Render Daily Trend Chart
    if (trendContainer) {
      if (!registrationsOverTime || registrationsOverTime.length === 0) {
        trendContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">No signup trend data recorded yet.</p>';
      } else {
        const maxDaily = Math.max(...registrationsOverTime.map(d => d.count), 1);
        trendContainer.innerHTML = `
          <div style="display: flex; align-items: flex-end; gap: 0.5rem; height: 130px; padding-top: 1rem;">
            ${registrationsOverTime.map(d => {
              const heightPct = Math.round((d.count / maxDaily) * 100);
              return `
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end;" title="${d._id}: ${d.count} signups">
                  <div style="font-size: 0.75rem; font-weight: 700; color: var(--primary); margin-bottom: 2px;">${d.count}</div>
                  <div style="width: 100%; background-color: #6366f1; height: ${Math.max(heightPct, 15)}%; border-radius: 4px 4px 0 0;"></div>
                  <div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 4px; transform: rotate(-30deg); transform-origin: left top;">${d._id.slice(5)}</div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }
    }
  } catch (err) {
    console.error('Error loading analytics:', err);
  }
}


async function loadAdminStats() {
  try {
    const res = await fetch('/api/admin/stats');
    if (!res.ok) return;

    const data = await res.json();
    if (data.success && data.stats) {
      document.getElementById('stat-total-events').textContent = data.stats.totalEvents;
      document.getElementById('stat-upcoming-events').textContent = data.stats.upcomingEvents;
      document.getElementById('stat-total-registrations').textContent = data.stats.totalRegistrations;
      document.getElementById('stat-total-students').textContent = data.stats.totalStudents;
    }
  } catch (err) {
    console.error('Error loading admin stats:', err);
  }
}

async function loadAdminEventsTable() {
  const tableBody = document.getElementById('admin-events-tbody');
  if (!tableBody) return;

  tableBody.innerHTML = `
    <tr>
      <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
        Loading events...
      </td>
    </tr>
  `;

  try {
    const res = await fetch('/api/events');
    const data = await res.json();

    if (!res.ok) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--danger); padding: 1.5rem;">
            ${data.message || 'Error loading events.'}
          </td>
        </tr>
      `;
      return;
    }

    const events = data.events || [];

    if (events.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
            No events found. Click "+ Create New Event" to publish your first event!
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = events.map((event) => {
      const categoryClass = `category-${(event.category || 'technical').toLowerCase()}`;
      return `
        <tr>
          <td>
            <strong>${escapeHtml(event.title)}</strong>
            <div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(event.organizer)}</div>
          </td>
          <td>
            <span class="event-badge ${categoryClass}">${escapeHtml(event.category)}</span>
          </td>
          <td>
            <div>${escapeHtml(event.date)}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(event.time)}</div>
          </td>
          <td>${escapeHtml(event.venue)}</td>
          <td>
            <strong>${event.registrationCount}</strong> / ${event.maxParticipants}
            ${event.isFull ? '<span style="color: var(--danger); font-size: 0.75rem; font-weight: 700; margin-left: 4px;">FULL</span>' : ''}
          </td>
          <td>
            <div style="display: flex; gap: 0.4rem;">
              <button onclick="viewEventRegistrations('${event._id}')" class="btn btn-outline btn-sm" title="View Registered Students">
                👥 Attendees (${event.registrationCount})
              </button>
              <a href="create-event.html?id=${event._id}" class="btn btn-secondary btn-sm" title="Edit Event">
                ✏️ Edit
              </a>
              <button onclick="deleteEvent('${event._id}', '${escapeHtml(event.title)}')" class="btn btn-danger btn-sm" title="Delete Event">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Error loading admin events:', err);
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--danger); padding: 1.5rem;">
          Network error loading event data.
        </td>
      </tr>
    `;
  }
}

// Open modal and load attendee registrations
async function viewEventRegistrations(eventId) {
  const modal = document.getElementById('registrations-modal');
  const modalTitle = document.getElementById('modal-event-title');
  const modalBody = document.getElementById('modal-attendees-content');

  if (!modal || !modalBody) return;

  modal.classList.add('active');
  modalTitle.textContent = 'Event Attendees';
  modalBody.innerHTML = `
    <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
      Fetching registered student list...
    </div>
  `;

  try {
    const res = await fetch(`/api/admin/events/${eventId}/registrations`);
    const data = await res.json();

    if (!res.ok) {
      modalBody.innerHTML = `
        <div class="alert alert-error">${data.message || 'Error loading registrations.'}</div>
      `;
      return;
    }

    const { event, registrations } = data;
    modalTitle.textContent = `Attendees: ${event.title} (${event.totalRegistered}/${event.maxParticipants})`;

    if (registrations.length === 0) {
      modalBody.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
          <p style="color: var(--text-muted);">No students have registered for this event yet.</p>
        </div>
      `;
      return;
    }

    modalBody.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <span style="color: var(--text-muted); font-size: 0.9rem; font-weight: 600;">Enrolled Roster (${registrations.length} Students)</span>
        <a href="/api/admin/events/${eventId}/export-csv" target="_blank" class="btn btn-secondary btn-sm">
          📥 Export CSV Roster
        </a>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Student Name</th>
              <th>College Email</th>
              <th>Registered At</th>
              <th>Attendance Status</th>
            </tr>
          </thead>
          <tbody>
            ${registrations.map((reg, idx) => {
              const regDate = new Date(reg.registeredAt).toLocaleString();
              const studentName = reg.student ? escapeHtml(reg.student.name) : 'Unknown';
              const studentEmail = reg.student ? escapeHtml(reg.student.email) : 'N/A';
              const statusBadge = reg.attended
                ? `<span style="color: #065f46; background-color: #d1fae5; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 0.8rem;">Present</span>`
                : `<span style="color: var(--text-muted); font-size: 0.8rem;">Registered</span>`;

              return `
                <tr>
                  <td>${idx + 1}</td>
                  <td><strong>${studentName}</strong></td>
                  <td>${studentEmail}</td>
                  <td style="font-size: 0.85rem; color: var(--text-muted);">${regDate}</td>
                  <td>${statusBadge}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    console.error('Error fetching registrations:', err);
    modalBody.innerHTML = `
      <div class="alert alert-error">Network error fetching registered students.</div>
    `;
  }
}

function closeRegistrationsModal() {
  const modal = document.getElementById('registrations-modal');
  if (modal) modal.classList.remove('active');
}

// Open / Close QR Verification Modal
function openVerifyAttendanceModal() {
  const modal = document.getElementById('verify-attendance-modal');
  const alertEl = document.getElementById('verify-modal-alert');
  const inputEl = document.getElementById('ticketRegistrationId');

  if (!modal) return;
  if (alertEl) alertEl.innerHTML = '';
  if (inputEl) inputEl.value = '';

  modal.classList.add('active');
  if (inputEl) inputEl.focus();
}

function closeVerifyAttendanceModal() {
  const modal = document.getElementById('verify-attendance-modal');
  if (modal) modal.classList.remove('active');
}

async function handleVerifyTicketSubmit(e) {
  e.preventDefault();
  clearAlert('verify-modal-alert');

  const inputEl = document.getElementById('ticketRegistrationId');
  const submitBtn = document.getElementById('verify-submit-btn');
  const registrationId = inputEl ? inputEl.value.trim() : '';

  if (!registrationId) {
    showAlert('verify-modal-alert', 'Please enter or scan a registration ID.');
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Verifying...';

    const res = await fetch('/api/admin/verify-attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registrationId })
    });

    const data = await res.json();

    if (!res.ok) {
      showAlert('verify-modal-alert', data.message || 'Verification failed.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Verify & Mark Present';
      return;
    }

    showAlert('verify-modal-alert', data.message, 'success');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Verify & Mark Present';
    if (inputEl) inputEl.value = '';

    loadAdminStats();
    loadAdminEventsTable();
  } catch (err) {
    console.error('Error verifying attendance:', err);
    showAlert('verify-modal-alert', 'Network error during verification.', 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Verify & Mark Present';
  }
}


// Delete Event
async function deleteEvent(eventId, eventTitle) {
  if (!confirm(`Are you sure you want to delete the event "${eventTitle}"? All associated registrations will also be deleted.`)) {
    return;
  }

  try {
    const res = await fetch(`/api/events/${eventId}`, {
      method: 'DELETE'
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || 'Failed to delete event.');
      return;
    }

    alert('Event deleted successfully.');
    loadAdminStats();
    loadAdminEventsTable();
  } catch (err) {
    console.error('Error deleting event:', err);
    alert('Network error while attempting to delete event.');
  }
}

// -------------------------------------------------------------
// Create / Edit Event Page
// -------------------------------------------------------------

async function initEventForm() {
  const user = await enforceAuth('admin');
  if (!user) return;

  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('id');

  const pageTitle = document.getElementById('form-page-title');
  const submitBtn = document.getElementById('event-submit-btn');

  if (eventId) {
    // Edit mode
    if (pageTitle) pageTitle.textContent = 'Edit College Event';
    if (submitBtn) submitBtn.textContent = 'Save Changes';
    loadEventForEditing(eventId);
  }

  const form = document.getElementById('event-form');
  if (form) {
    form.addEventListener('submit', (e) => handleEventFormSubmit(e, eventId));
  }
}

async function loadEventForEditing(eventId) {
  try {
    const res = await fetch(`/api/events/${eventId}`);
    const data = await res.json();

    if (!res.ok) {
      showAlert('form-alert', data.message || 'Failed to load event data.');
      return;
    }

    const event = data.event;
    document.getElementById('title').value = event.title || '';
    document.getElementById('category').value = event.category || 'Technical';
    document.getElementById('date').value = event.date || '';
    document.getElementById('time').value = event.time || '';
    document.getElementById('venue').value = event.venue || '';
    document.getElementById('organizer').value = event.organizer || '';
    document.getElementById('maxParticipants').value = event.maxParticipants || '';
    document.getElementById('imageUrl').value = event.imageUrl || '';
    document.getElementById('description').value = event.description || '';
  } catch (err) {
    console.error('Error loading event for edit:', err);
    showAlert('form-alert', 'Could not load existing event data.');
  }
}

async function handleEventFormSubmit(e, eventId) {
  e.preventDefault();
  clearAlert('form-alert');

  const submitBtn = document.getElementById('event-submit-btn');
  const title = document.getElementById('title').value.trim();
  const category = document.getElementById('category').value;
  const date = document.getElementById('date').value;
  const time = document.getElementById('time').value.trim();
  const venue = document.getElementById('venue').value.trim();
  const organizer = document.getElementById('organizer').value.trim();
  const maxParticipants = parseInt(document.getElementById('maxParticipants').value, 10);
  const imageUrl = document.getElementById('imageUrl').value.trim();
  const description = document.getElementById('description').value.trim();

  const imageFileInput = document.getElementById('imageFile');
  const hasFile = imageFileInput && imageFileInput.files && imageFileInput.files.length > 0;

  if (!title || !category || !date || !time || !venue || !organizer || !maxParticipants || !description) {
    showAlert('form-alert', 'Please complete all required fields.');
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving & Uploading...';

    const url = eventId ? `/api/events/${eventId}` : '/api/events';
    const method = eventId ? 'PUT' : 'POST';

    let options = {};

    if (hasFile) {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', category);
      formData.append('date', date);
      formData.append('time', time);
      formData.append('venue', venue);
      formData.append('organizer', organizer);
      formData.append('maxParticipants', maxParticipants);
      formData.append('description', description);
      formData.append('imageUrl', imageUrl);
      formData.append('image', imageFileInput.files[0]);

      options = {
        method,
        body: formData
      };
    } else {
      options = {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          date,
          time,
          venue,
          organizer,
          maxParticipants,
          imageUrl,
          description
        })
      };
    }

    const res = await fetch(url, options);
    const data = await res.json();

    if (!res.ok) {
      showAlert('form-alert', data.message || 'Operation failed.');
      submitBtn.disabled = false;
      submitBtn.textContent = eventId ? 'Save Changes' : 'Create Event';
      return;
    }

    showAlert('form-alert', eventId ? 'Event updated successfully!' : 'Event created successfully!', 'success');
    setTimeout(() => {
      window.location.href = 'admin-dashboard.html';
    }, 900);
  } catch (err) {
    console.error('Error saving event:', err);
    showAlert('form-alert', 'Network error while saving event.');
    submitBtn.disabled = false;
    submitBtn.textContent = eventId ? 'Save Changes' : 'Create Event';
  }
}

