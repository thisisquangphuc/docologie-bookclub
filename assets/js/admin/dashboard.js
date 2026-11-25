import { guardAdminPage } from '../shared/admin-auth.js';

const auth = guardAdminPage(() => {
  document.querySelector('#admin-dashboard').hidden = false;
});

document.querySelector('#admin-logout').addEventListener('click', async () => {
  await auth.signOut();
  location.replace('admin-login.html');
});
