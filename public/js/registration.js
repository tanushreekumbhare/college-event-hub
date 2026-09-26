/**
 * Registration & Ticket Management JS
 */
document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('registrations-list');
  if (!container) return;

  try {
    const res = await API.get('/api/registrations/my-registrations');
    if (res.success && res.registrations.length > 0) {
      container.innerHTML = res.registrations.map(reg => `
        <div class="card event-card">
          <div class="card-body">
            <h3>${reg.event ? reg.event.title : 'Event'}</h3>
            <p><strong>Date:</strong> ${reg.event ? reg.event.date : 'N/A'}</p>
            <p><strong>Venue:</strong> ${reg.event ? reg.event.venue : 'N/A'}</p>
            <p><strong>Status:</strong> ${reg.attended ? '<span style="color: green; font-weight:bold;">Attended</span>' : '<span style="color: blue;">Registered</span>'}</p>
            <button class="btn btn-outline show-qr-btn" data-reg-id="${reg._id}" style="margin-top: 1rem;">Show QR Pass</button>
          </div>
        </div>
      `).join('');

      document.querySelectorAll('.show-qr-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const regId = e.target.getAttribute('data-reg-id');
          const qrRes = await API.get(`/api/registrations/${regId}/qr`);
          if (qrRes.success) {
            alert(`Registration QR Code Generated! Ticket ID: ${regId}`);
          }
        });
      });
    } else {
      container.innerHTML = '<p class="text-muted">You have not registered for any events yet.</p>';
    }
  } catch (err) {
    console.error(err);
  }
});
