import { useMemo } from 'react'
import { useEntriesContext } from '@/context/EntriesContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const WINDOW_DAYS = 30

export default function EntrySummary() {
  const { state } = useEntriesContext()

  const { achievementCount, setbackCount } = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - WINDOW_DAYS)
    const cutoffStr = cutoff.toISOString().split('T')[0]
    let achievementCount = 0
    let setbackCount = 0
    for (const e of state.items) {
      if (e.date < cutoffStr) continue
      if (e.type === 'achievement') achievementCount++
      else setbackCount++
    }
    return { achievementCount, setbackCount }
  }, [state.items])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Last {WINDOW_DAYS} days
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="default">{achievementCount}</Badge>
            <span className="text-sm">Achievements</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="destructive">{setbackCount}</Badge>
            <span className="text-sm">Setbacks</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
