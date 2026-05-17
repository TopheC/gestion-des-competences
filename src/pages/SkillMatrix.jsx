import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SkillLevelBadge, SkillLevelSelect } from '@/components/SkillLevelBadge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export function SkillMatrix() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const [categories, setCategories] = useState([])
  const [skills, setSkills] = useState([])
  const [members, setMembers] = useState([])
  const [levels, setLevels] = useState({})
  const [filterCat, setFilterCat] = useState('all')
  const [filterMember, setFilterMember] = useState('all')
  const [filterMinLevel, setFilterMinLevel] = useState(0)
  const [editing, setEditing] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    const [catRes, skillRes, memberRes, levelRes] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('skills').select('*').order('name'),
      supabase.from('members').select('*').order('full_name'),
      supabase.from('skill_levels').select('*'),
    ])
    if (catRes.data) setCategories(catRes.data)
    if (skillRes.data) setSkills(skillRes.data)
    if (memberRes.data) setMembers(memberRes.data)
    if (levelRes.data) {
      const map = {}
      levelRes.data.forEach((l) => {
        map[`${l.member_id}-${l.skill_id}`] = l
      })
      setLevels(map)
    }
  }

  const filteredSkills = filterCat === 'all'
    ? skills
    : skills.filter((s) => s.category_id === filterCat)

  const filteredMembers = filterMember === 'all'
    ? members
    : members.filter((m) => m.id === filterMember)

  const filteredByLevel = filteredMembers.filter((m) => {
    if (filterMinLevel === 0) return true
    return filteredSkills.some((s) => {
      const key = `${m.id}-${s.id}`
      return (levels[key]?.level || 0) >= filterMinLevel
    })
  })

  async function updateLevel(memberId, skillId, newLevel) {
    const key = `${memberId}-${skillId}`
    const existing = levels[key]
    const oldLevel = existing?.level

    if (existing) {
      await supabase.from('skill_levels').update({ level: newLevel }).eq('id', existing.id)
    } else {
      await supabase.from('skill_levels').insert({ member_id: memberId, skill_id: skillId, level: newLevel })
    }

    // Historique
    if (oldLevel !== newLevel) {
      await supabase.from('skill_history').insert({
        member_id: memberId,
        skill_id: skillId,
        old_level: oldLevel || null,
        new_level: newLevel,
        changed_by: profile.id,
      })
    }

    load()
    setEditing(null)
    toast.success('Niveau mis à jour')
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Matrice des compétences</h1>

      <div className="flex gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Catégorie :</label>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
          >
            <option value="all">Toutes</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Membre :</label>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={filterMember}
            onChange={(e) => setFilterMember(e.target.value)}
          >
            <option value="all">Tous</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.full_name || m.email}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Niveau min. :</label>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={filterMinLevel}
            onChange={(e) => setFilterMinLevel(Number(e.target.value))}
          >
            <option value={0}>Aucun</option>
            {[1, 2, 3, 4].map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>

      <div className="overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left p-2 bg-gray-100 border sticky left-0 z-10 min-w-[180px]">Membre</th>
              {filteredSkills.map((s) => (
                <th key={s.id} className="p-2 bg-gray-100 border text-sm text-center min-w-[120px]">{s.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredByLevel.length === 0 && (
              <tr><td colSpan={filteredSkills.length + 1} className="p-8 text-center text-gray-400">Aucun résultat</td></tr>
            )}
            {filteredByLevel.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="p-2 border font-medium sticky left-0 bg-white">
                  <span className="text-sm">{m.full_name || m.email}</span>
                </td>
                {filteredSkills.map((s) => {
                  const key = `${m.id}-${s.id}`
                  const level = levels[key]
                  const isEditing = editing === key
                  return (
                    <td key={s.id} className="p-2 border text-center">
                      {isEditing && isAdmin ? (
                        <SkillLevelSelect
                          value={level?.level || 1}
                          onChange={(v) => updateLevel(m.id, s.id, v)}
                        />
                      ) : (
                        level ? (
                          <SkillLevelBadge
                            level={level.level}
                            onClick={() => isAdmin && setEditing(key)}
                          />
                        ) : (
                          <span
                            className="text-gray-300 text-sm cursor-pointer"
                            onClick={() => isAdmin && setEditing(key)}
                          >
                            —
                          </span>
                        )
                      )}
                      {isEditing && isAdmin && (
                        <button
                          className="ml-1 text-xs text-red-500"
                          onClick={() => setEditing(null)}
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

      <div className="flex gap-4 text-sm text-gray-500">
        <span><span className="inline-block w-3 h-3 rounded-full bg-gray-200 mr-1" /> Débutant</span>
        <span><span className="inline-block w-3 h-3 rounded-full bg-blue-200 mr-1" /> Intermédiaire</span>
        <span><span className="inline-block w-3 h-3 rounded-full bg-amber-200 mr-1" /> Avancé</span>
        <span><span className="inline-block w-3 h-3 rounded-full bg-green-200 mr-1" /> Expert</span>
      </div>
    </div>
  )
}
