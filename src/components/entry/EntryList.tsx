import { useEntriesContext } from '@/context/EntriesContext'
import type { EntriesState } from '@/context/EntriesContext'
import EntryCard from './EntryCard'
import { Button } from '@/components/ui/button'
import type { Entry } from '@/models/entry'

type Filter = EntriesState['filter']

const FILTERS: { label: string; value: Filter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Achievements', value: 'achievement' },
  { label: 'Setbacks', value: 'setback' },
]

export default function EntryList({ items: itemsProp, onEdit }: { items?: Entry[]; onEdit?: (entry: Entry) => void }) {
  const { state, dispatch } = useEntriesContext()

  const baseItems = itemsProp !== undefined ? itemsProp : state.items

  const filtered =
    state.filter === 'all'
      ? baseItems
      : baseItems.filter((e) => e.type === state.filter)

  const items = [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

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

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {FILTERS.map(({ label, value }) => (
          <Button
            key={value}
            variant={state.filter === value ? 'default' : 'outline'}
            size="sm"
            onClick={() => dispatch({ type: 'SET_FILTER', payload: value })}
          >
            {label}
          </Button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium">No entries yet</p>
          <p className="text-sm mt-1">Log your first achievement or setback above.</p>
        </div>
      ) : (
        items.map((entry) => <EntryCard key={entry.id} entry={entry} onEdit={onEdit ? () => onEdit(entry) : undefined} />)
      )}
    </div>
  )
}
