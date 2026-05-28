import { useState } from 'react'
import { SkillLevelSelect } from '@/components/layout/SkillLevelBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Save } from 'lucide-react'

export function SkillMemberForm({ member, categories, skills, levels, isAdmin, currentUserId, onSave }) {
  const canEdit = isAdmin || currentUserId === member.id
  const initial = {}
  skills.forEach((s) => {
    const key = `${member.id}-${s.id}`
    initial[s.id] = levels.get(key)?.level || 0
  })
  const [editedLevels, setEditedLevels] = useState(initial)

  const hasChanges = skills.some((s) => {
    const key = `${member.id}-${s.id}`
    return (editedLevels[s.id] || 0) !== (levels.get(key)?.level || 0)
  })

  function handleSave() {
    const changes = []
    skills.forEach((s) => {
      const key = `${member.id}-${s.id}`
      const current = levels.get(key)?.level || 0
      const edited = editedLevels[s.id] || 0
      if (edited !== current) {
        changes.push({ skillId: s.id, oldLevel: current || null, newLevel: edited })
      }
    })
    if (changes.length > 0) onSave(member.id, changes)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Modification des compétences de <span className="font-medium text-gray-700 dark:text-gray-200">{member.full_name || member.email}</span>
      </p>

      {categories.map((cat) => {
        const catSkills = skills.filter((s) => s.category_id === cat.id)
        if (catSkills.length === 0) return null
        return (
          <Card key={cat.id}>
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                {cat.name}
              </h3>
              {catSkills.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-1.5 border-b dark:border-gray-800 last:border-0">
                  <span className="text-sm">{s.name}</span>
                  {canEdit ? (
                    <SkillLevelSelect
                      value={editedLevels[s.id] || 1}
                      onChange={(v) => setEditedLevels((prev) => ({ ...prev, [s.id]: v }))}
                    />
                  ) : (
                    <span className="text-sm font-medium">
                      {levels.get(`${member.id}-${s.id}`)?.level || '—'}
                    </span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )
      })}

      {canEdit && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={!hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            Enregistrer
          </Button>
        </div>
      )}
    </div>
  )
}
