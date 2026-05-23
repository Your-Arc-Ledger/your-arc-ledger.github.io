import { describe, it, expect, beforeEach } from 'vitest'
import { loadSheetRef, saveSheetRef } from '../../../src/lib/storage'

describe('storage', () => {
  beforeEach(() => localStorage.clear())

  it('returns null when no ref is stored', () => {
    expect(loadSheetRef()).toBeNull()
  })

  it('round-trips a SheetRef', () => {
    const ref = { id: 'abc123', title: 'My Sheet' }
    saveSheetRef(ref)
    expect(loadSheetRef()).toEqual(ref)
  })

  it('returns null for malformed JSON', () => {
    localStorage.setItem('arc-spreadsheet', 'not-json{')
    expect(loadSheetRef()).toBeNull()
  })

  it('returns null when stored value is missing the title field', () => {
    localStorage.setItem('arc-spreadsheet', JSON.stringify({ id: 'abc' }))
    expect(loadSheetRef()).toBeNull()
  })

  it('returns null when stored value is missing the id field', () => {
    localStorage.setItem('arc-spreadsheet', JSON.stringify({ title: 'Arc' }))
    expect(loadSheetRef()).toBeNull()
  })
})
