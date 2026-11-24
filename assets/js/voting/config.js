export const ADMIN_QUERY_CODE = '1234';

const firebaseConfig = {
  apiKey: 'AIzaSyAL12o66Sal-QAxS2NrTfh6JE9dubg8FO8',
  authDomain: 'docologie-bookclub.firebaseapp.com',
  databaseURL: 'https://docologie-bookclub-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'docologie-bookclub',
  storageBucket: 'docologie-bookclub.firebasestorage.app',
  messagingSenderId: '206131012579',
  appId: '1:206131012579:web:5192f86488f4b58b00b6d6'
};

export function initializeDatabase() {
  if (!window.firebase) throw new Error('Firebase SDK did not load.');
  if (!window.firebase.apps.length) window.firebase.initializeApp(firebaseConfig);
  return window.firebase.database();
}

export function isAdminMode() {
  return new URLSearchParams(location.search).get('admin') === ADMIN_QUERY_CODE;
}

export function getClientId() {
  const storedId = sessionStorage.getItem('bookclub_client_id');
  const clientId = storedId || crypto.randomUUID();
  sessionStorage.setItem('bookclub_client_id', clientId);
  return clientId;
}
