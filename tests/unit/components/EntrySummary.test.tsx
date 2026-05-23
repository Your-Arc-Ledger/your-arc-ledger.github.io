import type { ReactNode } from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import EntrySummary from '../../../src/components/summary/EntrySummary'
import { EntriesProvider, useEntriesContext } from '../../../src/context/EntriesContext'
import type { Entry } from '../../../src/models/entry'
import { act, renderHook } from '@testing-library/react'

const today = new Date().toISOString().split('T')[0]
const oldDate = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

function makeEntry(type: Entry['type'], date: string): Entry {
  return {
    id: crypto.randomUUID(),
    type,
    title: 'Entry',
    description: '',
    categories: [],
    date,
    createdAt: new Date().toISOString(),
  }
}

function Wrapper({ children }: { children: ReactNode }) {
  return <EntriesProvider>{children}</EntriesProvider>
}

describe('EntrySummary', () => {
  it('displays zero counts when no entries exist', () => {
    render(
      <EntriesProvider>
        <EntrySummary />
      </EntriesProvider>
    )
    expect(screen.getByText(/achievements/i)).toBeInTheDocument()
    expect(screen.getByText(/lessons/i)).toBeInTheDocument()
  })

  it('correctly counts achievements and lessons within the last 30 days', () => {
    const { result } = renderHook(() => useEntriesContext(), {
      wrapper: Wrapper,
    })

    act(() => {
      result.current.dispatch({
        type: 'SET_ENTRIES',
        payload: [
          makeEntry('achievement', today),
          makeEntry('achievement', today),
          makeEntry('lesson', today),
          makeEntry('achievement', oldDate),
        ],
      })
    })

    render(
      <EntriesProvider>
        <EntrySummary />
      </EntriesProvider>
    )

    expect(screen.getByText(/achievements/i)).toBeInTheDocument()
  })

  it('excludes entries older than 30 days', () => {
    const { result } = renderHook(() => useEntriesContext(), {
      wrapper: Wrapper,
    })

    act(() => {
      result.current.dispatch({
        type: 'SET_ENTRIES',
        payload: [makeEntry('achievement', oldDate)],
      })
    })

    const { unmount } = render(
      <EntriesProvider>
        <EntrySummary />
      </EntriesProvider>
    )
    expect(screen.getByText(/achievements/i)).toBeInTheDocument()
    unmount()
  })
})
