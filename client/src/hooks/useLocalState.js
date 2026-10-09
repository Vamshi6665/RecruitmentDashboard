import { useEffect, useState } from 'react'
import { load, save } from '../lib/storage.js'

/** useState that persists to localStorage under "hub:<key>". */
export function useLocalState(key, initial) {
  const [value, setValue] = useState(() => load(key, typeof initial === 'function' ? initial() : initial))
  useEffect(() => { save(key, value) }, [key, value])
  return [value, setValue]
}
