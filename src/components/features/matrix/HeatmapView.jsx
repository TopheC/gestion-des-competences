import { useState } from 'react'
import { ChevronDown, ChevronRight, ListCollapse, Pencil } from 'lucide-react'
import { SkillLevelSelect, levelConfig } from '@/components/layout/SkillLevelBadge'

const heatColors = [
  'bg-[var(--level-1-bg)]',
  'bg-[var(--level-2-bg)]',
  'bg-[var(--level-3-bg)]',
  'bg-[var(--level-4-bg)]',
]

const levelDotColors = [
  'bg-[var(--level-1)]',
  'bg-[var(--level-2)]',
  'bg-[var(--level-3)]',
  'bg-[var(--level-4)]',
]

export function HeatmapView({
  categories, levels,
  isAdmin, currentUserId,
  editing, onEdit, onUpdate, onCancel,
  filteredSkills, visibleMembers,
}) {
  const [collapsed, setCollapsed] = useState(new Set())
  const [hoveredCell, setHoveredCell] = useState(null)

  const grouped = categories
    .map((cat) => ({
      ...cat,
      catSkills: filteredSkills.filter((s) => s.category_id === cat.id),
    }))
    .filter((g) => g.catSkills.length > 0)

  const allCollapsed = grouped.every((g) => collapsed.has(g.id))

  function toggleCategory(catId) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(catId)) next.delete(catId)
      else next.add(catId)
      return next
    })
  }

  function toggleAll() {
    if (allCollapsed) {
      setCollapsed(new Set())
    } else {
      setCollapsed(new Set(grouped.map((g) => g.id)))
    }
  }

  if (visibleMembers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <svg className="w-10 h-10 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-sm">Aucun résultat</p>
      </div>
    )
  }

  return (
    <div className="overflow-auto rounded-lg border">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left p-2 bg-muted/80 backdrop-blur-sm border-b sticky left-0 z-10 min-w-[180px] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)]">
              <button
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mr-2 transition-colors"
                onClick={toggleAll}
                title={allCollapsed ? 'Tout dérouler' : 'Tout replier'}
              >
                <ListCollapse className={`h-3.5 w-3.5 transition-transform duration-200 ${allCollapsed ? '' : 'rotate-180'}`} />
              </button>
              Compétence
            </th>
            {visibleMembers.map((m) => (
              <th
                key={m.id}
                className={`p-2 bg-muted/80 backdrop-blur-sm border-b text-sm text-center min-w-[120px] font-medium ${currentUserId === m.id ? 'text-primary' : ''}`}
              >
                {m.full_name || m.email}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grouped.map((g) => {
            const isCollapsed = collapsed.has(g.id)
            return (
              <tr key={g.id} className="bg-muted/30 hover:bg-muted/50 transition-colors">
                <td className="p-2 border-b font-semibold text-sm sticky left-0 bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => toggleCategory(g.id)}>
                  <span className="flex items-center gap-2">
                    <span className="text-muted-foreground transition-transform duration-200">
                      {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </span>
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
                    {g.name}
                  </span>
                </td>
                {visibleMembers.map((m) => {
                  const counts = [0, 0, 0, 0]
                  g.catSkills.forEach((s) => {
                    const lvl = levels[`${m.id}-${s.id}`]?.level
                    if (lvl) counts[lvl - 1]++
                  })
                  return (
                    <td key={m.id} className="p-2 border-b text-center bg-muted/30">
                      <span className="inline-flex items-center justify-center gap-1.5 text-xs">
                        {counts.map((c, i) =>
                          c > 0 ? (
                            <span key={i} className="inline-flex items-center gap-0.5" title={`${levelConfig[i + 1]?.label}: ${c}`}>
                              <span className={`inline-block w-2.5 h-2.5 rounded-full ${levelDotColors[i]}`} />
                              <span className="font-semibold tabular-nums">{c}</span>
                            </span>
                          ) : null
                        )}
                      </span>
                    </td>
                  )
                })}
              </tr>
            )
          })}
          {grouped.map((g) =>
            !collapsed.has(g.id) && g.catSkills.map((s) => (
              <tr key={s.id} className="hover:bg-muted/20 transition-colors group">
                <td className="p-2 border-b font-medium sticky left-0 bg-background hover:bg-muted/20 transition-colors">
                  <span className="text-sm pl-7">{s.name}</span>
                </td>
                {visibleMembers.map((m) => {
                  const key = `${m.id}-${s.id}`
                  const level = levels[key]
                  const lvl = level?.level || 0
                  const canEditCell = isAdmin || currentUserId === m.id
                  const isEditing = editing === key
                  const isHovered = hoveredCell === key
                  const isMyRow = currentUserId === m.id

                  return (
                    <td
                      key={m.id}
                      className={`p-1.5 border-b text-center relative transition-all duration-150 ${
                        lvl > 0 ? heatColors[lvl - 1] : 'bg-background'
                      } ${isMyRow ? 'ring-1 ring-primary/30 ring-inset' : ''}`}
                      onMouseEnter={() => setHoveredCell(key)}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      {isEditing && canEditCell ? (
                        <span className="inline-flex items-center gap-1">
                          <SkillLevelSelect
                            value={level?.level || 1}
                            onChange={(v) => onUpdate(m.id, s.id, v)}
                          />
                          <button className="text-xs text-destructive hover:text-destructive/80 font-medium" onClick={onCancel}>✕</button>
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center justify-center gap-1 text-sm font-medium cursor-pointer rounded px-1.5 py-0.5 transition-all duration-150 ${
                            isHovered && canEditCell ? 'scale-110 shadow-sm bg-background/80' : ''
                          }`}
                          onClick={() => canEditCell && onEdit(key)}
                        >
                          {lvl || '—'}
                          {canEditCell && (
                            <Pencil className={`h-3 w-3 text-muted-foreground transition-opacity duration-150 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
                          )}
                        </span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
