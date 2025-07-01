/**
 * Client session management for maintaining unique device sessions
 */

export function getClientId() {
  let clientId = localStorage.getItem('client_id');
  if (!clientId) {
    clientId = crypto.randomUUID();
    localStorage.setItem('client_id', clientId);
  }
  return clientId;
}

export function clearClientId() {
  localStorage.removeItem('client_id');
}