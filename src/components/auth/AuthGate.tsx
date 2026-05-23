import { type ReactNode, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useGoogleAuth } from '@/hooks/useGoogleAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { initSheet } from '@/services/googleSheets'
import { loadSheetRef, saveSheetRef } from '@/lib/storage'

const SHEETS_URL_RE = /\/spreadsheets\/d\/([^/]+)/

function extractSpreadsheetId(url: string): string | null {
  const match = SHEETS_URL_RE.exec(url)
  return match ? match[1] : null
}

interface SpreadsheetPickerProps {
  accessToken: string
  onSelected: (id: string) => void
}

function SpreadsheetPicker({ accessToken, onSelected }: SpreadsheetPickerProps) {
  const [url, setUrl] = useState('')
  const [urlError, setUrlError] = useState('')
  const [creating, setCreating] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [initError, setInitError] = useState('')

  async function handleCreate() {
    setCreating(true)
    setInitError('')
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
      setInitError(e instanceof Error ? e.message : 'Failed to create spreadsheet')
    } finally {
      setCreating(false)
    }
  }

  async function handleConnect() {
    setUrlError('')
    const id = extractSpreadsheetId(url)
    if (!id) {
      setUrlError(
        'URL format not recognised. It should look like: https://docs.google.com/spreadsheets/d/{ID}/edit'
      )
      return
    }
    setConnecting(true)
    try {
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${id}?fields=properties.title`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      if (!res.ok) throw new Error(`Could not fetch spreadsheet (${res.status})`)
      const meta = await res.json() as { properties?: { title?: string } }
      saveSheetRef({ id, title: meta.properties?.title ?? 'your spreadsheet' })
      onSelected(id)
    } catch (e) {
      setUrlError(e instanceof Error ? e.message : 'Failed to connect spreadsheet')
    } finally {
      setConnecting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="font-medium">First time? Create a spreadsheet in your Drive:</p>
        <Button onClick={handleCreate} disabled={creating}>
          {creating ? 'Creating…' : 'Create new spreadsheet'}
        </Button>
        {initError && <p className="text-sm text-destructive">{initError}</p>}
      </div>
      <div className="space-y-2">
        <p className="font-medium">Returning? Enter your spreadsheet URL:</p>
        <div className="flex gap-2">
          <Input
            aria-label="Spreadsheet URL"
            placeholder="https://docs.google.com/spreadsheets/d/…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Button variant="outline" onClick={handleConnect} disabled={connecting}>
            {connecting ? 'Connecting…' : 'Connect'}
          </Button>
        </div>
        {urlError && <p className="text-sm text-destructive">{urlError}</p>}
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

  return (
    <div className="max-w-md mx-auto mt-24 p-6 text-center space-y-4">
      <h2 className="text-xl font-semibold">Arc</h2>

      {state.status === 'error' ? (
        <>
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
        </>
      ) : (
        <>
          <p className="text-muted-foreground">
            Connect your Google account to save entries to your own spreadsheet.
          </p>
          <Button
            onClick={initiateAuth}
            disabled={state.status === 'authorising'}
          >
            {state.status === 'authorising' ? 'Connecting…' : 'Connect Google Account'}
          </Button>
        </>
      )}
    </div>
  )
}
