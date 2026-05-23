import { useEntriesContext } from '@/context/EntriesContext'
import { createEntry, validateEntry } from '@/models/entry'

export function useEntries() {
  const { state, dispatch } = useEntriesContext()

  function addEntry(fields) {
    const validation = validateEntry(fields)
    if (!validation.valid) return

    const entry = createEntry(fields)
    dispatch({ type: 'APPEND_ENTRY', payload: entry })
  }

  return {
    entries: state.items,
    filter: state.filter,
    status: state.status,
    error: state.error,
    addEntry,
  }
}
