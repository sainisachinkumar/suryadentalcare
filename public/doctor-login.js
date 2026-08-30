const loginForm = document.querySelector('#doctor-login-form');
const loginStatus = document.querySelector('#login-status');
const passwordInput = document.querySelector('#doctor-password');
const showPassword = document.querySelector('#show-password');

const setStatus = (message, state = '') => {
  if (!loginStatus) return;
  loginStatus.textContent = message;
  loginStatus.dataset.state = state;
};

if (localStorage.getItem('doctorToken')) {
  window.location.href = 'doctor-dashboard.html';
}

showPassword?.addEventListener('change', () => {
  if (!passwordInput) return;
  passwordInput.type = showPassword.checked ? 'text' : 'password';
});

loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const submitButton = loginForm.querySelector('button[type="submit"]');
  const payload = Object.fromEntries(new FormData(loginForm).entries());

  try {
    submitButton && (submitButton.disabled = true);
    setStatus('Signing in...', 'loading');

    const response = await fetch(loginForm.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Login failed.');
    }

    localStorage.setItem('doctorToken', result.token);
    localStorage.setItem('doctorEmail', result.doctor.email);
    window.location.href = 'doctor-dashboard.html';
  } catch (error) {
    setStatus(error.message || 'Could not sign in.', 'error');
  } finally {
    submitButton && (submitButton.disabled = false);
  }
});
