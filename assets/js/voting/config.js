import { initializeDatabase } from '../shared/firebase.js';

export const ADMIN_QUERY_CODE = '1234';
export { initializeDatabase };

export function isAdminMode() {
  return new URLSearchParams(location.search).get('admin') === ADMIN_QUERY_CODE;
}

export function getClientId() {
  const storedId = sessionStorage.getItem('bookclub_client_id');
  const clientId = storedId || crypto.randomUUID();
  sessionStorage.setItem('bookclub_client_id', clientId);
  return clientId;
}
