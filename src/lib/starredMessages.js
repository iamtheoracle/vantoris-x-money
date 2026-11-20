const STARRED_KEY = 'vantoris_starred_messages';

function readMap() {
  if (typeof window === 'undefined') return {};
  try { const value = JSON.parse(window.localStorage.getItem(STARRED_KEY) || '{}'); return value && typeof value === 'object' ? value : {}; }
  catch { return {}; }
}

export function getStarredIds(conversationId) { return new Set(readMap()[conversationId] || []); }
export function isStarred(conversationId, messageKey) { return getStarredIds(conversationId).has(messageKey); }
export function toggleStar(conversationId, messageKey) {
  if (typeof window === 'undefined' || !conversationId || !messageKey) return;
  const map = readMap();
  const ids = Array.isArray(map[conversationId]) ? map[conversationId] : [];
  const index = ids.indexOf(messageKey);
  if (index >= 0) ids.splice(index, 1); else ids.push(messageKey);
  if (ids.length) map[conversationId] = ids; else delete map[conversationId];
  try { window.localStorage.setItem(STARRED_KEY, JSON.stringify(map)); } catch { /* storage may be unavailable */ }
}
export function getMessageKey(message) { return message?.id || String(message?.created_date || '') + '_' + String(message?.role || ''); }
