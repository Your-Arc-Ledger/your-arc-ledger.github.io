import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { readCategories, appendCategory } from '@/services/googleSheets'
import { loadSheetRef } from '@/lib/storage'

export function useCategories() {
  const [categories, setCategories] = useState<string[]>([])
  const { state: authState } = useAuth()

  useEffect(() => {
    if (authState.status !== 'authorised' || !authState.accessToken) return
    const spreadsheetId = loadSheetRef()?.id ?? null
    if (!spreadsheetId) return

    readCategories(spreadsheetId, authState.accessToken)
      .then(setCategories)
      .catch(() => undefined)
  }, [authState.status, authState.accessToken])

  const addCategory = useCallback(async (name: string) => {
    const accessToken = authState.accessToken
    const spreadsheetId = loadSheetRef()?.id ?? null
    if (!accessToken || !spreadsheetId) return

    setCategories((prev) => [...prev, name])
    try {
      await appendCategory(spreadsheetId, accessToken, name)
    } catch {
      setCategories((prev) => prev.filter((c) => c !== name))
    }
  }, [authState.accessToken])

  return { categories, addCategory }
}
