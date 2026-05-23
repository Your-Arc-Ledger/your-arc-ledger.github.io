import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { AuthContext } from '../../../src/context/AuthContext'
import { useCategories } from '../../../src/hooks/useCategories'
import type { AuthState } from '../../../src/context/AuthContext'

vi.mock('../../../src/services/googleSheets', () => ({
  readCategories: vi.fn(),
  appendCategory: vi.fn(),
}))

vi.mock('../../../src/lib/storage', () => ({
  loadSheetRef: vi.fn(),
}))

import { readCategories, appendCategory } from '../../../src/services/googleSheets'
import { loadSheetRef } from '../../../src/lib/storage'

const SPREADSHEET_ID = 'test-sheet-id'
const ACCESS_TOKEN = 'test-token'

function makeWrapper(authState: AuthState) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AuthContext.Provider value={{ state: authState, dispatch: vi.fn() }}>
        {children}
      </AuthContext.Provider>
    )
  }
}

const authorisedState: AuthState = {
  status: 'authorised',
  accessToken: ACCESS_TOKEN,
  expiresAt: null,
  error: null,
}

const idleState: AuthState = {
  status: 'idle',
  accessToken: null,
  expiresAt: null,
  error: null,
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(loadSheetRef).mockReturnValue({ id: SPREADSHEET_ID, title: 'Arc Ledger' })
  vi.mocked(readCategories).mockResolvedValue([])
  vi.mocked(appendCategory).mockResolvedValue(undefined)
})

describe('useCategories', () => {
  it('returns empty categories when not authorised', () => {
    const { result } = renderHook(() => useCategories(), {
      wrapper: makeWrapper(idleState),
    })

    expect(result.current.categories).toEqual([])
    expect(readCategories).not.toHaveBeenCalled()
  })

  it('fetches categories from the sheet when authorised', async () => {
    vi.mocked(readCategories).mockResolvedValue(['Work', 'Health'])

    const { result } = renderHook(() => useCategories(), {
      wrapper: makeWrapper(authorisedState),
    })

    await waitFor(() => {
      expect(result.current.categories).toEqual(['Work', 'Health'])
    })
    expect(readCategories).toHaveBeenCalledWith(SPREADSHEET_ID, ACCESS_TOKEN)
  })

  it('addCategory optimistically updates state and calls appendCategory', async () => {
    const { result } = renderHook(() => useCategories(), {
      wrapper: makeWrapper(authorisedState),
    })

    // Let the initial readCategories fetch settle before calling addCategory
    await act(async () => {})

    await act(async () => {
      await result.current.addCategory('Leadership')
    })

    expect(result.current.categories).toContain('Leadership')
    expect(appendCategory).toHaveBeenCalledWith(SPREADSHEET_ID, ACCESS_TOKEN, 'Leadership')
  })

  it('rolls back the optimistic update when appendCategory fails', async () => {
    vi.mocked(appendCategory).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useCategories(), {
      wrapper: makeWrapper(authorisedState),
    })

    await act(async () => {
      await result.current.addCategory('Temporary')
    })

    expect(result.current.categories).not.toContain('Temporary')
  })

  it('addCategory does nothing when not authorised', async () => {
    const { result } = renderHook(() => useCategories(), {
      wrapper: makeWrapper(idleState),
    })

    await act(async () => {
      await result.current.addCategory('Work')
    })

    expect(appendCategory).not.toHaveBeenCalled()
    expect(result.current.categories).toEqual([])
  })
})
