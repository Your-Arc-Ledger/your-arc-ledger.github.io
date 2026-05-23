import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../../../src/context/AuthContext'
import { useGoogleAuth } from '../../../src/hooks/useGoogleAuth'

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('useGoogleAuth', () => {
  it('initiateAuth calls google.accounts.oauth2.initTokenClient with correct params', async () => {
    const mockInitTokenClient = vi.fn().mockReturnValue({ requestAccessToken: vi.fn() })
    Object.defineProperty(globalThis, 'google', {
      value: { accounts: { oauth2: { initTokenClient: mockInitTokenClient } } },
      configurable: true,
      writable: true,
    })

    const { result } = renderHook(() => useGoogleAuth(), { wrapper })

    act(() => {
      result.current.initiateAuth()
    })

    expect(mockInitTokenClient).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: expect.stringContaining('spreadsheets'),
      })
    )
  })

  it('successful token callback dispatches SET_AUTHORISED with access token', async () => {
    let capturedCallback: ((response: { access_token: string }) => void) | undefined

    const mockInitTokenClient = vi.fn((config: { callback: (r: { access_token: string }) => void }) => {
      capturedCallback = config.callback
      return { requestAccessToken: vi.fn() }
    })

    Object.defineProperty(globalThis, 'google', {
      value: { accounts: { oauth2: { initTokenClient: mockInitTokenClient } } },
      configurable: true,
      writable: true,
    })

    const { result } = renderHook(
      () => ({ auth: useAuth(), googleAuth: useGoogleAuth() }),
      { wrapper }
    )

    act(() => {
      result.current.googleAuth.initiateAuth()
    })

    act(() => {
      capturedCallback?.({ access_token: 'my-token-123' })
    })

    expect(result.current.auth.state.status).toBe('authorised')
    expect(result.current.auth.state.accessToken).toBe('my-token-123')
  })

  it('detecting a 401 error dispatches SET_ERROR with session expired message', async () => {
    const { result } = renderHook(
      () => ({ auth: useAuth(), googleAuth: useGoogleAuth() }),
      { wrapper }
    )

    act(() => {
      result.current.auth.dispatch({ type: 'SET_ERROR', payload: 'Session expired — Reconnect' })
    })

    expect(result.current.auth.state.status).toBe('error')
    expect(result.current.auth.state.error).toContain('Session expired')
  })
})
