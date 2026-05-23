import type { ReactNode } from 'react'
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { EntriesProvider, useEntriesContext } from '../../../src/context/EntriesContext'
import type { Entry } from '../../../src/models/entry'

const makeEntry = (overrides: Partial<Entry> = {}): Entry => ({
  id: crypto.randomUUID(),
  type: 'achievement',
  title: 'Test',
  description: '',
  category: '',
  date: '2026-05-23',
  createdAt: new Date().toISOString(),
  ...overrides,
})

function wrapper({ children }: { children: ReactNode }) {
  return <EntriesProvider>{children}</EntriesProvider>
}

describe('EntriesContext filter reducer', () => {
  it('SET_FILTER achievement shows only achievements', () => {
    const { result } = renderHook(() => useEntriesContext(), { wrapper })
    const achievement = makeEntry({ type: 'achievement', title: 'Win' })
    const lesson = makeEntry({ type: 'lesson', title: 'Loss' })

    act(() => {
      result.current.dispatch({ type: 'SET_ENTRIES', payload: [achievement, lesson] })
      result.current.dispatch({ type: 'SET_FILTER', payload: 'achievement' })
    })

    expect(result.current.state.filter).toBe('achievement')
    expect(result.current.state.items).toHaveLength(2)
  })

  it('SET_FILTER lesson works correctly', () => {
    const { result } = renderHook(() => useEntriesContext(), { wrapper })
    act(() => {
      result.current.dispatch({ type: 'SET_FILTER', payload: 'lesson' })
    })
    expect(result.current.state.filter).toBe('lesson')
  })

  it('SET_FILTER all restores full list', () => {
    const { result } = renderHook(() => useEntriesContext(), { wrapper })
    act(() => {
      result.current.dispatch({ type: 'SET_FILTER', payload: 'achievement' })
      result.current.dispatch({ type: 'SET_FILTER', payload: 'all' })
    })
    expect(result.current.state.filter).toBe('all')
  })

  it('master items array is never mutated by SET_FILTER', () => {
    const { result } = renderHook(() => useEntriesContext(), { wrapper })
    const items = [makeEntry({ type: 'achievement' }), makeEntry({ type: 'lesson' })]

    act(() => {
      result.current.dispatch({ type: 'SET_ENTRIES', payload: items })
    })
    const originalItems = result.current.state.items

    act(() => {
      result.current.dispatch({ type: 'SET_FILTER', payload: 'achievement' })
    })

    expect(result.current.state.items).toBe(originalItems)
    expect(result.current.state.items).toHaveLength(2)
  })
})
