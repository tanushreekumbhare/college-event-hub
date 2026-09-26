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
  loadAdminEventsTable();
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
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Student Name</th>
              <th>College Email</th>
              <th>Registered At</th>
            </tr>
          </thead>
          <tbody>
            ${registrations.map((reg, idx) => {
              const regDate = new Date(reg.registeredAt).toLocaleString();
              const studentName = reg.student ? escapeHtml(reg.student.name) : 'Unknown';
              const studentEmail = reg.student ? escapeHtml(reg.student.email) : 'N/A';
              return `
                <tr>
                  <td>${idx + 1}</td>
                  <td><strong>${studentName}</strong></td>
                  <td>${studentEmail}</td>
                  <td style="font-size: 0.85rem; color: var(--text-muted);">${regDate}</td>
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

