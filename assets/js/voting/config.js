import { initializeDatabase } from '../shared/firebase.js';

export { initializeDatabase };

export function isAdminMode() {
  return new URLSearchParams(location.search).get('admin') === '1';
}

export function getClientId() {
  const storedId = sessionStorage.getItem('bookclub_client_id');
  const clientId = storedId || crypto.randomUUID();
  sessionStorage.setItem('bookclub_client_id', clientId);
  return clientId;
}
