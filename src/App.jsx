import { AuthProvider } from './context/AuthContext'
import { EntriesProvider } from './context/EntriesContext'

function App() {
  return (
    <AuthProvider>
      <EntriesProvider>
        <main className="min-h-screen p-4">
          {/* auth gate slot */}
          {/* entry form slot */}
          {/* entry list slot */}
          {/* summary panel slot */}
          <p className="text-muted-foreground text-center mt-8">
            Achievement Diary — loading…
          </p>
        </main>
      </EntriesProvider>
    </AuthProvider>
  )
}

export default App
