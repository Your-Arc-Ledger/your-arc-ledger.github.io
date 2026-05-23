import { createContext, useReducer, useContext } from 'react'

const initialState = {
  status: 'idle',
  accessToken: null,
  error: null,
}

function authReducer(state, action) {
  switch (action.type) {
    case 'SET_AUTHORISING':
      return { ...state, status: 'authorising', error: null }
    case 'SET_AUTHORISED':
      return { status: 'authorised', accessToken: action.payload, error: null }
    case 'SET_ERROR':
      return { ...state, status: 'error', error: action.payload }
    case 'CLEAR':
      return initialState
    default:
      return state
  }
}

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)
  return (
    <AuthContext.Provider value={{ state, dispatch }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
