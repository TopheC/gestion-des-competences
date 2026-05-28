import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SkillLevelBadge } from '@/components/layout/SkillLevelBadge'

export function Dashboard() {
  const [stats, setStats] = useState({ members: 0, skills: 0, categories: 0 })
  const [recentChanges, setRecentChanges] = useState([])
  const [topSkills, setTopSkills] = useState([])

  useEffect(() => {
    async function load() {
      const [members, skills, categories, history] = await Promise.all([
        supabase.from('members').select('*', { count: 'exact', head: true }),
        supabase.from('skills').select('*', { count: 'exact', head: true }),
        supabase.from('categories').select('*', { count: 'exact', head: true }),
        supabase.from('skill_history').select(`
          *,
          member:member_id(full_name),
          skill:skill_id(name),
          changer:changed_by(full_name)
        `).order('created_at', { ascending: false }).limit(10),
      ])
      setStats({
        members: members.count || 0,
        skills: skills.count || 0,
        categories: categories.count || 0,
      })
      setRecentChanges(history.data || [])

      const { data: levels } = await supabase
        .from('skill_levels')
        .select('skill_id, level, skill:skill_id(name)')
      if (levels) {
        const avgMap = {}
        levels.forEach((l) => {
          if (!avgMap[l.skill_id]) avgMap[l.skill_id] = { name: l.skill.name, total: 0, count: 0 }
          avgMap[l.skill_id].total += l.level
          avgMap[l.skill_id].count += 1
        })
        const sorted = Object.values(avgMap)
          .map((s) => ({ ...s, avg: (s.total / s.count).toFixed(1) }))
          .sort((a, b) => b.avg - a.avg)
          .slice(0, 5)
        setTopSkills(sorted)
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tableau de bord</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-lg">Membres</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{stats.members}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">Compétences</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{stats.skills}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">Catégories</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{stats.categories}</p></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Compétences les mieux notées</CardTitle></CardHeader>
          <CardContent>
            {topSkills.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">Aucune évaluation pour le moment</p>
            ) : (
              <ul className="space-y-2">
                {topSkills.map((s) => (
                  <li key={s.name} className="flex items-center justify-between">
                    <span>{s.name}</span>
                    <Badge>{s.avg}/4</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Dernières évolutions</CardTitle></CardHeader>
          <CardContent className="max-h-80 overflow-auto">
            {recentChanges.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">Aucun changement récent</p>
            ) : (
              <ul className="space-y-3">
                {recentChanges.map((c) => (
                  <li key={c.id} className="text-sm border-b dark:border-gray-800 pb-2 last:border-0">
                    <span className="font-medium">{c.member?.full_name}</span>
                    {' '}a mis à jour{' '}
                    <span className="font-medium">{c.skill?.name}</span>
                    {' '}de <SkillLevelBadge level={c.old_level || 1} /> → <SkillLevelBadge level={c.new_level} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
