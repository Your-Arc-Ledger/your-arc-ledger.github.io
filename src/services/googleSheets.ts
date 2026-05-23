import type { Entry } from '@/models/entry'

const BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets'
const SHEET_NAME = 'Entries'
const RANGE = `${SHEET_NAME}!A:G`
const HEADER = ['id', 'type', 'title', 'description', 'category', 'date', 'createdAt']

function authHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  }
}

function rowToEntry(row: string[]): Entry {
  return {
    id: row[0] ?? '',
    type: (row[1] === 'lesson' ? 'lesson' : 'achievement') as Entry['type'],
    title: row[2] ?? '',
    description: row[3] ?? '',
    category: row[4] ?? '',
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
  const row = [entry.id, entry.type, entry.title, entry.description, entry.category, entry.date, entry.createdAt]
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

export async function initSheet(spreadsheetId: string, accessToken: string): Promise<void> {
  const metaUrl = `${BASE_URL}/${spreadsheetId}`
  const metaRes = await fetch(metaUrl, { headers: authHeaders(accessToken) })
  const meta = await metaRes.json() as { sheets: Array<{ properties: { title: string } }> }

  const hasEntriesSheet = meta.sheets?.some((s) => s.properties.title === SHEET_NAME)

  if (!hasEntriesSheet) {
    const batchUrl = `${BASE_URL}/${spreadsheetId}:batchUpdate`
    await fetch(batchUrl, {
      method: 'POST',
      headers: authHeaders(accessToken),
      body: JSON.stringify({ requests: [{ addSheet: { properties: { title: SHEET_NAME } } }] }),
    })

    const headerUrl = `${BASE_URL}/${spreadsheetId}/values/${SHEET_NAME}!A1:G1:append?valueInputOption=RAW`
    await fetch(headerUrl, {
      method: 'POST',
      headers: authHeaders(accessToken),
      body: JSON.stringify({ values: [HEADER] }),
    })
  }
}
