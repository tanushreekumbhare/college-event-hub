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
  } catch (err) {
    console.error('Dashboard script error:', err);
  }
});
