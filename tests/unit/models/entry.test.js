import { describe, it, expect } from 'vitest'
import { createEntry, validateEntry } from '../../../src/models/entry.js'

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
    const fields = { type: 'setback', title: 'Missed goal', description: 'Desc', date: '2026-05-01' }
    const entry = createEntry(fields)
    expect(entry.type).toBe('setback')
    expect(entry.title).toBe('Missed goal')
    expect(entry.description).toBe('Desc')
    expect(entry.date).toBe('2026-05-01')
  })
})

describe('validateEntry', () => {
  const base = { type: 'achievement', title: 'Valid title', date: '2026-05-23' }

  it('returns valid for a complete valid entry', () => {
    expect(validateEntry(base).valid).toBe(true)
  })

  it('rejects blank title', () => {
    const result = validateEntry({ ...base, title: '' })
    expect(result.valid).toBe(false)
    expect(result.errors.title).toBeDefined()
  })

  it('rejects whitespace-only title', () => {
    const result = validateEntry({ ...base, title: '   ' })
    expect(result.valid).toBe(false)
    expect(result.errors.title).toBeDefined()
  })

  it('rejects title longer than 200 characters', () => {
    const result = validateEntry({ ...base, title: 'a'.repeat(201) })
    expect(result.valid).toBe(false)
    expect(result.errors.title).toBeDefined()
  })

  it('rejects invalid type values', () => {
    const result = validateEntry({ ...base, type: 'win' })
    expect(result.valid).toBe(false)
    expect(result.errors.type).toBeDefined()
  })

  it('accepts achievement and setback as valid types', () => {
    expect(validateEntry({ ...base, type: 'achievement' }).valid).toBe(true)
    expect(validateEntry({ ...base, type: 'setback' }).valid).toBe(true)
  })

  it('rejects description longer than 2000 characters', () => {
    const result = validateEntry({ ...base, description: 'a'.repeat(2001) })
    expect(result.valid).toBe(false)
    expect(result.errors.description).toBeDefined()
  })

  it('rejects category longer than 50 characters', () => {
    const result = validateEntry({ ...base, category: 'a'.repeat(51) })
    expect(result.valid).toBe(false)
    expect(result.errors.category).toBeDefined()
  })

  it('rejects an invalid date string', () => {
    const result = validateEntry({ ...base, date: 'not-a-date' })
    expect(result.valid).toBe(false)
    expect(result.errors.date).toBeDefined()
  })
})
