import { useState } from 'react'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { ChartCard, EmptyState } from './ChartCard'

export default function RadarView({
  categories, skills: allSkills, members, levels, filterMember,
}) {
  const [memberA, setMemberA] = useState(filterMember !== 'all' ? filterMember : (members[0]?.id || ''))
  const [memberB, setMemberB] = useState('')

  function getCategoryAvg(catId) {
    const catSkills = allSkills.filter((s) => s.category_id === catId)
    if (catSkills.length === 0) return 0
    let total = 0
    let count = 0
    members.forEach((m) => {
      catSkills.forEach((s) => {
        const key = `${m.id}-${s.id}`
const lvl = levels.get(key)?.level
        if (lvl) { total += lvl; count++ }
      })
    })
    return count > 0 ? +(total / count).toFixed(1) : 0
  }

  function getMemberAvg(catId, memberId) {
    if (!memberId) return null
    const catSkills = allSkills.filter((s) => s.category_id === catId)
    if (catSkills.length === 0) return 0
    let total = 0
    let count = 0
    catSkills.forEach((s) => {
      const key = `${memberId}-${s.id}`
      const lvl = levels.get(key)?.level
      if (lvl) { total += lvl; count++ }
    })
    return count > 0 ? +(total / count).toFixed(1) : 0
  }

  const data = categories.map((cat) => {
    const teamAvg = getCategoryAvg(cat.id)
    const avgA = memberA ? getMemberAvg(cat.id, memberA) : 0
    const avgB = memberB ? getMemberAvg(cat.id, memberB) : null
    return {
      category: cat.name,
      color: cat.color,
      teamAvg,
      memberA: avgA,
      memberB: avgB,
    }
  })

  const nameA = members.find((m) => m.id === memberA)?.full_name || members.find((m) => m.id === memberA)?.email || 'Membre A'
  const nameB = members.find((m) => m.id === memberB)?.full_name || members.find((m) => m.id === memberB)?.email || ''

  if (data.length === 0) {
    return (
      <ChartCard>
        <EmptyState />
      </ChartCard>
    )
  }

  const otherMembers = members.filter((m) => m.id !== memberA)

  return (
    <ChartCard>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Membre :</label>
          <select
            className="border rounded-md px-2 py-1 text-sm bg-background"
            value={memberA}
            onChange={(e) => { setMemberA(e.target.value); if (memberB === e.target.value) setMemberB('') }}
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.full_name || m.email}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Comparer avec :</label>
          <select
            className="border rounded-md px-2 py-1 text-sm bg-background"
            value={memberB}
            onChange={(e) => setMemberB(e.target.value)}
          >
            <option value="">— Aucun —</option>
            {otherMembers.map((m) => (
              <option key={m.id} value={m.id}>{m.full_name || m.email}</option>
            ))}
          </select>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={450}>
        <RadarChart data={data}>
          <PolarGrid stroke="var(--border)" strokeOpacity={0.5} />
          <PolarAngleAxis dataKey="category" stroke="var(--foreground)" strokeOpacity={0.6} tick={{ fontSize: 11 }} />
          <PolarRadiusAxis domain={[0, 4]} tickCount={5} stroke="var(--border)" strokeOpacity={0.3} tick={{ fontSize: 10 }} />
          <Tooltip
            contentStyle={{
              background: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontSize: 13,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
          />
          <Radar
            name="Moyenne équipe"
            dataKey="teamAvg"
            stroke="var(--muted-foreground)"
            fill="var(--muted-foreground)"
            fillOpacity={0.06}
            strokeDasharray="4 4"
            strokeWidth={1.5}
            isAnimationActive={false}
          />
          <Radar
            name={nameA}
            dataKey="memberA"
            stroke="var(--foreground)"
            fill="var(--foreground)"
            fillOpacity={0.1}
            strokeWidth={2}
          />
          {memberB && (
            <Radar
              name={nameB}
              dataKey="memberB"
              stroke="#6366f1"
              fill="#6366f1"
              fillOpacity={0.08}
              strokeWidth={2}
              strokeDasharray="6 3"
            />
          )}
          <Legend
            formatter={(value) => <span className="text-sm">{value}</span>}
          />
        </RadarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
