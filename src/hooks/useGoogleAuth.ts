import { useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(config: {
            client_id: string
            scope: string
            callback: (response: { access_token?: string; error?: string }) => void
          }): { requestAccessToken(): void }
        }
      }
    }
  }
}

const SCOPE = 'https://www.googleapis.com/auth/spreadsheets'
const GIS_SRC = 'https://accounts.google.com/gsi/client'

export function useGoogleAuth() {
  const { dispatch } = useAuth()
  const clientRef = useRef<{ requestAccessToken(): void } | null>(null)

  useEffect(() => {
    if (document.querySelector(`script[src="${GIS_SRC}"]`)) return
    const script = document.createElement('script')
    script.src = GIS_SRC
    script.async = true
    document.body.appendChild(script)
  }, [])

  function initiateAuth() {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string

    const gis = window.google?.accounts.oauth2
    const client = gis?.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback(response: { access_token?: string; error?: string }) {
        if (response.access_token) {
          dispatch({ type: 'SET_AUTHORISED', payload: response.access_token })
        } else {
          dispatch({
            type: 'SET_ERROR',
            payload: response.error === 'invalid_token'
              ? 'Session expired — Reconnect'
              : 'Authorisation failed. Please try again.',
          })
        }
      },
    })

    clientRef.current = client ?? null
    dispatch({ type: 'SET_AUTHORISING' })
    client?.requestAccessToken()
  }

  function handleApiError(status: number) {
    if (status === 401) {
      dispatch({ type: 'SET_ERROR', payload: 'Session expired — Reconnect' })
    }
  }

  return { initiateAuth, handleApiError }
}
