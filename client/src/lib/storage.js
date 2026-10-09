// Safe localStorage: every read and write is wrapped, because storage can be unavailable
// (private windows, blocked site data, embedded previews). Keys are prefixed "hub:".
const PREFIX = 'hub:'

export function load(key, fallback) {
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    return raw == null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function save(key, value) {
  try { window.localStorage.setItem(PREFIX + key, JSON.stringify(value)) } catch { /* storage unavailable */ }
}

export function remove(key) {
  try { window.localStorage.removeItem(PREFIX + key) } catch { /* storage unavailable */ }
}
