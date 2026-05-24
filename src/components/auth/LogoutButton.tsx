import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useEntriesContext } from '@/context/EntriesContext'
import { clearSheetRef, clearSessionHint } from '@/lib/storage'

export default function LogoutButton() {
  const { dispatch: authDispatch } = useAuth()
  const { dispatch: entriesDispatch } = useEntriesContext()
  const [confirming, setConfirming] = useState(false)

  function handleLogout() {
    clearSheetRef()
    clearSessionHint()
    entriesDispatch({ type: 'RESET' })
    authDispatch({ type: 'CLEAR' })
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Log out?</span>
        <button
          onClick={handleLogout}
          className="text-sm px-3 py-1.5 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
        >
          Confirm
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-sm px-3 py-1.5 rounded-md border hover:bg-accent transition-colors"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-sm px-3 py-1.5 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
    >
      Log out
    </button>
  )
}
