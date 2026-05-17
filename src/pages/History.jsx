import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SkillLevelBadge } from '@/components/SkillLevelBadge'
import { Input } from '@/components/ui/input'

export function History() {
  const [history, setHistory] = useState([])
  const [members, setMembers] = useState([])
  const [skills, setSkills] = useState([])
  const [filterMember, setFilterMember] = useState('all')
  const [filterSkill, setFilterSkill] = useState('all')

  useEffect(() => {
    async function load() {
      const [memRes, skillRes] = await Promise.all([
        supabase.from('members').select('*').order('full_name'),
        supabase.from('skills').select('*').order('name'),
      ])
      if (memRes.data) setMembers(memRes.data)
      if (skillRes.data) setSkills(skillRes.data)
    }
    load()
  }, [])

  useEffect(() => {
    async function loadHistory() {
      let query = supabase
        .from('skill_history')
        .select('*, member:member_id(full_name), skill:skill_id(name), changer:changed_by(full_name)')
        .order('created_at', { ascending: false })
        .limit(100)

      if (filterMember !== 'all') query = query.eq('member_id', filterMember)
      if (filterSkill !== 'all') query = query.eq('skill_id', filterSkill)

      const { data } = await query
      if (data) setHistory(data)
    }
    loadHistory()
  }, [filterMember, filterSkill])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Historique des évolutions</h1>

      <div className="flex gap-4">
        <select
          className="border rounded px-2 py-1 text-sm"
          value={filterMember}
          onChange={(e) => setFilterMember(e.target.value)}
        >
          <option value="all">Tous les membres</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.full_name || m.email}</option>
          ))}
        </select>
        <select
          className="border rounded px-2 py-1 text-sm"
          value={filterSkill}
          onChange={(e) => setFilterSkill(e.target.value)}
        >
          <option value="all">Toutes les compétences</option>
          {skills.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          {history.length === 0 ? (
            <p className="p-6 text-gray-400">Aucun historique</p>
          ) : (
            <ul className="divide-y">
              {history.map((h) => (
                <li key={h.id} className="p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">{h.member?.full_name}</span>
                      {' → '}<span className="font-medium">{h.skill?.name}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      Par {h.changer?.full_name} — {new Date(h.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {h.old_level && <SkillLevelBadge level={h.old_level} />}
                    {h.old_level && <span className="text-gray-400">→</span>}
                    <SkillLevelBadge level={h.new_level} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
