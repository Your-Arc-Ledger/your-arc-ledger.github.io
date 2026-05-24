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
    localStorage.setItem('arc-spreadsheet:v1', 'not-json{')
    expect(loadSheetRef()).toBeNull()
  })

  it('returns null when stored value is missing the title field', () => {
    localStorage.setItem('arc-spreadsheet:v1', JSON.stringify({ id: 'abc' }))
    expect(loadSheetRef()).toBeNull()
  })

  it('returns null when stored value is missing the id field', () => {
    localStorage.setItem('arc-spreadsheet:v1', JSON.stringify({ title: 'Arc' }))
    expect(loadSheetRef()).toBeNull()
  })

  it('migrates a SheetRef from the legacy unversioned key', () => {
    const ref = { id: 'migrate-me', title: 'Old Sheet' }
    localStorage.setItem('arc-spreadsheet', JSON.stringify(ref))
    expect(loadSheetRef()).toEqual(ref)
    expect(localStorage.getItem('arc-spreadsheet:v1')).not.toBeNull()
    expect(localStorage.getItem('arc-spreadsheet')).toBeNull()
  })

  it('does not overwrite an existing v1 value when migrating legacy key', () => {
    const existing = { id: 'new', title: 'New Sheet' }
    const legacy = { id: 'old', title: 'Old Sheet' }
    localStorage.setItem('arc-spreadsheet:v1', JSON.stringify(existing))
    localStorage.setItem('arc-spreadsheet', JSON.stringify(legacy))
    expect(loadSheetRef()).toEqual(existing)
    expect(localStorage.getItem('arc-spreadsheet')).toBeNull()
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
    localStorage.setItem('arc-session-hint:v1', 'not-json{')
    expect(loadSessionHint()).toBeNull()
  })

  it('returns null when stored value is missing expiresAt', () => {
    localStorage.setItem('arc-session-hint:v1', JSON.stringify({}))
    expect(loadSessionHint()).toBeNull()
  })

  it('clearSessionHint removes the stored hint', () => {
    saveSessionHint({ expiresAt: 1234567890 })
    clearSessionHint()
    expect(loadSessionHint()).toBeNull()
  })

  it('migrates a SessionHint from the legacy unversioned key', () => {
    const hint = { expiresAt: 9999999999 }
    localStorage.setItem('arc-session-hint', JSON.stringify(hint))
    expect(loadSessionHint()).toEqual(hint)
    expect(localStorage.getItem('arc-session-hint:v1')).not.toBeNull()
    expect(localStorage.getItem('arc-session-hint')).toBeNull()
  })
})
