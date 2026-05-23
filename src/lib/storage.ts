const SHEET_REF_KEY = 'arc-spreadsheet'
const TOKEN_CACHE_KEY = 'arc-token-cache'

export interface SheetRef {
  id: string
  title: string
}

export function loadSheetRef(): SheetRef | null {
  try {
    const raw = localStorage.getItem(SHEET_REF_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as SheetRef).id === 'string' &&
      typeof (parsed as SheetRef).title === 'string'
    ) {
      return parsed as SheetRef
    }
    return null
  } catch {
    return null
  }
}

export function saveSheetRef(ref: SheetRef): void {
  localStorage.setItem(SHEET_REF_KEY, JSON.stringify(ref))
}

export interface TokenCache {
  accessToken: string
  expiresAt: number
}

export function loadTokenCache(): TokenCache | null {
  try {
    const raw = localStorage.getItem(TOKEN_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as TokenCache).accessToken === 'string' &&
      typeof (parsed as TokenCache).expiresAt === 'number'
    ) {
      return parsed as TokenCache
    }
    return null
  } catch {
    return null
  }
}

export function saveTokenCache(cache: TokenCache): void {
  localStorage.setItem(TOKEN_CACHE_KEY, JSON.stringify(cache))
}

export function clearTokenCache(): void {
  localStorage.removeItem(TOKEN_CACHE_KEY)
}
