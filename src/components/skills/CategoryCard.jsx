import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export function CategoryCard({ category, skills, onEdit, onDelete }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
          {category.name}
          <Badge variant="secondary" className="ml-2">{skills.length}</Badge>
        </CardTitle>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => onEdit(category)}>
            ✎
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(category.id)}>
            🗑
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {skills.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">Aucune compétence dans cette catégorie</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <Badge key={s.id} variant="outline" className="pr-1">
                {s.name}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
