import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthContext, type AuthState } from '../../../../src/context/AuthContext'
import LogoutButton from '../../../../src/components/auth/LogoutButton'
import * as storage from '../../../../src/lib/storage'

const mockEntriesDispatch = vi.hoisted(() => vi.fn())

vi.mock('../../../../src/context/EntriesContext', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>
  return {
    ...actual,
    useEntriesContext: () => ({
      state: { status: 'loaded', items: [], filter: 'all', error: null },
      dispatch: mockEntriesDispatch,
    }),
  }
})

function renderLogoutButton(authState: Partial<AuthState> = {}) {
  const authDispatch = vi.fn()

  const fullAuthState: AuthState = {
    status: 'authorised',
    accessToken: 'tok',
    expiresAt: Date.now() + 3600_000,
    error: null,
    ...authState,
  }

  render(
    <AuthContext.Provider value={{ state: fullAuthState, dispatch: authDispatch }}>
      <LogoutButton />
    </AuthContext.Provider>
  )

  return { authDispatch, entriesDispatch: mockEntriesDispatch }
}

describe('LogoutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders a log out button', () => {
    renderLogoutButton()
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument()
  })

  it('shows confirmation prompt when clicked', async () => {
    const user = userEvent.setup()
    renderLogoutButton()

    await user.click(screen.getByRole('button', { name: /log out/i }))

    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('hides confirmation and does nothing when Cancel is clicked', async () => {
    const user = userEvent.setup()
    const { authDispatch, entriesDispatch } = renderLogoutButton()

    await user.click(screen.getByRole('button', { name: /log out/i }))
    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument()
    expect(authDispatch).not.toHaveBeenCalled()
    expect(entriesDispatch).not.toHaveBeenCalled()
  })

  it('clears auth state, entries state, and localStorage on confirm', async () => {
    const user = userEvent.setup()
    const clearSheetRef = vi.spyOn(storage, 'clearSheetRef')
    const clearSessionHint = vi.spyOn(storage, 'clearSessionHint')
    const { authDispatch, entriesDispatch } = renderLogoutButton()

    await user.click(screen.getByRole('button', { name: /log out/i }))
    await user.click(screen.getByRole('button', { name: /confirm/i }))

    expect(authDispatch).toHaveBeenCalledWith({ type: 'CLEAR' })
    expect(entriesDispatch).toHaveBeenCalledWith({ type: 'RESET' })
    expect(clearSheetRef).toHaveBeenCalled()
    expect(clearSessionHint).toHaveBeenCalled()
  })
})
