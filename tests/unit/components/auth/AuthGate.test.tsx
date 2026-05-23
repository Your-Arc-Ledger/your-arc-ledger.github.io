import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthContext, type AuthState } from '../../../../src/context/AuthContext'
import AuthGate from '../../../../src/components/auth/AuthGate'
import * as storage from '../../../../src/lib/storage'

vi.mock('../../../../src/hooks/useGoogleAuth', () => ({
  useGoogleAuth: () => ({ initiateAuth: vi.fn(), handleApiError: vi.fn() }),
}))

vi.mock('../../../../src/services/googleSheets', () => ({
  initSheet: vi.fn().mockResolvedValue(undefined),
}))

function renderAuthGate(authState: Partial<AuthState>) {
  const dispatch = vi.fn()
  const state: AuthState = {
    status: 'idle',
    accessToken: null,
    error: null,
    ...authState,
  }
  return render(
    <AuthContext.Provider value={{ state, dispatch }}>
      <AuthGate>
        <div data-testid="app-children">app</div>
      </AuthGate>
    </AuthContext.Provider>
  )
}

describe('AuthGate — SpreadsheetPicker connect path', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('fetches sheet title and saves SheetRef on successful connect', async () => {
    const user = userEvent.setup()
    const saveSheetRef = vi.spyOn(storage, 'saveSheetRef')

    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ properties: { title: 'My Worklog' } }),
    } as Response))

    renderAuthGate({ status: 'authorised', accessToken: 'token123' })

    await user.type(
      screen.getByLabelText(/spreadsheet url/i),
      'https://docs.google.com/spreadsheets/d/sheet123/edit'
    )
    await user.click(screen.getByRole('button', { name: /^connect$/i }))

    await waitFor(() => {
      expect(saveSheetRef).toHaveBeenCalledWith({ id: 'sheet123', title: 'My Worklog' })
    })
    expect(screen.getByTestId('app-children')).toBeInTheDocument()
  })

  it('shows error and does not navigate when title fetch fails', async () => {
    const user = userEvent.setup()

    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 403,
    } as Response))

    renderAuthGate({ status: 'authorised', accessToken: 'token123' })

    await user.type(
      screen.getByLabelText(/spreadsheet url/i),
      'https://docs.google.com/spreadsheets/d/sheet123/edit'
    )
    await user.click(screen.getByRole('button', { name: /^connect$/i }))

    await waitFor(() => {
      expect(screen.getByText(/could not fetch spreadsheet \(403\)/i)).toBeInTheDocument()
    })
    expect(screen.queryByTestId('app-children')).not.toBeInTheDocument()
  })
})

describe('AuthGate — SpreadsheetPicker create path', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('saves SheetRef with title from API response on create', async () => {
    const user = userEvent.setup()
    const saveSheetRef = vi.spyOn(storage, 'saveSheetRef')

    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          spreadsheetId: 'newid',
          properties: { title: 'Arc' },
        }),
    } as Response))

    renderAuthGate({ status: 'authorised', accessToken: 'token123' })

    await user.click(screen.getByRole('button', { name: /create new spreadsheet/i }))

    await waitFor(() => {
      expect(saveSheetRef).toHaveBeenCalledWith({ id: 'newid', title: 'Arc' })
    })
    expect(screen.getByTestId('app-children')).toBeInTheDocument()
  })
})
