import type { Entry } from '@/models/entry'

const BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets'
const SHEET_NAME = 'Entries'
const RANGE = `${SHEET_NAME}!A:G`
const HEADER = ['id', 'type', 'title', 'description', 'category', 'date', 'createdAt']

const LOOKUPS_SHEET_NAME = 'Lookups'
const LOOKUPS_RANGE = `${LOOKUPS_SHEET_NAME}!A:B`
const LOOKUPS_HEADER = ['type', 'value']

function authHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  }
}

function parseCategories(raw: string): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.filter(Boolean)
  } catch {
    // legacy plain-string format
  }
  return [raw]
}

function rowToEntry(row: string[]): Entry {
  return {
    id: row[0] ?? '',
    type: (row[1] === 'lesson' ? 'lesson' : 'achievement') as Entry['type'],
    title: row[2] ?? '',
    description: row[3] ?? '',
    categories: parseCategories(row[4] ?? ''),
    date: row[5] ?? '',
    createdAt: row[6] ?? '',
  }
}

export async function readEntries(spreadsheetId: string, accessToken: string): Promise<Entry[]> {
  const url = `${BASE_URL}/${spreadsheetId}/values/${RANGE}`
  const res = await fetch(url, { headers: authHeaders(accessToken) })
  const data = await res.json() as { values?: string[][] }

  if (!data.values || data.values.length <= 1) return []
  return data.values.slice(1).map(rowToEntry)
}

export async function appendEntry(
  spreadsheetId: string,
  accessToken: string,
  entry: Entry
): Promise<void> {
  const url = `${BASE_URL}/${spreadsheetId}/values/${RANGE}:append?valueInputOption=RAW`
  const row = [entry.id, entry.type, entry.title, entry.description, JSON.stringify(entry.categories), entry.date, entry.createdAt]
  const body = JSON.stringify({ values: [row] })

  async function attempt(): Promise<void> {
    const res = await fetch(url, {
      method: 'POST',
      headers: authHeaders(accessToken),
      body,
    })
    if (!res.ok) throw new Error(`Sheets API error: ${res.status}`)
  }

  try {
    await attempt()
  } catch {
    await new Promise((r) => setTimeout(r, 2000))
    try {
      await attempt()
    } catch {
      throw new Error('Failed to save entry. Please check your connection and try again.')
    }
  }
}

export async function updateEntry(
  spreadsheetId: string,
  accessToken: string,
  entry: Entry
): Promise<void> {
  const readUrl = `${BASE_URL}/${spreadsheetId}/values/${RANGE}`
  const readRes = await fetch(readUrl, { headers: authHeaders(accessToken) })
  if (!readRes.ok) throw new Error(`Sheets API error: ${readRes.status}`)
  const data = await readRes.json() as { values?: string[][] }

  const rowIndex = data.values?.findIndex((row) => row[0] === entry.id) ?? -1
  if (rowIndex === -1) throw new Error('Entry not found in spreadsheet')

  const sheetRow = rowIndex + 1
  const range = `${SHEET_NAME}!A${sheetRow}:G${sheetRow}`
  const row = [entry.id, entry.type, entry.title, entry.description, JSON.stringify(entry.categories), entry.date, entry.createdAt]

  const updateUrl = `${BASE_URL}/${spreadsheetId}/values/${range}?valueInputOption=RAW`
  const updateRes = await fetch(updateUrl, {
    method: 'PUT',
    headers: authHeaders(accessToken),
    body: JSON.stringify({ values: [row] }),
  })
  if (!updateRes.ok) throw new Error(`Sheets API error: ${updateRes.status}`)
}

export async function readCategories(spreadsheetId: string, accessToken: string): Promise<string[]> {
  const url = `${BASE_URL}/${spreadsheetId}/values/${LOOKUPS_RANGE}`
  const res = await fetch(url, { headers: authHeaders(accessToken) })
  const data = await res.json() as { values?: string[][] }
  if (!data.values || data.values.length <= 1) return []
  return data.values
    .slice(1)
    .filter((row) => row[0] === 'category' && row[1])
    .map((row) => row[1])
}

export async function appendCategory(
  spreadsheetId: string,
  accessToken: string,
  category: string
): Promise<void> {
  const url = `${BASE_URL}/${spreadsheetId}/values/${LOOKUPS_RANGE}:append?valueInputOption=RAW`
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify({ values: [['category', category]] }),
  })
  if (!res.ok) throw new Error(`Sheets API error: ${res.status}`)
}

async function ensureSheet(
  spreadsheetId: string,
  accessToken: string,
  name: string,
  headerRange: string,
  header: string[]
): Promise<void> {
  const batchUrl = `${BASE_URL}/${spreadsheetId}:batchUpdate`
  await fetch(batchUrl, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify({ requests: [{ addSheet: { properties: { title: name } } }] }),
  })
  const headerUrl = `${BASE_URL}/${spreadsheetId}/values/${headerRange}:append?valueInputOption=RAW`
  await fetch(headerUrl, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify({ values: [header] }),
  })
}

export async function initSheet(spreadsheetId: string, accessToken: string): Promise<void> {
  const metaUrl = `${BASE_URL}/${spreadsheetId}`
  const metaRes = await fetch(metaUrl, { headers: authHeaders(accessToken) })
  const meta = await metaRes.json() as { sheets: Array<{ properties: { title: string } }> }
  const titles = meta.sheets?.map((s) => s.properties.title) ?? []

  if (!titles.includes(SHEET_NAME)) {
    await ensureSheet(spreadsheetId, accessToken, SHEET_NAME, `${SHEET_NAME}!A1:G1`, HEADER)
  }

  if (!titles.includes(LOOKUPS_SHEET_NAME)) {
    await ensureSheet(spreadsheetId, accessToken, LOOKUPS_SHEET_NAME, `${LOOKUPS_SHEET_NAME}!A1:B1`, LOOKUPS_HEADER)
  }
}
