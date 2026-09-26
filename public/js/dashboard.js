/**
 * Student & Organizer Dashboard Client Script
 */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const meRes = await fetch('/api/auth/me');
    const meData = await meRes.json();

    if (meData.user) {
      const welcome = document.getElementById('welcome-msg');
      if (welcome) welcome.textContent = `Welcome Back, ${meData.user.name}!`;

      const pts = document.getElementById('stat-points');
      if (pts) pts.textContent = meData.user.participationPoints || 0;
    }

    // 1. Handle Student Stats
    const regRes = await fetch('/api/registrations/my-registrations');
    const regData = await regRes.json();
    if (regData.success) {
      const regCount = document.getElementById('stat-registered');
      if (regCount) regCount.textContent = regData.registrations.length;

      const attendedCount = document.getElementById('stat-attended');
      if (attendedCount) attendedCount.textContent = regData.registrations.filter(r => r.attended).length;

      const certCount = document.getElementById('stat-certificates');
      if (certCount) certCount.textContent = regData.registrations.filter(r => r.attended).length;
    }

    // 2. Handle Organizer Stats & Event List
    const organizerList = document.getElementById('organizer-events-list');
    if (organizerList) {
      const eventsRes = await fetch('/api/events');
      const eventsData = await eventsRes.json();

      if (eventsData.success && eventsData.events) {
        const events = eventsData.events;

        const totalEventsEl = document.getElementById('stat-total-events');
        if (totalEventsEl) totalEventsEl.textContent = events.length;

        const totalRegsEl = document.getElementById('stat-registrations');
        if (totalRegsEl) {
          const totalRegs = events.reduce((sum, ev) => sum + (ev.registeredCount || 0), 0);
          totalRegsEl.textContent = totalRegs;
        }

        const totalAttEl = document.getElementById('stat-attendance');
        if (totalAttEl) {
          totalAttEl.textContent = events.reduce((sum, ev) => sum + (ev.attendedCount || 0), 0);
        }

        if (events.length === 0) {
          organizerList.innerHTML = '<p class="text-muted">No events created yet. Click "+ Create Event" to add one!</p>';
        } else {
          organizerList.innerHTML = `
            <div class="events-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; margin-top: 1rem;">
              ${events.map(ev => `
                <div class="card" style="padding: 1.25rem; border-radius: 12px; border: 1px solid #e2e8f0;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                    <span style="background: #e0e7ff; color: #4338ca; padding: 0.25rem 0.6rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700;">${ev.category || 'General'}</span>
                    <span style="background: ${ev.status === 'APPROVED' ? '#d1fae5' : (ev.status === 'REJECTED' ? '#fee2e2' : '#fef3c7')}; color: ${ev.status === 'APPROVED' ? '#065f46' : (ev.status === 'REJECTED' ? '#991b1b' : '#92400e')}; padding: 0.25rem 0.6rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700;">${ev.status}</span>
                  </div>
                  <h3 style="margin-bottom: 0.5rem; font-size: 1.1rem; color: #0f172a;">${ev.title}</h3>
                  <p style="color: #64748b; font-size: 0.875rem; margin-bottom: 0.75rem;">${ev.description ? ev.description.substring(0, 90) + '...' : ''}</p>
                  <div style="font-size: 0.85rem; color: #475569; margin-bottom: 1rem;">
                    <div>📅 ${ev.date} at ${ev.time}</div>
                    <div>📍 ${ev.venue}</div>
                    <div>👥 Capacity: ${ev.maxParticipants} max seats</div>
                  </div>
                  <div style="display: flex; gap: 0.5rem;">
                    <a href="/organizer/attendance.html" class="btn btn-outline" style="flex: 1; text-align: center; font-size: 0.8rem; padding: 0.4rem;">Scan Attendance</a>
                  </div>
                </div>
              `).join('')}
            </div>
          `;
        }
      }
    }
  } catch (err) {
    console.error('Dashboard script error:', err);
  }
});
