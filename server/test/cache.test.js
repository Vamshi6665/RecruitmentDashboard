import { describe, it, expect, vi } from 'vitest'
import { createCache } from '../src/services/cache.js'

describe('LRU cache', () => {
  it('evicts the least recently used entry', () => {
    const c = createCache({ maxEntries: 2 })
    c.set('a', 1); c.set('b', 2)
    c.get('a')
    c.set('c', 3)
    expect(c.get('b')).toBeUndefined()
    expect(c.get('a')).toBe(1)
    expect(c.get('c')).toBe(3)
  })

  it('expires entries after the TTL', () => {
    let t = 0
    const c = createCache({ ttlMs: 1000, now: () => t })
    c.set('a', 1)
    t = 999; expect(c.get('a')).toBe(1)
    t = 2001; expect(c.get('a')).toBeUndefined()
  })

  it('shares one in-flight promise and does not cache failures', async () => {
    const c = createCache()
    const fn = vi.fn().mockResolvedValue(42)
    const [a, b] = await Promise.all([c.wrap('k', fn), c.wrap('k', fn)])
    expect(a).toBe(42); expect(b).toBe(42); expect(fn).toHaveBeenCalledTimes(1)
    const bad = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValue(7)
    await expect(c.wrap('x', bad)).rejects.toThrow('boom')
    await expect(c.wrap('x', bad)).resolves.toBe(7)
  })
})
