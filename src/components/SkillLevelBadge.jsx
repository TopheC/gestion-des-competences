/* eslint-disable react-refresh/only-export-components */
import { Badge } from '@/components/ui/badge'

const levelConfig = {
  1: { label: 'Débutant', class: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
  2: { label: 'Intermédiaire', class: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
  3: { label: 'Avancé', class: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
  4: { label: 'Expert', class: 'bg-green-100 text-green-700 hover:bg-green-200' },
}

export function SkillLevelBadge({ level, onClick, className }) {
  const config = levelConfig[level] || levelConfig[1]
  return (
    <Badge
      className={`cursor-pointer ${config.class} ${className || ''}`}
      onClick={onClick}
    >
      {level} - {config.label}
    </Badge>
  )
}

export function SkillLevelSelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="border rounded px-2 py-1 text-sm"
    >
      {[1, 2, 3, 4].map((l) => (
        <option key={l} value={l}>{l} - {levelConfig[l].label}</option>
      ))}
    </select>
  )
}

export { levelConfig }
