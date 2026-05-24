import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useCategories } from '@/hooks/useCategories'
import { useSkills } from '@/hooks/useSkills'
import { useMembers } from '@/hooks/useMembers'
import { useSkillLevels } from '@/hooks/useSkillLevels'
import { SkillMatrixFilters } from '@/components/matrix/SkillMatrixFilters'
import { SkillMatrixTable } from '@/components/matrix/SkillMatrixTable'
import { SkillMemberForm } from '@/components/matrix/SkillMemberForm'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function SkillMatrix() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const currentUserId = profile?.id
  const { categories } = useCategories()
  const { skills } = useSkills()
  const { members } = useMembers()
  const { levels, updateLevel } = useSkillLevels()

  const [filterCat, setFilterCat] = useState('all')
  const [filterMember, setFilterMember] = useState('all')
  const [filterMinLevel, setFilterMinLevel] = useState(0)
  const [editing, setEditing] = useState(null)

  function onFilterChange(key, value) {
    if (key === 'cat') setFilterCat(value)
    if (key === 'member') setFilterMember(value)
    if (key === 'minLevel') setFilterMinLevel(value)
  }

  const filteredSkills = filterCat === 'all'
    ? skills
    : skills.filter((s) => s.category_id === filterCat)

  const filteredMembers = filterMember === 'all'
    ? members
    : members.filter((m) => m.id === filterMember)

  const visibleMembers = filterMinLevel === 0
    ? filteredMembers
    : filteredMembers.filter((m) =>
        filteredSkills.some((s) => {
          const key = `${m.id}-${s.id}`
          return (levels[key]?.level || 0) >= filterMinLevel
        })
      )

  async function handleUpdate(memberId, skillId, newLevel) {
    await updateLevel(memberId, skillId, newLevel, profile.id)
    setEditing(null)
    toast.success('Niveau mis à jour')
  }

  function exportCSV() {
    const header = ['Compétence', ...visibleMembers.map((m) => m.full_name || m.email)].join(',')
    const rows = filteredSkills.map((s) => {
      const levelsRow = visibleMembers.map((m) => {
        const key = `${m.id}-${s.id}`
        return levels[key]?.level || ''
      })
      return [`"${s.name}"`, ...levelsRow].join(',')
    })
    const blob = new Blob(['\uFEFF' + header + '\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'matrice-competences.csv'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Fichier CSV téléchargé')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Matrice des compétences</h1>
        <Button variant="outline" onClick={exportCSV}>
          <Download className="h-4 w-4 mr-2" />
          CSV
        </Button>
      </div>

      <SkillMatrixFilters
        categories={categories}
        members={members}
        filterCat={filterCat}
        filterMember={filterMember}
        filterMinLevel={filterMinLevel}
        onFilterChange={onFilterChange}
      />

      <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
        <span><span className="inline-block w-3 h-3 rounded-full bg-gray-200 mr-1" /> Débutant</span>
        <span><span className="inline-block w-3 h-3 rounded-full bg-blue-200 mr-1" /> Intermédiaire</span>
        <span><span className="inline-block w-3 h-3 rounded-full bg-amber-200 mr-1" /> Avancé</span>
        <span><span className="inline-block w-3 h-3 rounded-full bg-green-200 mr-1" /> Expert</span>
      </div>

      {filterMember !== 'all' && visibleMembers.length === 1 ? (
        <SkillMemberForm
          member={visibleMembers[0]}
          categories={categories}
          skills={filteredSkills}
          levels={levels}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
          onSave={(memberId, changes) => {
            Promise.all(changes.map((c) => updateLevel(memberId, c.skillId, c.newLevel, profile.id)))
              .then(() => toast.success('Compétences mises à jour'))
              .catch(() => toast.error('Erreur lors de la mise à jour'))
          }}
        />
      ) : (
        <SkillMatrixTable
          categories={categories}
          skills={filteredSkills}
          members={visibleMembers}
          levels={levels}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
          editing={editing}
          onEdit={setEditing}
          onUpdate={handleUpdate}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  )
}
