import { initializeFirebaseApp } from './firebase.js';

export const ADMIN_UID = '97RsSwsyj9RGSHjHdDnftbudlhW2';

export function getAdminAuth() {
  return initializeFirebaseApp().auth();
}

export function isAuthorizedAdmin(user) {
  return user?.uid === ADMIN_UID;
}

export function guardAdminPage(onAuthorized) {
  const auth = getAdminAuth();
  let handled = false;
  auth.onAuthStateChanged(user => {
    if (handled) return;
    handled = true;
    if (isAuthorizedAdmin(user)) {
      onAuthorized(user);
      return;
    }
    if (user) auth.signOut().finally(() => location.replace('admin-login.html'));
    else location.replace('admin-login.html');
  });
  return auth;
}
