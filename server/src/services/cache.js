// Small LRU cache with a TTL. Repeat report requests are served from memory instead of
// re-running Athena queries (which cost money and take seconds).
// In serverless deployments each instance has its own cache.

export function createCache({ maxEntries = 300, ttlMs = 15 * 60000, now = () => Date.now() } = {}) {
  const map = new Map() // insertion order = recency order
  let hits = 0, misses = 0

  function get(key) {
    const e = map.get(key)
    if (!e) { misses++; return undefined }
    if (now() - e.at > ttlMs) { map.delete(key); misses++; return undefined }
    map.delete(key); map.set(key, e) // mark as most recent
    hits++
    return e.value
  }

  function set(key, value) {
    if (map.has(key)) map.delete(key)
    map.set(key, { value, at: now() })
    while (map.size > maxEntries) map.delete(map.keys().next().value)
  }

  /** Returns the cached value or runs `fn` once; concurrent callers share one promise. */
  async function wrap(key, fn) {
    const v = get(key)
    if (v !== undefined) return v
    const p = Promise.resolve().then(fn)
    set(key, p)
    try { return await p } catch (e) { map.delete(key); throw e }
  }

  return { get, set, wrap, clear: () => map.clear(), stats: () => ({ size: map.size, hits, misses, maxEntries, ttlMs }) }
}
