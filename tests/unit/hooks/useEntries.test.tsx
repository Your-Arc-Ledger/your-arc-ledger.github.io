import React from 'react'
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { EntriesProvider } from '../../../src/context/EntriesContext'
import { AuthProvider } from '../../../src/context/AuthContext'
import { useEntries } from '../../../src/hooks/useEntries'

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <EntriesProvider>{children}</EntriesProvider>
    </AuthProvider>
  )
}

describe('useEntries', () => {
  it('addEntry dispatches APPEND_ENTRY and new entry appears first in list', async () => {
    const { result } = renderHook(() => useEntries(), { wrapper })

    await act(async () => {
      await result.current.addEntry({
        type: 'achievement',
        title: 'First entry',
        date: '2026-05-23',
        description: '',
        categories: [],
      })
    })

    expect(result.current.entries).toHaveLength(1)
    expect(result.current.entries[0].title).toBe('First entry')
  })

  it('addEntry rejects invalid fields without dispatching', async () => {
    const { result } = renderHook(() => useEntries(), { wrapper })

    await act(async () => {
      await result.current.addEntry({ type: 'achievement', title: '', date: '2026-05-23' })
    })

    expect(result.current.entries).toHaveLength(0)
  })

  it('addEntry prepends new entries (newest first)', async () => {
    const { result } = renderHook(() => useEntries(), { wrapper })

    await act(async () => {
      await result.current.addEntry({ type: 'achievement', title: 'Older', date: '2026-05-01', description: '', category: '' })
      await result.current.addEntry({ type: 'setback', title: 'Newer', date: '2026-05-23', description: '', category: '' })
    })

    expect(result.current.entries[0].title).toBe('Newer')
    expect(result.current.entries[1].title).toBe('Older')
  })
})
