import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readEntries, appendEntry, initSheet, updateEntry } from '../../src/services/googleSheets'
import type { Entry } from '../../src/models/entry'

const SPREADSHEET_ID = 'test-spreadsheet-id'
const ACCESS_TOKEN = 'test-access-token'

const HEADER_ROW = ['id', 'type', 'title', 'description', 'category', 'date', 'createdAt']
const DATA_ROW: string[] = [
  'uuid-1',
  'achievement',
  'My title',
  'My description',
  'Work',
  '2026-05-23',
  '2026-05-23T10:00:00.000Z',
]

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('readEntries', () => {
  it('skips the header row and maps rows to Entry objects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ values: [HEADER_ROW, DATA_ROW] }),
    }))

    const entries = await readEntries(SPREADSHEET_ID, ACCESS_TOKEN)

    expect(entries).toHaveLength(1)
    expect(entries[0].id).toBe('uuid-1')
    expect(entries[0].type).toBe('achievement')
    expect(entries[0].title).toBe('My title')
    expect(entries[0].description).toBe('My description')
    expect(entries[0].category).toBe('Work')
    expect(entries[0].date).toBe('2026-05-23')
    expect(entries[0].createdAt).toBe('2026-05-23T10:00:00.000Z')
  })

  it('returns an empty array when values is absent', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }))

    const entries = await readEntries(SPREADSHEET_ID, ACCESS_TOKEN)
    expect(entries).toEqual([])
  })

  it('returns an empty array when only the header row is present', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ values: [HEADER_ROW] }),
    }))

    const entries = await readEntries(SPREADSHEET_ID, ACCESS_TOKEN)
    expect(entries).toEqual([])
  })

  it('calls fetch with the correct URL and Authorization header', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    })
    vi.stubGlobal('fetch', mockFetch)

    await readEntries(SPREADSHEET_ID, ACCESS_TOKEN)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(SPREADSHEET_ID),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        }),
      })
    )
  })
})

describe('appendEntry', () => {
  const entry: Entry = {
    id: 'uuid-1',
    type: 'achievement',
    title: 'My title',
    description: 'My description',
    category: 'Work',
    date: '2026-05-23',
    createdAt: '2026-05-23T10:00:00.000Z',
  }

  it('calls fetch with correct URL, Authorization header, and 7-element row payload', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ updatedRange: 'Entries!A2:G2' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await appendEntry(SPREADSHEET_ID, ACCESS_TOKEN, entry)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('append'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        }),
        body: expect.stringContaining(entry.id),
      })
    )

    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
    expect(body.values[0]).toHaveLength(7)
    expect(body.values[0]).toEqual([
      entry.id, entry.type, entry.title, entry.description, entry.category, entry.date, entry.createdAt,
    ])
  })

  it('retries once on network error and throws on second failure', async () => {
    vi.useFakeTimers()
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'))
    vi.stubGlobal('fetch', mockFetch)

    let caughtError: Error | undefined
    const settled = appendEntry(SPREADSHEET_ID, ACCESS_TOKEN, entry).catch((e: Error) => {
      caughtError = e
    })
    await vi.runAllTimersAsync()
    await settled

    expect(caughtError).toBeDefined()
    expect(caughtError?.message).toMatch(/failed to save/i)
    expect(mockFetch).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })
})

describe('updateEntry', () => {
  const entry: Entry = {
    id: 'uuid-1',
    type: 'lesson',
    title: 'Updated title',
    description: 'Updated desc',
    category: 'Health',
    date: '2026-05-24',
    createdAt: '2026-05-23T10:00:00.000Z',
  }

  it('reads the sheet then PUTs the updated row at the correct range', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ values: [HEADER_ROW, DATA_ROW] }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })

    vi.stubGlobal('fetch', mockFetch)

    await updateEntry(SPREADSHEET_ID, ACCESS_TOKEN, entry)

    expect(mockFetch).toHaveBeenCalledTimes(2)
    const [putUrl, putOptions] = mockFetch.mock.calls[1]
    expect(putUrl).toContain('A2:G2')
    expect(putUrl).toContain('valueInputOption=RAW')
    expect((putOptions as RequestInit).method).toBe('PUT')
    const body = JSON.parse((putOptions as RequestInit).body as string)
    expect(body.values[0]).toEqual([
      entry.id, entry.type, entry.title, entry.description, entry.category, entry.date, entry.createdAt,
    ])
  })

  it('throws when the entry id is not found in the sheet', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ values: [HEADER_ROW] }),
    }))

    await expect(updateEntry(SPREADSHEET_ID, ACCESS_TOKEN, entry)).rejects.toThrow(/not found/i)
  })
})

describe('initSheet', () => {
  it('calls batchUpdate to add sheet and appends header row when Entries sheet is absent', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sheets: [{ properties: { title: 'Sheet1' } }] }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })

    vi.stubGlobal('fetch', mockFetch)

    await initSheet(SPREADSHEET_ID, ACCESS_TOKEN)

    expect(mockFetch).toHaveBeenCalledTimes(3)
  })
})
