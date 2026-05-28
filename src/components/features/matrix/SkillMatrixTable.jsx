import { useState, Fragment } from 'react'
import { ChevronDown, ChevronRight, ListCollapse } from 'lucide-react'
import { SkillLevelBadge, SkillLevelSelect } from '@/components/layout/SkillLevelBadge'
import { ChartCard, EmptyState } from './ChartCard'

export function SkillMatrixTable({ categories, skills, members, levels, isAdmin, currentUserId, editing, onEdit, onUpdate, onCancel }) {
  const grouped = categories
    .map((cat) => ({
      ...cat,
      catSkills: skills.filter((s) => s.category_id === cat.id),
    }))
    .filter((g) => g.catSkills.length > 0)

  const [expanded, setExpanded] = useState(new Set())

  const allExpanded = grouped.length > 0 && grouped.every((g) => expanded.has(g.id))

  function toggleCategory(catId) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(catId)) next.delete(catId)
      else next.add(catId)
      return next
    })
  }

  function toggleAll() {
    if (allExpanded) {
      setExpanded(new Set())
    } else {
      setExpanded(new Set(grouped.map((g) => g.id)))
    }
  }

  if (members.length === 0) {
    return (
      <ChartCard>
        <EmptyState message="Aucun résultat" />
      </ChartCard>
    )
  }

  return (
    <ChartCard>
      <div className="overflow-auto -m-5">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left p-2 bg-muted/80 backdrop-blur-sm border-b sticky left-0 z-10 min-w-[180px] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)]">
                <button
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mr-2 transition-colors"
                  onClick={toggleAll}
                  title={allExpanded ? 'Tout replier' : 'Tout dérouler'}
                >
                  <ListCollapse className={`h-3.5 w-3.5 transition-transform duration-200 ${allExpanded ? 'rotate-180' : ''}`} />
                </button>
                Compétence
              </th>
              {members.map((m) => (
                <th
                  key={m.id}
                  className="p-2 bg-muted/80 backdrop-blur-sm border-b text-sm text-center min-w-[120px] font-medium text-muted-foreground"
                >
                  {m.full_name || m.email}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grouped.map((g) => {
              const isExpanded = expanded.has(g.id)
              return (
                <Fragment key={g.id}>
                  <tr>
                    <td className="p-2 border-b font-semibold text-sm sticky left-0 bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)]" onClick={() => toggleCategory(g.id)}>
                      <span className="flex items-center gap-2">
                        <span className="text-muted-foreground transition-transform duration-200">
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </span>
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
                        {g.name}
                      </span>
                    </td>
                    {members.map((m) => {
                      const dotColors = ['bg-[var(--level-1)]', 'bg-[var(--level-2)]', 'bg-[var(--level-3)]', 'bg-[var(--level-4)]']
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
                                <span key={i} className="inline-flex items-center gap-0.5">
                                  <span className={`inline-block w-2.5 h-2.5 rounded-full ${dotColors[i]}`} />
                                  <span className="font-semibold tabular-nums">{c}</span>
                                </span>
                              ) : null
                            )}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                  {isExpanded && g.catSkills.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/20 transition-colors group">
                      <td className="p-2 border-b font-medium sticky left-0 bg-background hover:bg-muted/20 transition-colors shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)]">
                        <span className="text-sm pl-7">{s.name}</span>
                      </td>
                      {members.map((m) => {
                        const key = `${m.id}-${s.id}`
                        const level = levels[key]
                        const canEditCell = isAdmin || currentUserId === m.id
                        const isEditing = editing === key
                        return (
                          <td
                            key={m.id}
                            className="p-1.5 border-b text-center bg-background"
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
                              level ? (
                                <SkillLevelBadge
                                  level={level.level}
                                  onClick={() => canEditCell && onEdit(key)}
                                />
                              ) : (
                                <span
                                  className="text-muted-foreground/30 text-sm cursor-pointer"
                                  onClick={() => canEditCell && onEdit(key)}
                                >
                                  —
                                </span>
                              )
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </ChartCard>
  )
}