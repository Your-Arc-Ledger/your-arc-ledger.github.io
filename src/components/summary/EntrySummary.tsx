import { useEntriesContext } from '@/context/EntriesContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const WINDOW_DAYS = 30

export default function EntrySummary() {
  const { state } = useEntriesContext()

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - WINDOW_DAYS)
  const cutoffStr = cutoff.toISOString().split('T')[0]

  const recent = state.items.filter((e) => e.date >= cutoffStr)
  const achievementCount = recent.filter((e) => e.type === 'achievement').length
  const setbackCount = recent.filter((e) => e.type === 'setback').length

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
