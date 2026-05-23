import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Entry } from '@/models/entry'

export default function EntryCard({ entry, onEdit }: { entry: Entry; onEdit?: () => void }) {
  const { type, title, categories, date, description } = entry

  return (
    <Card className="text-left">
      <CardContent>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-base font-medium leading-snug">{title}</p>
            {description && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">{description}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge
              variant={type === 'achievement' ? 'default' : 'destructive'}
              className="capitalize"
            >
              {type}
            </Badge>
            {onEdit && (
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onEdit}>
                Edit
              </Button>
            )}
          </div>
        </div>
        <div className="flex gap-2 text-xs text-muted-foreground mt-3">
          <span>{date}</span>
          {categories.map((cat) => (
            <Badge key={cat} variant="outline" className="text-xs px-1.5 py-0">{cat}</Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
