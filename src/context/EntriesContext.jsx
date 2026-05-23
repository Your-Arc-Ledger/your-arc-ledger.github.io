import { createContext, useReducer, useContext } from 'react'

const initialState = {
  status: 'idle',
  items: [],
  filter: 'all',
  error: null,
}

function entriesReducer(state, action) {
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
    default:
      return state
  }
}

export const EntriesContext = createContext(null)

export function EntriesProvider({ children }) {
  const [state, dispatch] = useReducer(entriesReducer, initialState)
  return (
    <EntriesContext.Provider value={{ state, dispatch }}>
      {children}
    </EntriesContext.Provider>
  )
}

export function useEntriesContext() {
  const ctx = useContext(EntriesContext)
  if (!ctx) throw new Error('useEntriesContext must be used within EntriesProvider')
  return ctx
}
