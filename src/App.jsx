import { AuthProvider } from './context/AuthContext'
import { EntriesProvider } from './context/EntriesContext'
import { useEntries } from './hooks/useEntries'
import EntryForm from './components/entry/EntryForm'
import EntryList from './components/entry/EntryList'

function AppContent() {
  const { addEntry } = useEntries()

  function handleSubmit(fields) {
    addEntry(fields)
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-semibold">Achievement Diary</h1>
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
        <AppContent />
      </EntriesProvider>
    </AuthProvider>
  )
}
