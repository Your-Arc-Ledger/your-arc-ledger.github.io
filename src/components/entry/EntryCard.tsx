import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Entry } from '@/models/entry'

export default function EntryCard({ entry }: { entry: Entry }) {
  const { type, title, category, date, description } = entry

  return (
    <Card className="text-left">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{title}</CardTitle>
          <Badge
            variant={type === 'achievement' ? 'default' : 'destructive'}
            className="shrink-0 capitalize"
          >
            {type}
          </Badge>
        </div>
        <div className="flex gap-2 text-xs text-muted-foreground">
          <span>{date}</span>
          {category && <span>· {category}</span>}
        </div>
      </CardHeader>
      {description && (
        <CardContent>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{description}</p>
        </CardContent>
      )}
    </Card>
  )
}
