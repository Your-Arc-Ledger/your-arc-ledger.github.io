import { type ReactNode, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useGoogleAuth } from '@/hooks/useGoogleAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { initSheet } from '@/services/googleSheets'
import { SPREADSHEET_STORAGE_KEY as STORAGE_KEY } from '@/lib/constants'

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
        body: JSON.stringify({ properties: { title: 'Arc' } }),
      })
      const data = await res.json() as { spreadsheetId?: string; error?: { message: string } }
      if (!data.spreadsheetId) {
        throw new Error(data.error?.message ?? 'Could not create spreadsheet')
      }
      await initSheet(data.spreadsheetId, accessToken)
      localStorage.setItem(STORAGE_KEY, data.spreadsheetId)
      onSelected(data.spreadsheetId)
    } catch (e) {
      setInitError(e instanceof Error ? e.message : 'Failed to create spreadsheet')
    } finally {
      setCreating(false)
    }
  }

  function handleConnect() {
    setUrlError('')
    const id = extractSpreadsheetId(url)
    if (!id) {
      setUrlError(
        'URL format not recognised. It should look like: https://docs.google.com/spreadsheets/d/{ID}/edit'
      )
      return
    }
    localStorage.setItem(STORAGE_KEY, id)
    onSelected(id)
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
          <Button variant="outline" onClick={handleConnect}>
            Connect
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
    () => localStorage.getItem(STORAGE_KEY)
  )

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
