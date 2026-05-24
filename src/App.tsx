import { useRef, useState, useMemo } from 'react'
import { AuthProvider } from './context/AuthContext'
import { EntriesProvider } from './context/EntriesContext'
import { useEntries } from './hooks/useEntries'
import { useCategories } from './hooks/useCategories'
import EntryForm from './components/entry/EntryForm'
import EntryList from './components/entry/EntryList'
import EntrySummary from './components/summary/EntrySummary'
import AuthGate from './components/auth/AuthGate'
import LogoutButton from './components/auth/LogoutButton'
import type { Entry, EntryFields } from './models/entry'

function AppContent() {
  const { entries, addEntry, updateEntry } = useEntries()
  const { categories: savedCategories, addCategory } = useCategories()

  const categories = useMemo(() => {
    const fromEntries = entries.flatMap((e) => e.categories).filter(Boolean)
    return Array.from(new Set([...savedCategories, ...fromEntries])).sort()
  }, [savedCategories, entries])

  const [editingEntry, setEditingEntry] = useState<Entry | null>(null)
  const formSectionRef = useRef<HTMLElement>(null)

  function handleEdit(entry: Entry) {
    setEditingEntry(entry)
    setTimeout(() => formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  function handleSubmit(fields: EntryFields) {
    void addEntry(fields)
  }

  function handleEditSave(fields: EntryFields) {
    if (!editingEntry) return
    void updateEntry({ ...editingEntry, ...fields })
    setEditingEntry(null)
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-semibold">Arc</h1>
      <EntrySummary />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section ref={formSectionRef}>
          <h2 className="text-lg font-medium mb-4">{editingEntry ? 'Edit Entry' : 'Log an Entry'}</h2>
          <div className={editingEntry ? 'hidden' : ''}>
            <EntryForm onSubmit={handleSubmit} categories={categories} onAddCategory={addCategory} />
          </div>
          {editingEntry && (
            <EntryForm
              initialValues={editingEntry}
              onSubmit={handleEditSave}
              onCancel={() => setEditingEntry(null)}
              submitLabel="Save Changes"
              categories={categories}
              onAddCategory={addCategory}
            />
          )}
        </section>
        <section>
          <h2 className="text-lg font-medium mb-4">Your Entries</h2>
          <EntryList onEdit={handleEdit} />
        </section>
      </div>
    </main>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <EntriesProvider>
        <AuthGate>
          <AppContent />
          <div className="fixed bottom-4 right-4 z-50">
            <LogoutButton />
          </div>
        </AuthGate>
      </EntriesProvider>
    </AuthProvider>
  )
}
