import { createContext, useReducer, useContext, useEffect, type ReactNode, type Dispatch } from 'react'
import { loadTokenCache, saveTokenCache, clearTokenCache } from '@/lib/storage'

const TOKEN_BUFFER_MS = 5 * 60 * 1000

export interface AuthState {
  status: 'idle' | 'authorising' | 'authorised' | 'error'
  accessToken: string | null
  expiresAt: number | null
  error: string | null
}

type AuthAction =
  | { type: 'SET_AUTHORISING' }
  | { type: 'SET_AUTHORISED'; payload: { accessToken: string; expiresAt: number } }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR' }

const initialState: AuthState = {
  status: 'idle',
  accessToken: null,
  expiresAt: null,
  error: null,
}

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_AUTHORISING':
      return { ...state, status: 'authorising', error: null }
    case 'SET_AUTHORISED':
      return {
        status: 'authorised',
        accessToken: action.payload.accessToken,
        expiresAt: action.payload.expiresAt,
        error: null,
      }
    case 'SET_ERROR':
      return { ...state, status: 'error', error: action.payload }
    case 'CLEAR':
      return initialState
  }
}

function initFromCache(init: AuthState): AuthState {
  const cache = loadTokenCache()
  if (cache && cache.expiresAt > Date.now() + TOKEN_BUFFER_MS) {
    return { status: 'authorised', accessToken: cache.accessToken, expiresAt: cache.expiresAt, error: null }
  }
  return init
}

interface AuthContextValue {
  state: AuthState
  dispatch: Dispatch<AuthAction>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState, initFromCache)

  useEffect(() => {
    if (state.status === 'authorised' && state.accessToken && state.expiresAt) {
      saveTokenCache({ accessToken: state.accessToken, expiresAt: state.expiresAt })
    } else if (state.status === 'idle') {
      clearTokenCache()
    }
  }, [state.status, state.accessToken, state.expiresAt])

  return (
    <AuthContext.Provider value={{ state, dispatch }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
