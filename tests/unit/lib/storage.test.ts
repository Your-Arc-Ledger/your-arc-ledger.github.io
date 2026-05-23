import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadSheetRef,
  saveSheetRef,
  loadSessionHint,
  saveSessionHint,
  clearSessionHint,
} from '../../../src/lib/storage'

describe('storage — SheetRef', () => {
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

describe('storage — SessionHint', () => {
  beforeEach(() => localStorage.clear())

  it('returns null when no hint is stored', () => {
    expect(loadSessionHint()).toBeNull()
  })

  it('round-trips a SessionHint', () => {
    const hint = { expiresAt: 1234567890 }
    saveSessionHint(hint)
    expect(loadSessionHint()).toEqual(hint)
  })

  it('returns null for malformed JSON', () => {
    localStorage.setItem('arc-session-hint', 'not-json{')
    expect(loadSessionHint()).toBeNull()
  })

  it('returns null when stored value is missing expiresAt', () => {
    localStorage.setItem('arc-session-hint', JSON.stringify({}))
    expect(loadSessionHint()).toBeNull()
  })

  it('clearSessionHint removes the stored hint', () => {
    saveSessionHint({ expiresAt: 1234567890 })
    clearSessionHint()
    expect(loadSessionHint()).toBeNull()
  })
})
