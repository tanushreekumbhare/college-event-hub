/**
 * College Event Hub - Authentication Management
 * Handles session status, navbar rendering, login, register, and logout.
 */

// Utility: Show alert message inside target element
function showAlert(elementId, message, type = 'error') {
  const container = document.getElementById(elementId);
  if (!container) return;

  container.innerHTML = `
    <div class="alert alert-${type}">
      <span>${message}</span>
    </div>
  `;
}

// Clear alert message
function clearAlert(elementId) {
  const container = document.getElementById(elementId);
  if (container) container.innerHTML = '';
}

// Fetch currently logged in user
async function getCurrentUser() {
  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  } catch (err) {
    console.error('Error fetching session:', err);
    return null;
  }
}

// Theme Toggle Management
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeToggleButtons(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeToggleButtons(newTheme);
}

function updateThemeToggleButtons(theme) {
  const btns = document.querySelectorAll('.theme-toggle-btn');
  const isDark = theme === 'dark';
  btns.forEach(btn => {
    btn.innerHTML = isDark ? '☀️ Light' : '🌙 Dark';
  });
}

// Render dynamic navigation bar depending on user login state
async function renderNavbar() {
  initTheme();

  const navContainer = document.getElementById('nav-auth-container');
  const navLinksContainer = document.getElementById('nav-links-container');
  if (!navContainer) return;

  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const themeBtnHtml = `<button onclick="toggleTheme()" class="theme-toggle-btn" title="Toggle Light/Dark Theme">${currentTheme === 'dark' ? '☀️ Light' : '🌙 Dark'}</button>`;

  const user = await getCurrentUser();

  if (user) {
    // Dynamic links
    if (navLinksContainer) {
      if (user.role === 'admin') {
        navLinksContainer.innerHTML = `
          <li><a href="/index.html" class="nav-link">Home</a></li>
          <li><a href="/events.html" class="nav-link">All Events</a></li>
          <li><a href="/admin-dashboard.html" class="nav-link">Admin Dashboard</a></li>
          <li><a href="/create-event.html" class="nav-link">+ Create Event</a></li>
        `;
      } else if (user.role === 'organizer') {
        navLinksContainer.innerHTML = `
          <li><a href="/index.html" class="nav-link">Home</a></li>
          <li><a href="/events.html" class="nav-link">Browse Events</a></li>
          <li><a href="/organizer/dashboard.html" class="nav-link">Organizer Dashboard</a></li>
          <li><a href="/create-event.html" class="nav-link">+ Create Event</a></li>
        `;
      } else {
        navLinksContainer.innerHTML = `
          <li><a href="/index.html" class="nav-link">Home</a></li>
          <li><a href="/events.html" class="nav-link">Browse Events</a></li>
          <li><a href="/student-dashboard.html" class="nav-link">My Dashboard</a></li>
        `;
      }
    }

    // Dynamic user badge & logout
    navContainer.innerHTML = `
      ${themeBtnHtml}
      <div class="user-badge">
        <span>👤 ${escapeHtml(user.name)}</span>
        <span class="role-tag ${user.role}">${user.role}</span>
      </div>
      <button onclick="handleLogout()" class="btn btn-outline btn-sm">Logout</button>
    `;
  } else {
    if (navLinksContainer) {
      navLinksContainer.innerHTML = `
        <li><a href="index.html" class="nav-link">Home</a></li>
        <li><a href="events.html" class="nav-link">Events</a></li>
      `;
    }

    navContainer.innerHTML = `
      ${themeBtnHtml}
      <a href="login.html" class="btn btn-outline btn-sm">Login</a>
      <a href="register.html" class="btn btn-primary btn-sm">Register</a>
    `;
  }
}

// Guard page access
async function enforceAuth(requiredRole = null) {
  const user = await getCurrentUser();

  if (!user) {
    window.location.href = `login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
    return null;
  }

  if (requiredRole && user.role !== requiredRole) {
    if (user.role === 'organizer') {
      window.location.href = '/organizer/dashboard.html';
    } else if (user.role === 'admin') {
      window.location.href = '/admin-dashboard.html';
    } else {
      window.location.href = '/student-dashboard.html';
    }
    return null;
  }

  return user;
}

// Handle User Login
async function handleLoginSubmit(event) {
  event.preventDefault();
  clearAlert('auth-alert');

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const submitBtn = document.getElementById('submit-btn');

  if (!email || !password) {
    showAlert('auth-alert', 'Please enter both email and password.');
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showAlert('auth-alert', data.message || 'Invalid credentials.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In';
      return;
    }

    showAlert('auth-alert', 'Login successful! Redirecting...', 'success');

    setTimeout(() => {
      if (data.user.role === 'admin') {
        window.location.href = 'admin-dashboard.html';
      } else if (data.user.role === 'organizer') {
        window.location.href = '/organizer/dashboard.html';
      } else {
        // Redirect to requested page or Home page (index.html)
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect');
        window.location.href = redirect || 'index.html';
      }
    }, 800);
  } catch (err) {
    console.error('Login request failed:', err);
    showAlert('auth-alert', 'Unable to reach the server. Please check your network or try again.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign In';
  }
}

// Handle User Registration
async function handleRegisterSubmit(event) {
  event.preventDefault();
  clearAlert('auth-alert');

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const submitBtn = document.getElementById('submit-btn');

  if (!name || !email || !password || !confirmPassword) {
    showAlert('auth-alert', 'All fields are required.');
    return;
  }

  if (password.length < 8) {
    showAlert('auth-alert', 'Password must be at least 8 characters long.');
    return;
  }

  if (password !== confirmPassword) {
    showAlert('auth-alert', 'Passwords do not match.');
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showAlert('auth-alert', data.message || 'Registration failed.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Account';
      return;
    }

    showAlert('auth-alert', 'Registration successful! Welcome aboard. Redirecting to Home...', 'success');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1000);
  } catch (err) {
    console.error('Registration failed:', err);
    showAlert('auth-alert', 'Unable to reach the server. Please try again later.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Account';
  }
}

// Handle User Logout
async function handleLogout() {
  try {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    if (res.ok) {
      window.location.href = 'index.html';
    }
  } catch (err) {
    console.error('Logout error:', err);
    window.location.href = 'index.html';
  }
}

// Helper: Escape HTML to avoid XSS in dynamic templates
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Initialize navbar and theme automatically
initTheme();
document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
});
