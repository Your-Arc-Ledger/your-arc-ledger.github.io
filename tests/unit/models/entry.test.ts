import { describe, it, expect } from 'vitest'
import { createEntry, validateEntry } from '../../../src/models/entry'
import type { ValidationFailure } from '../../../src/models/entry'

function fail(r: ReturnType<typeof validateEntry>): ValidationFailure {
  expect(r.valid).toBe(false)
  return r as ValidationFailure
}

describe('createEntry', () => {
  it('generates a UUID v4 id', () => {
    const entry = createEntry({ type: 'achievement', title: 'Test', date: '2026-05-23' })
    expect(entry.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )
  })

  it('generates an ISO datetime createdAt', () => {
    const before = new Date().toISOString()
    const entry = createEntry({ type: 'achievement', title: 'Test', date: '2026-05-23' })
    const after = new Date().toISOString()
    expect(entry.createdAt >= before).toBe(true)
    expect(entry.createdAt <= after).toBe(true)
  })

  it('merges provided fields', () => {
    const fields = { type: 'setback' as const, title: 'Missed goal', description: 'Desc', date: '2026-05-01' }
    const entry = createEntry(fields)
    expect(entry.type).toBe('setback')
    expect(entry.title).toBe('Missed goal')
    expect(entry.description).toBe('Desc')
    expect(entry.date).toBe('2026-05-01')
  })
})

describe('validateEntry', () => {
  const base = { type: 'achievement' as const, title: 'Valid title', date: '2026-05-23' }

  it('returns valid for a complete valid entry', () => {
    expect(validateEntry(base).valid).toBe(true)
  })

  it('rejects blank title', () => {
    expect(fail(validateEntry({ ...base, title: '' })).errors.title).toBeDefined()
  })

  it('rejects whitespace-only title', () => {
    expect(fail(validateEntry({ ...base, title: '   ' })).errors.title).toBeDefined()
  })

  it('rejects title longer than 200 characters', () => {
    expect(fail(validateEntry({ ...base, title: 'a'.repeat(201) })).errors.title).toBeDefined()
  })

  it('rejects invalid type values', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = validateEntry({ ...base, type: 'win' as any })
    expect(fail(result).errors.type).toBeDefined()
  })

  it('accepts achievement and setback as valid types', () => {
    expect(validateEntry({ ...base, type: 'achievement' }).valid).toBe(true)
    expect(validateEntry({ ...base, type: 'setback' }).valid).toBe(true)
  })

  it('rejects description longer than 2000 characters', () => {
    expect(fail(validateEntry({ ...base, description: 'a'.repeat(2001) })).errors.description).toBeDefined()
  })

  it('rejects any category value longer than 50 characters', () => {
    expect(fail(validateEntry({ ...base, categories: ['a'.repeat(51)] })).errors.categories).toBeDefined()
  })

  it('accepts an empty categories array', () => {
    expect(validateEntry({ ...base, categories: [] }).valid).toBe(true)
  })

  it('accepts multiple valid category values', () => {
    expect(validateEntry({ ...base, categories: ['Work', 'Health'] }).valid).toBe(true)
  })

  it('rejects an invalid date string', () => {
    expect(fail(validateEntry({ ...base, date: 'not-a-date' })).errors.date).toBeDefined()
  })
})
