const SHEET_REF_KEY = 'arc-spreadsheet'

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
