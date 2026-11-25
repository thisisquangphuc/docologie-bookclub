import { getAdminAuth, isAuthorizedAdmin } from '../shared/admin-auth.js';

const auth = getAdminAuth();
const form = document.querySelector('#admin-login-form');
const button = document.querySelector('#email-login');
const emailInput = document.querySelector('#admin-email');
const passwordInput = document.querySelector('#admin-password');
const status = document.querySelector('#login-status');
let redirecting = false;

function showStatus(message) {
  status.textContent = message;
  status.hidden = !message;
}

function openDashboard() {
  if (redirecting) return;
  redirecting = true;
  location.replace('admin.html');
}

auth.onAuthStateChanged(user => {
  if (isAuthorizedAdmin(user)) openDashboard();
  else if (user) auth.signOut().then(() => showStatus('This account is not authorized for admin access.'));
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  button.disabled = true;
  showStatus('Signing in…');
  try {
    const result = await auth.signInWithEmailAndPassword(emailInput.value.trim(),passwordInput.value);
    if (!isAuthorizedAdmin(result.user)) {
      await auth.signOut();
      showStatus('This account is not authorized for admin access.');
      return;
    }
    openDashboard();
  } catch (error) {
    console.error(error);
    showStatus('Sign-in failed. Check the email and password, then try again.');
  } finally {
    button.disabled = false;
  }
});
