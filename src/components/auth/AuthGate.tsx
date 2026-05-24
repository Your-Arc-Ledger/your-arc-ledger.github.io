import { type ReactNode, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useGoogleAuth } from '@/hooks/useGoogleAuth'
import { Button } from '@/components/ui/button'
import { initSheet } from '@/services/googleSheets'
import { loadSheetRef, saveSheetRef } from '@/lib/storage'

const GAPI_SRC = 'https://apis.google.com/js/api.js'

function loadPickerApi(): Promise<void> {
  if (window.gapi) return Promise.resolve()
  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GAPI_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = GAPI_SRC
    script.onload = () => resolve()
    document.body.appendChild(script)
  })
}

function openDrivePicker(accessToken: string): Promise<{ id: string; name: string } | null> {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY as string
  return loadPickerApi().then(
    () =>
      new Promise((resolve) => {
        window.gapi!.load('picker', () => {
          new window.google!.picker!.PickerBuilder()
            .setDeveloperKey(apiKey)
            .setOAuthToken(accessToken)
            .addView(
              new window.google!.picker!.DocsView().setMimeTypes(
                'application/vnd.google-apps.spreadsheet'
              )
            )
            .setCallback((data) => {
              if (data.action === 'picked' && data.docs?.[0]) {
                resolve({ id: data.docs[0].id, name: data.docs[0].name })
              } else if (data.action === 'cancel') {
                resolve(null)
              }
            })
            .build()
            .setVisible(true)
        })
      })
  )
}

interface SpreadsheetPickerProps {
  accessToken: string
  onSelected: (id: string) => void
}

function SpreadsheetPicker({ accessToken, onSelected }: SpreadsheetPickerProps) {
  const [creating, setCreating] = useState(false)
  const [browsing, setBrowsing] = useState(false)
  const [createError, setCreateError] = useState('')
  const [connectError, setConnectError] = useState('')

  async function handleCreate() {
    setCreating(true)
    setCreateError('')
    try {
      const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ properties: { title: 'Arc Ledger' } }),
      })
      if (!res.ok) throw new Error(`Could not create spreadsheet (${res.status})`)
      const data = await res.json() as {
        spreadsheetId?: string
        properties?: { title?: string }
        error?: { message: string }
      }
      if (!data.spreadsheetId) {
        throw new Error(data.error?.message ?? 'Could not create spreadsheet')
      }
      await initSheet(data.spreadsheetId, accessToken)
      saveSheetRef({ id: data.spreadsheetId, title: data.properties?.title ?? 'Arc Ledger' })
      onSelected(data.spreadsheetId)
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Failed to create spreadsheet')
    } finally {
      setCreating(false)
    }
  }

  async function handleBrowse() {
    setBrowsing(true)
    setConnectError('')
    try {
      const file = await openDrivePicker(accessToken)
      if (!file) return
      await initSheet(file.id, accessToken)
      saveSheetRef({ id: file.id, title: file.name })
      onSelected(file.id)
    } catch (e) {
      setConnectError(e instanceof Error ? e.message : 'Failed to connect spreadsheet')
    } finally {
      setBrowsing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="font-medium">First time? Create a spreadsheet in your Drive:</p>
        <Button onClick={handleCreate} disabled={creating}>
          {creating ? 'Creating…' : 'Create new spreadsheet'}
        </Button>
        {createError && <p className="text-sm text-destructive">{createError}</p>}
      </div>
      <div className="space-y-2">
        <p className="font-medium">Returning? Pick your existing spreadsheet:</p>
        <Button variant="outline" onClick={handleBrowse} disabled={browsing}>
          {browsing ? 'Connecting…' : 'Browse Drive'}
        </Button>
        {connectError && <p className="text-sm text-destructive">{connectError}</p>}
      </div>
    </div>
  )
}

export default function AuthGate({ children }: { children: ReactNode }) {
  const { state, dispatch } = useAuth()
  const { initiateAuth } = useGoogleAuth()
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(
    () => loadSheetRef()?.id ?? null
  )

  const sheetRef = state.status === 'error' ? loadSheetRef() : null

  if (state.status === 'authorised' && spreadsheetId) {
    return <>{children}</>
  }

  if (state.status === 'authorised' && !spreadsheetId) {
    return (
      <div className="max-w-lg mx-auto mt-16 p-6 space-y-4">
        <h2 className="text-xl font-semibold">Set up your spreadsheet</h2>
        <SpreadsheetPicker
          accessToken={state.accessToken!}
          onSelected={(id) => setSpreadsheetId(id)}
        />
      </div>
    )
  }

  if (state.status === 'restoring' || state.status === 'authorising') {
    return (
      <div className="max-w-md mx-auto mt-24 p-6 text-center space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Arc</h1>
        <p className="text-muted-foreground">Reconnecting…</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto mt-24 p-6 text-center space-y-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Arc</h1>
        <p className="text-lg text-foreground/80 leading-relaxed">
          A place for your personal story. Your achievements, your setbacks, and the lessons that come with each.
        </p>
      </div>

      {state.status === 'error' ? (
        <div className="space-y-3">
          <p className="text-destructive">{state.error}</p>
          {sheetRef && (
            <p className="text-muted-foreground">
              Your spreadsheet &ldquo;{sheetRef.title}&rdquo; is still connected.
            </p>
          )}
          <Button
            onClick={() => {
              dispatch({ type: 'CLEAR' })
              initiateAuth()
            }}
          >
            Reconnect Google Account
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Connect your Google account to save entries to your own spreadsheet.
          </p>
          <Button onClick={initiateAuth}>
            Connect Google Account
          </Button>
        </div>
      )}
    </div>
  )
}
