import { getAdminAuth, isAuthorizedAdmin } from '../shared/admin-auth.js';

const auth = getAdminAuth();
const button = document.querySelector('#google-login');
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
  else if (user) auth.signOut().then(() => showStatus('This Google account is not authorized for admin access.'));
});

button.addEventListener('click', async () => {
  button.disabled = true;
  showStatus('Signing in with Google…');
  try {
    const provider = new window.firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({prompt:'select_account'});
    const result = await auth.signInWithPopup(provider);
    if (!isAuthorizedAdmin(result.user)) {
      await auth.signOut();
      showStatus('This Google account is not authorized for admin access.');
      return;
    }
    openDashboard();
  } catch (error) {
    console.error(error);
    showStatus(error?.code === 'auth/unauthorized-domain' ? 'This site domain is not enabled for Firebase Authentication.' : 'Sign-in failed. Please try again.');
  } finally {
    button.disabled = false;
  }
});
