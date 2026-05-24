import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthContext, type AuthState } from '../../../../src/context/AuthContext'
import AuthGate from '../../../../src/components/auth/AuthGate'
import * as storage from '../../../../src/lib/storage'
import * as googleSheets from '../../../../src/services/googleSheets'

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
    expiresAt: null,
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

interface PickerData {
  action: string
  docs?: Array<{ id: string; name: string }>
}

function setupPickerMocks() {
  let storedCallback: ((data: PickerData) => void) | null = null

  const mockPickerInstance = { setVisible: vi.fn() }
  const mockBuilder = {
    setDeveloperKey: vi.fn(),
    setOAuthToken: vi.fn(),
    addView: vi.fn(),
    setCallback: vi.fn(),
    build: vi.fn(function () { return mockPickerInstance }),
  }
  mockBuilder.setDeveloperKey.mockReturnValue(mockBuilder)
  mockBuilder.setOAuthToken.mockReturnValue(mockBuilder)
  mockBuilder.addView.mockReturnValue(mockBuilder)
  mockBuilder.setCallback.mockImplementation((cb: (data: PickerData) => void) => {
    storedCallback = cb
    return mockBuilder
  })

  vi.stubGlobal('gapi', {
    load: vi.fn(function (_: string, cb: () => void) { cb() }),
  })

  vi.stubGlobal('google', {
    picker: {
      PickerBuilder: vi.fn(function () { return mockBuilder }),
      DocsView: vi.fn(function () { return { setMimeTypes: vi.fn().mockReturnThis() } }),
    },
  })

  return {
    triggerPick: (id: string, name: string) =>
      storedCallback?.({ action: 'picked', docs: [{ id, name }] }),
    triggerCancel: () => storedCallback?.({ action: 'cancel' }),
  }
}

describe('AuthGate — SpreadsheetPicker connect path', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    // Re-apply default implementation cleared by clearAllMocks
    vi.mocked(googleSheets.initSheet).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('saves SheetRef when user picks a spreadsheet', async () => {
    const user = userEvent.setup()
    const saveSheetRef = vi.spyOn(storage, 'saveSheetRef')
    const { triggerPick } = setupPickerMocks()

    renderAuthGate({ status: 'authorised', accessToken: 'token123' })

    await user.click(screen.getByRole('button', { name: /browse drive/i }))

    await act(async () => {
      triggerPick('picked-id', 'My Worklog')
    })

    await waitFor(() => {
      expect(saveSheetRef).toHaveBeenCalledWith({ id: 'picked-id', title: 'My Worklog' })
    })
    expect(screen.getByTestId('app-children')).toBeInTheDocument()
  })

  it('does nothing when user cancels the picker', async () => {
    const user = userEvent.setup()
    const saveSheetRef = vi.spyOn(storage, 'saveSheetRef')
    const { triggerCancel } = setupPickerMocks()

    renderAuthGate({ status: 'authorised', accessToken: 'token123' })

    await user.click(screen.getByRole('button', { name: /browse drive/i }))

    await act(async () => {
      triggerCancel()
    })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /browse drive/i })).not.toBeDisabled()
    })
    expect(saveSheetRef).not.toHaveBeenCalled()
    expect(screen.queryByTestId('app-children')).not.toBeInTheDocument()
  })

  it('shows error when connecting fails after picker selection', async () => {
    const user = userEvent.setup()
    vi.mocked(googleSheets.initSheet).mockRejectedValueOnce(new Error('Sheet init failed'))
    const { triggerPick } = setupPickerMocks()

    renderAuthGate({ status: 'authorised', accessToken: 'token123' })

    await user.click(screen.getByRole('button', { name: /browse drive/i }))

    await act(async () => {
      triggerPick('picked-id', 'My Worklog')
    })

    await waitFor(() => {
      expect(screen.getByText(/sheet init failed/i)).toBeInTheDocument()
    })
    expect(screen.queryByTestId('app-children')).not.toBeInTheDocument()
  })
})

describe('AuthGate — SpreadsheetPicker create path', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    vi.mocked(googleSheets.initSheet).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
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

describe('AuthGate — restoring state', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('shows reconnecting indicator without a connect button', () => {
    renderAuthGate({ status: 'restoring' })

    expect(screen.getByText(/reconnecting/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /connect/i })).not.toBeInTheDocument()
  })
})

describe('AuthGate — error state', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('shows sheet title when a ref is stored', () => {
    vi.spyOn(storage, 'loadSheetRef').mockReturnValue({ id: 'abc', title: 'My Worklog' })

    renderAuthGate({ status: 'error', error: 'Session expired — Reconnect' })

    expect(screen.getByText(/my worklog/i)).toBeInTheDocument()
    expect(screen.getByText(/still connected/i)).toBeInTheDocument()
  })

  it('does not show sheet title line when no ref is stored', () => {
    vi.spyOn(storage, 'loadSheetRef').mockReturnValue(null)

    renderAuthGate({ status: 'error', error: 'Session expired — Reconnect' })

    expect(screen.queryByText(/still connected/i)).not.toBeInTheDocument()
    expect(screen.getByText(/session expired/i)).toBeInTheDocument()
  })
})
