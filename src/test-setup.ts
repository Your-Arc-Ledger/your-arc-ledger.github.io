import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers)
afterEach(cleanup)

// Provide a localStorage mock for jsdom if it's not available
if (typeof localStorage === 'undefined') {
  const store: Record<string, string> = {}
  ;(globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      Object.keys(store).forEach(key => {
        delete store[key]
      })
    },
    key: (index: number) => {
      const keys = Object.keys(store)
      return keys[index] || null
    },
    length: Object.keys(store).length,
  } as Storage
}
