import { useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { loadTokenCache } from '@/lib/storage'

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(config: {
            client_id: string
            scope: string
            callback: (response: { access_token?: string; expires_in?: number; error?: string }) => void
          }): { requestAccessToken(cfg?: { prompt?: string }): void }
        }
      }
    }
  }
}

const SCOPE = 'https://www.googleapis.com/auth/spreadsheets'
const GIS_SRC = 'https://accounts.google.com/gsi/client'
const REFRESH_BUFFER_MS = 5 * 60 * 1000

export function useGoogleAuth() {
  const { state, dispatch } = useAuth()
  // Use a ref so effects always call the latest dispatch without being listed as deps
  const dispatchRef = useRef(dispatch)
  dispatchRef.current = dispatch

  useEffect(() => {
    if (document.querySelector(`script[src="${GIS_SRC}"]`)) return
    const script = document.createElement('script')
    script.src = GIS_SRC
    script.async = true
    document.body.appendChild(script)
  }, [])

  // Builds a token client. For silent flows, errors fall back to idle instead of showing an error banner.
  const buildClient = useCallback((silent: boolean) => {
    const gis = window.google?.accounts.oauth2
    if (!gis) return null
    return gis.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID as string,
      scope: SCOPE,
      callback(response) {
        if (response.access_token) {
          const expiresAt = Date.now() + (response.expires_in ?? 3600) * 1000
          dispatchRef.current({ type: 'SET_AUTHORISED', payload: { accessToken: response.access_token, expiresAt } })
        } else if (!silent) {
          dispatchRef.current({
            type: 'SET_ERROR',
            payload: response.error === 'invalid_token'
              ? 'Session expired — Reconnect'
              : 'Authorisation failed. Please try again.',
          })
        } else {
          // Silent attempt failed (Google session expired or consent revoked) — show connect button
          dispatchRef.current({ type: 'CLEAR' })
        }
      },
    })
  }, []) // stable: only closes over dispatchRef (always current) and a build-time constant

  // On page load: if there's a cached (possibly expired) token, attempt silent re-auth
  useEffect(() => {
    if (state.status !== 'idle' || !loadTokenCache()) return

    function attempt(): boolean {
      const client = buildClient(true)
      if (!client) return false
      dispatchRef.current({ type: 'SET_AUTHORISING' })
      client.requestAccessToken({ prompt: 'none' })
      return true
    }

    if (!attempt()) {
      // GIS not ready yet — retry when the script finishes loading
      const script = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`)
      if (!script) return
      const onLoad = () => { attempt() }
      script.addEventListener('load', onLoad)
      return () => script.removeEventListener('load', onLoad)
    }
  }, [state.status, buildClient])

  // While the page is open, silently refresh the token 5 minutes before it expires
  useEffect(() => {
    if (state.status !== 'authorised' || !state.expiresAt) return
    const delay = state.expiresAt - REFRESH_BUFFER_MS - Date.now()

    function refresh() {
      const client = buildClient(true)
      client?.requestAccessToken({ prompt: 'none' })
    }

    if (delay <= 0) {
      refresh()
      return
    }
    const id = setTimeout(refresh, delay)
    return () => clearTimeout(id)
  }, [state.status, state.expiresAt, buildClient])

  function initiateAuth() {
    const client = buildClient(false)
    dispatchRef.current({ type: 'SET_AUTHORISING' })
    client?.requestAccessToken()
  }

  function handleApiError(status: number) {
    if (status === 401) {
      dispatch({ type: 'SET_ERROR', payload: 'Session expired — Reconnect' })
    }
  }

  return { initiateAuth, handleApiError }
}
