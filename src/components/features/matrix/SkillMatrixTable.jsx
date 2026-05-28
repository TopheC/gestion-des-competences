import { useState } from 'react'
import { ChevronDown, ChevronRight, ListCollapse } from 'lucide-react'
import { SkillLevelBadge, SkillLevelSelect } from '@/components/layout/SkillLevelBadge'

export function SkillMatrixTable({ categories, skills, members, levels, isAdmin, currentUserId, editing, onEdit, onUpdate, onCancel }) {
  const [collapsed, setCollapsed] = useState(new Set())

  const grouped = categories
    .map((cat) => ({
      ...cat,
      catSkills: skills.filter((s) => s.category_id === cat.id),
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

  if (members.length === 0) {
    return (
      <div className="p-8 text-center text-gray-400">
        Aucun résultat
      </div>
    )
  }

  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left p-2 bg-gray-100 dark:bg-gray-800 border dark:border-gray-700 sticky left-0 z-10 min-w-[180px]">
                    <button
                      className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mr-2"
                      onClick={toggleAll}
                      title={allCollapsed ? 'Tout dérouler' : 'Tout replier'}
                    >
                      <ListCollapse className={`h-3.5 w-3.5 transition-transform ${allCollapsed ? '' : 'rotate-180'}`} />
                    </button>
                    Compétence
                  </th>
            {members.map((m) => (
              <th key={m.id} className="p-2 bg-gray-100 dark:bg-gray-800 border dark:border-gray-700 text-sm text-center min-w-[120px]">
                {m.full_name || m.email}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grouped.map((g) => {
            const isCollapsed = collapsed.has(g.id)
            return (
              <>
                <tr key={g.id} className="bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <td className="p-2 border dark:border-gray-700 font-semibold text-sm sticky left-0 bg-gray-50 dark:bg-gray-800/50 cursor-pointer" onClick={() => toggleCategory(g.id)}>
                    <span className="flex items-center gap-2">
                      {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />
                      {g.name}
                    </span>
                  </td>
                  {members.map((m) => {
                    const dotColors = ['bg-gray-200', 'bg-blue-200', 'bg-amber-200', 'bg-green-200']
                    const counts = [0, 0, 0, 0]
                    g.catSkills.forEach((s) => {
                      const lvl = levels[`${m.id}-${s.id}`]?.level
                      if (lvl) counts[lvl - 1]++
                    })
                    return (
                      <td key={m.id} className="p-2 border dark:border-gray-700 text-center bg-gray-50 dark:bg-gray-800/50">
                        <span className="inline-flex items-center gap-2 text-xs">
                          {counts.map((c, i) =>
                            c > 0 ? (
                              <span key={i} className="inline-flex items-center gap-0.5">
                                <span className={'inline-block w-2.5 h-2.5 rounded-full ' + dotColors[i]} />
                                <span className="font-semibold">{c}</span>
                              </span>
                            ) : null
                          )}
                        </span>
                      </td>
                    )
                  })}
                </tr>
                {!isCollapsed && g.catSkills.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="p-2 border dark:border-gray-700 font-medium sticky left-0 bg-white dark:bg-gray-950">
                      <span className="text-sm pl-6">{s.name}</span>
                    </td>
                    {members.map((m) => {
                      const key = `${m.id}-${s.id}`
                      const level = levels[key]
                      const canEditCell = isAdmin || currentUserId === m.id
                      const isEditing = editing === key
                      return (
                        <td key={m.id} className={`p-2 border dark:border-gray-700 text-center ${currentUserId === m.id ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}>
                          {isEditing && canEditCell ? (
                            <SkillLevelSelect
                              value={level?.level || 1}
                              onChange={(v) => onUpdate(m.id, s.id, v)}
                            />
                          ) : (
                            level ? (
                              <SkillLevelBadge
                                level={level.level}
                                onClick={() => canEditCell && onEdit(key)}
                              />
                            ) : (
                              <span
                                className="text-gray-300 dark:text-gray-600 text-sm cursor-pointer"
                                onClick={() => canEditCell && onEdit(key)}
                              >
                                —
                              </span>
                            )
                          )}
                          {isEditing && canEditCell && (
                            <button className="ml-1 text-xs text-red-500" onClick={onCancel}>✕</button>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
