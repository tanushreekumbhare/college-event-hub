/**
 * Notifications Client Handler
 */
document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('notifications-list');
  if (!container) return;

  try {
    const res = await API.get('/api/notifications');
    if (res.success && res.notifications.length > 0) {
      container.innerHTML = res.notifications.map(n => `
        <div class="card" style="margin-bottom: 0.8rem; padding: 1rem; border-left: 4px solid #4f46e5;">
          <h4>${n.title}</h4>
          <p>${n.message}</p>
          <small class="text-muted">${new Date(n.createdAt).toLocaleString()}</small>
        </div>
      `).join('');
    } else {
      container.innerHTML = '<p class="text-muted">No new notifications.</p>';
    }
  } catch (err) {
    console.error(err);
  }
});
