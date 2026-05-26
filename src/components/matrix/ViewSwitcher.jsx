import { Button } from '@/components/ui/button'
import {
  Table2, Palette, ScatterChart, Share2, Grid3x3, Radar, BarChart3,
} from 'lucide-react'

const views = [
  { id: 'table',  icon: Table2,  label: 'Tableau' },
  { id: 'heat',   icon: Palette, label: 'Matrice thermique' },
  { id: 'scatter', icon: ScatterChart, label: 'Nuage de points' },
  { id: 'graph',  icon: Share2,  label: 'Graphe' },
  { id: 'treemap', icon: Grid3x3, label: 'Treemap' },
  { id: 'radar',  icon: Radar,   label: 'Radar' },
  { id: 'bars',   icon: BarChart3, label: 'Barres' },
]

export function ViewSwitcher({ active, onChange }) {
  return (
    <div className="flex gap-1" role="group" aria-label="Mode d'affichage">
      {views.map((v) => {
        const Icon = v.icon
        const isActive = active === v.id
        return (
          <Button
            key={v.id}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onChange(v.id)}
            title={v.label}
          >
            <Icon className="h-4 w-4" />
          </Button>
        )
      })}
    </div>
  )
}
