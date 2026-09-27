/**
 * Organizer Portal Client Script
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Organizer Events Catalog (/organizer/events.html)
  const organizerEventsGrid = document.getElementById('organizer-events-grid');
  if (organizerEventsGrid) {
    loadOrganizerEventsGrid(organizerEventsGrid);
  }

  // 2. Organizer Analytics (/organizer/analytics.html)
  const organizerChartCanvas = document.getElementById('organizer-chart');
  if (organizerChartCanvas) {
    loadOrganizerAnalytics(organizerChartCanvas);
  }

  // 3. Organizer Create Event (/organizer/create-event.html)
  const createEventForm = document.getElementById('create-event-form');
  if (createEventForm) {
    initOrganizerCreateEventForm(createEventForm);
  }

  // 4. Organizer Participants Roster (/organizer/participants.html)
  const participantsContainer = document.getElementById('participants-container');
  if (participantsContainer) {
    loadOrganizerParticipants(participantsContainer);
  }
});

async function loadOrganizerEventsGrid(container) {
  container.innerHTML = '<p class="text-muted" style="grid-column: 1/-1; text-align: center; padding: 2rem;">Loading events...</p>';
  try {
    const res = await fetch('/api/events');
    const data = await res.json();

    if (!res.ok || !data.events || data.events.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem;" class="card">
          <h3>No events found</h3>
          <p style="color: var(--text-muted); margin-bottom: 1rem;">You haven't created any events yet.</p>
          <a href="/organizer/create-event.html" class="btn btn-primary">+ Create First Event</a>
        </div>
      `;
      return;
    }

    container.innerHTML = data.events.map(ev => {
      const imgUrl = ev.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60';
      return `
        <div class="card" style="padding: 1.25rem; border-radius: 12px; border: 1px solid var(--border-color); display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="background-image: url('${imgUrl}'); height: 160px; background-size: cover; background-position: center; border-radius: 8px; margin-bottom: 1rem;"></div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
              <span style="background: #e0e7ff; color: #4338ca; padding: 0.25rem 0.6rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700;">${ev.category || 'General'}</span>
              <span style="background: #d1fae5; color: #065f46; padding: 0.25rem 0.6rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700;">Active</span>
            </div>
            <h3 style="margin-bottom: 0.5rem; font-size: 1.15rem; color: var(--text-main);">${escapeHtml(ev.title)}</h3>
            <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 0.75rem;">${ev.description ? escapeHtml(ev.description.substring(0, 90)) + '...' : ''}</p>
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem; line-height: 1.5;">
              <div>📅 ${escapeHtml(ev.date)} at ${escapeHtml(ev.time)}</div>
              <div>📍 ${escapeHtml(ev.venue)}</div>
              <div>👥 Registered: <strong>${ev.registrationCount || 0}</strong> / ${ev.maxParticipants} max capacity</div>
            </div>
          </div>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <a href="/create-event.html?id=${ev._id}" class="btn btn-secondary btn-sm" style="flex: 1; text-align: center;">✏️ Edit</a>
            <a href="/organizer/attendance.html" class="btn btn-outline btn-sm" style="flex: 1; text-align: center;">🔍 Attendance</a>
            <button onclick="deleteOrganizerEvent('${ev._id}', '${escapeHtml(ev.title).replace(/'/g, "\\'")}')" class="btn btn-danger btn-sm">🗑️</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Error loading organizer events catalog:', err);
    container.innerHTML = '<div style="grid-column: 1/-1;" class="alert alert-error">Failed to load events catalog.</div>';
  }
}

async function deleteOrganizerEvent(id, title) {
  if (!confirm(`Are you sure you want to delete event "${title}"?`)) return;
  try {
    const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
      alert('Event deleted successfully.');
      location.reload();
    } else {
      alert(data.message || 'Failed to delete event.');
    }
  } catch (err) {
    alert('Network error deleting event.');
  }
}

async function loadOrganizerAnalytics(canvas) {
  try {
    const res = await fetch('/api/events');
    const data = await res.json();
    if (!res.ok || !data.events) return;

    const events = data.events;
    const labels = events.map(e => e.title.length > 18 ? e.title.substring(0, 18) + '...' : e.title);
    const registrationsData = events.map(e => e.registrationCount || 0);

    if (typeof Chart !== 'undefined') {
      new Chart(canvas, {
        type: 'bar',
        data: {
          labels: labels.length > 0 ? labels : ['No Events Yet'],
          datasets: [{
            label: 'Total Student Registrations',
            data: registrationsData.length > 0 ? registrationsData : [0],
            backgroundColor: 'rgba(37, 99, 235, 0.75)',
            borderColor: 'rgb(37, 99, 235)',
            borderWidth: 1,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: true, position: 'top' },
            title: { display: true, text: 'Event Attendance & Registration Turnout' }
          },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } }
          }
        }
      });
    }
  } catch (err) {
    console.error('Error rendering analytics chart:', err);
  }
}

function initOrganizerCreateEventForm(form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting Event...';
    }

    const formData = new FormData(form);
    const posterFile = form.querySelector('input[type="file"]');
    if (posterFile && posterFile.files && posterFile.files.length > 0) {
      formData.set('image', posterFile.files[0]);
    }

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.message || 'Error creating event.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Event';
        }
        return;
      }

      alert('Event published successfully!');
      window.location.href = '/organizer/events.html';
    } catch (err) {
      console.error('Create event submission error:', err);
      alert('Network error submitting event.');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Event';
      }
    }
  });
}

async function loadOrganizerParticipants(container) {
  try {
    const res = await fetch('/api/events');
    const data = await res.json();
    if (!res.ok || !data.events || data.events.length === 0) {
      container.innerHTML = '<p class="text-muted">No active events found.</p>';
      return;
    }

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        ${data.events.map(ev => `
          <div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 1rem; background: var(--bg-card);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h3 style="margin: 0; font-size: 1.1rem; color: var(--text-main);">${escapeHtml(ev.title)}</h3>
                <span style="font-size: 0.85rem; color: var(--text-muted);">📅 ${escapeHtml(ev.date)} | 📍 ${escapeHtml(ev.venue)}</span>
              </div>
              <span class="badge" style="background: #e0e7ff; color: #4338ca; padding: 0.3rem 0.8rem; border-radius: 12px; font-weight: 700; font-size: 0.85rem;">
                ${ev.registrationCount || 0} Registered / ${ev.maxParticipants} Capacity
              </span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    console.error('Error loading participants roster:', err);
    container.innerHTML = '<p style="color: red;">Error loading participants data.</p>';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
