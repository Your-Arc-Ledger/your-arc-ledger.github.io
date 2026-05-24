import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthContext, type AuthState } from '../../../../src/context/AuthContext'
import { EntriesContext, type EntriesState } from '../../../../src/context/EntriesContext'
import LogoutButton from '../../../../src/components/auth/LogoutButton'
import * as storage from '../../../../src/lib/storage'

function renderLogoutButton(
  authState: Partial<AuthState> = {},
  entriesState: Partial<EntriesState> = {},
) {
  const authDispatch = vi.fn()
  const entriesDispatch = vi.fn()

  const fullAuthState: AuthState = {
    status: 'authorised',
    accessToken: 'tok',
    expiresAt: Date.now() + 3600_000,
    error: null,
    ...authState,
  }
  const fullEntriesState: EntriesState = {
    status: 'loaded',
    items: [],
    filter: 'all',
    error: null,
    ...entriesState,
  }

  render(
    <AuthContext.Provider value={{ state: fullAuthState, dispatch: authDispatch }}>
      <EntriesContext.Provider value={{ state: fullEntriesState, dispatch: entriesDispatch }}>
        <LogoutButton />
      </EntriesContext.Provider>
    </AuthContext.Provider>
  )

  return { authDispatch, entriesDispatch }
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
