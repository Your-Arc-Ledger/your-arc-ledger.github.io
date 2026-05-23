import { AuthProvider } from './context/AuthContext'
import { EntriesProvider } from './context/EntriesContext'
import { useEntries } from './hooks/useEntries'
import EntryForm from './components/entry/EntryForm'
import EntryList from './components/entry/EntryList'
import EntrySummary from './components/summary/EntrySummary'
import AuthGate from './components/auth/AuthGate'
import type { EntryFields } from './models/entry'

function AppContent() {
  const { addEntry } = useEntries()

  function handleSubmit(fields: EntryFields) {
    void addEntry(fields)
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-semibold">Achievement Diary</h1>
      <EntrySummary />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section>
          <h2 className="text-lg font-medium mb-4">Log an Entry</h2>
          <EntryForm onSubmit={handleSubmit} />
        </section>
        <section>
          <h2 className="text-lg font-medium mb-4">Your Entries</h2>
          <EntryList />
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
        </AuthGate>
      </EntriesProvider>
    </AuthProvider>
  )
}
