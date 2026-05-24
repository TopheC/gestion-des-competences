import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useCategories } from '@/hooks/useCategories'
import { useSkills } from '@/hooks/useSkills'
import { useMembers } from '@/hooks/useMembers'
import { useSkillLevels } from '@/hooks/useSkillLevels'
import { SkillMatrixFilters } from '@/components/matrix/SkillMatrixFilters'
import { SkillMatrixTable } from '@/components/matrix/SkillMatrixTable'
import { toast } from 'sonner'

export function SkillMatrix() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Matrice des compétences</h1>

      <SkillMatrixFilters
        categories={categories}
        members={members}
        filterCat={filterCat}
        filterMember={filterMember}
        filterMinLevel={filterMinLevel}
        onFilterChange={onFilterChange}
      />

      <SkillMatrixTable
        skills={filteredSkills}
        members={visibleMembers}
        levels={levels}
        isAdmin={isAdmin}
        editing={editing}
        onEdit={setEditing}
        onUpdate={handleUpdate}
        onCancel={() => setEditing(null)}
      />

      <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
        <span><span className="inline-block w-3 h-3 rounded-full bg-gray-200 mr-1" /> Débutant</span>
        <span><span className="inline-block w-3 h-3 rounded-full bg-blue-200 mr-1" /> Intermédiaire</span>
        <span><span className="inline-block w-3 h-3 rounded-full bg-amber-200 mr-1" /> Avancé</span>
        <span><span className="inline-block w-3 h-3 rounded-full bg-green-200 mr-1" /> Expert</span>
      </div>
    </div>
  )
}
