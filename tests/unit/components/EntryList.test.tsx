import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import EntryList from '../../../src/components/entry/EntryList'
import { EntriesProvider } from '../../../src/context/EntriesContext'
import type { Entry } from '../../../src/models/entry'


describe('EntryList', () => {
  it('shows empty-state message when items is empty', () => {
    render(
      <EntriesProvider>
        <EntryList />
      </EntriesProvider>
    )
    expect(screen.getByText(/no entries yet/i)).toBeInTheDocument()
  })

  it('renders entries in reverse-chronological order', () => {
    const items = [
      { id: '1', type: 'achievement' as const, title: 'First', date: '2026-05-01', createdAt: '2026-05-01T10:00:00.000Z', description: '', categories: [] },
      { id: '2', type: 'lesson' as const, title: 'Second', date: '2026-05-10', createdAt: '2026-05-10T10:00:00.000Z', description: '', categories: [] },
    ]
    render(
      <EntriesProvider>
        <EntryList items={items} />
      </EntriesProvider>
    )
    const titles = screen.getAllByText(/First|Second/)
    expect(titles[0]).toHaveTextContent('Second')
    expect(titles[1]).toHaveTextContent('First')
  })

  it('calls onEdit with the entry when Edit button is clicked', () => {
    const onEdit = vi.fn()
    const items: Entry[] = [
      { id: '1', type: 'achievement', title: 'Win', date: '2026-05-01', createdAt: '2026-05-01T10:00:00.000Z', description: '', categories: [] },
    ]
    render(
      <EntriesProvider>
        <EntryList items={items} onEdit={onEdit} />
      </EntriesProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: /edit/i }))
    expect(onEdit).toHaveBeenCalledWith(items[0])
  })
})
