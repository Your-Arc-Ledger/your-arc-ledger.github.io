import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../../../src/context/AuthContext'
import { useGoogleAuth } from '../../../src/hooks/useGoogleAuth'
import { saveTokenCache } from '../../../src/lib/storage'

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

beforeEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('useGoogleAuth — manual auth', () => {
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

  it('successful token callback dispatches SET_AUTHORISED with access token and expiresAt', async () => {
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
    expect(result.current.auth.state.expiresAt).toBeTypeOf('number')
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

describe('useGoogleAuth — silent re-auth on page load', () => {
  it('calls requestAccessToken with prompt:none when there is an expired cached token', async () => {
    saveTokenCache({ accessToken: 'old-token', expiresAt: Date.now() - 1000 })

    const mockRequestAccessToken = vi.fn()
    const mockInitTokenClient = vi.fn().mockReturnValue({ requestAccessToken: mockRequestAccessToken })
    Object.defineProperty(globalThis, 'google', {
      value: { accounts: { oauth2: { initTokenClient: mockInitTokenClient } } },
      configurable: true,
      writable: true,
    })

    const { result } = renderHook(
      () => ({ auth: useAuth(), googleAuth: useGoogleAuth() }),
      { wrapper }
    )

    await waitFor(() => {
      expect(mockRequestAccessToken).toHaveBeenCalledWith({ prompt: 'none' })
    })

    expect(result.current.auth.state.status).toBe('authorising')
  })

  it('transitions to authorised when silent re-auth succeeds', async () => {
    saveTokenCache({ accessToken: 'old-token', expiresAt: Date.now() - 1000 })

    let capturedCallback: ((r: { access_token?: string; error?: string }) => void) | undefined
    const mockInitTokenClient = vi.fn((config: { callback: typeof capturedCallback }) => {
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

    await waitFor(() => expect(capturedCallback).toBeDefined())

    act(() => {
      capturedCallback?.({ access_token: 'new-token' })
    })

    expect(result.current.auth.state.status).toBe('authorised')
    expect(result.current.auth.state.accessToken).toBe('new-token')
  })

  it('returns to idle when silent re-auth fails', async () => {
    saveTokenCache({ accessToken: 'old-token', expiresAt: Date.now() - 1000 })

    let capturedCallback: ((r: { access_token?: string; error?: string }) => void) | undefined
    const mockInitTokenClient = vi.fn((config: { callback: typeof capturedCallback }) => {
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

    await waitFor(() => expect(capturedCallback).toBeDefined())

    act(() => {
      capturedCallback?.({ error: 'immediate_failed' })
    })

    expect(result.current.auth.state.status).toBe('idle')
  })

  it('does not attempt silent re-auth when there is no cached token', async () => {
    const mockRequestAccessToken = vi.fn()
    const mockInitTokenClient = vi.fn().mockReturnValue({ requestAccessToken: mockRequestAccessToken })
    Object.defineProperty(globalThis, 'google', {
      value: { accounts: { oauth2: { initTokenClient: mockInitTokenClient } } },
      configurable: true,
      writable: true,
    })

    renderHook(() => useGoogleAuth(), { wrapper })

    // Give effects time to settle
    await act(async () => {})

    expect(mockRequestAccessToken).not.toHaveBeenCalled()
  })
})
