import { createContext, useReducer, useContext, ReactNode } from 'react'
import type { Entry } from '@/models/entry'

export interface EntriesState {
  status: 'idle' | 'loading' | 'loaded' | 'saving' | 'error'
  items: Entry[]
  filter: 'all' | 'achievement' | 'setback'
  error: string | null
}

type EntriesAction =
  | { type: 'SET_LOADING' }
  | { type: 'SET_ENTRIES'; payload: Entry[] }
  | { type: 'APPEND_ENTRY'; payload: Entry }
  | { type: 'SET_FILTER'; payload: EntriesState['filter'] }
  | { type: 'SET_SAVING' }
  | { type: 'SET_ERROR'; payload: string }

const initialState: EntriesState = {
  status: 'idle',
  items: [],
  filter: 'all',
  error: null,
}

function entriesReducer(state: EntriesState, action: EntriesAction): EntriesState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, status: 'loading', error: null }
    case 'SET_ENTRIES':
      return { ...state, status: 'loaded', items: action.payload, error: null }
    case 'APPEND_ENTRY':
      return {
        ...state,
        status: 'loaded',
        items: [action.payload, ...state.items],
        error: null,
      }
    case 'SET_FILTER':
      return { ...state, filter: action.payload }
    case 'SET_SAVING':
      return { ...state, status: 'saving' }
    case 'SET_ERROR':
      return { ...state, status: 'error', error: action.payload }
  }
}

interface EntriesContextValue {
  state: EntriesState
  dispatch: React.Dispatch<EntriesAction>
}

export const EntriesContext = createContext<EntriesContextValue | null>(null)

export function EntriesProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(entriesReducer, initialState)
  return (
    <EntriesContext.Provider value={{ state, dispatch }}>
      {children}
    </EntriesContext.Provider>
  )
}

export function useEntriesContext(): EntriesContextValue {
  const ctx = useContext(EntriesContext)
  if (!ctx) throw new Error('useEntriesContext must be used within EntriesProvider')
  return ctx
}
