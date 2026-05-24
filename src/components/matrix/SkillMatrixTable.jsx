import { SkillLevelBadge, SkillLevelSelect } from '@/components/SkillLevelBadge'

export function SkillMatrixTable({ skills, members, levels, isAdmin, editing, onEdit, onUpdate, onCancel }) {
  const visibleMembers = skills.length === 0 ? [] : members

  if (visibleMembers.length === 0) {
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
            <th className="text-left p-2 bg-gray-100 dark:bg-gray-800 border dark:border-gray-700 sticky left-0 z-10 min-w-[180px]">Membre</th>
            {skills.map((s) => (
              <th key={s.id} className="p-2 bg-gray-100 dark:bg-gray-800 border dark:border-gray-700 text-sm text-center min-w-[120px]">{s.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleMembers.map((m) => (
            <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="p-2 border dark:border-gray-700 font-medium sticky left-0 bg-white dark:bg-gray-950">
                <span className="text-sm">{m.full_name || m.email}</span>
              </td>
              {skills.map((s) => {
                const key = `${m.id}-${s.id}`
                const level = levels[key]
                const isEditing = editing === key
                return (
                  <td key={s.id} className="p-2 border dark:border-gray-700 text-center">
                    {isEditing && isAdmin ? (
                      <SkillLevelSelect
                        value={level?.level || 1}
                        onChange={(v) => onUpdate(m.id, s.id, v)}
                      />
                    ) : (
                      level ? (
                        <SkillLevelBadge
                          level={level.level}
                          onClick={() => isAdmin && onEdit(key)}
                        />
                      ) : (
                        <span
                          className="text-gray-300 dark:text-gray-600 text-sm cursor-pointer"
                          onClick={() => isAdmin && onEdit(key)}
                        >
                          —
                        </span>
                      )
                    )}
                    {isEditing && isAdmin && (
                      <button
                        className="ml-1 text-xs text-red-500"
                        onClick={onCancel}
                      >
                        ✕
                      </button>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
