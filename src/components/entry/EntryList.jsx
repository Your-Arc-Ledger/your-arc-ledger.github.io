import { useEntriesContext } from '@/context/EntriesContext'
import EntryCard from './EntryCard'
import { Button } from '@/components/ui/button'

export default function EntryList({ items: itemsProp }) {
  const { state } = useEntriesContext()

  const items = itemsProp !== undefined
    ? [...itemsProp].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    : [...state.items]

  if (state.status === 'loading') {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="text-center py-8 space-y-3">
        <p className="text-destructive">{state.error || 'Something went wrong loading your entries.'}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">No entries yet</p>
        <p className="text-sm mt-1">Log your first achievement or setback above.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((entry) => (
        <EntryCard key={entry.id} entry={entry} />
      ))}
    </div>
  )
}
