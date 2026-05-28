import { Button } from '@/components/ui/button'
import {
  Table2, ScatterChart, Grid3x3, Radar, BarChart3,
} from 'lucide-react'

const groups = [
  {
    label: 'Tableau',
    views: [
      { id: 'table', icon: Table2, label: 'Tableau' },
    ],
  },
  {
    label: 'Graphiques',
    views: [
      { id: 'scatter', icon: ScatterChart, label: 'Nuage de points' },
      { id: 'treemap', icon: Grid3x3, label: 'Treemap' },
      { id: 'radar', icon: Radar, label: 'Radar' },
      { id: 'bars', icon: BarChart3, label: 'Barres' },
    ],
  },
]

export function ViewSwitcher({ active, onChange }) {
  return (
    <div className="flex items-center gap-1.5" role="group" aria-label="Mode d'affichage">
      {groups.map((group, gi) => (
        <div key={gi} className="flex items-center gap-1">
          {gi > 0 && (
            <div className="w-px h-6 bg-border mx-0.5" />
          )}
          {group.views.map((v) => {
            const Icon = v.icon
            const isActive = active === v.id
            return (
              <Button
                key={v.id}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                className="h-8 w-8 p-0 relative"
                onClick={() => onChange(v.id)}
                title={v.label}
              >
                <Icon className={`h-4 w-4 transition-transform duration-150 ${isActive ? 'scale-110' : ''}`} />
              </Button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
