import { useState } from 'react'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

export default function RadarView({
  categories, skills: allSkills, members, levels, filterMember,
}) {
  const [selectedMember, setSelectedMember] = useState(filterMember !== 'all' ? filterMember : (members[0]?.id || ''))

  function getCategoryAvg(catId) {
    const catSkills = allSkills.filter((s) => s.category_id === catId)
    if (catSkills.length === 0) return 0
    let total = 0
    let count = 0
    members.forEach((m) => {
      catSkills.forEach((s) => {
        const key = `${m.id}-${s.id}`
        const lvl = levels[key]?.level
        if (lvl) { total += lvl; count++ }
      })
    })
    return count > 0 ? +(total / count).toFixed(1) : 0
  }

  function getMemberAvg(catId, memberId) {
    const catSkills = allSkills.filter((s) => s.category_id === catId)
    if (catSkills.length === 0) return 0
    let total = 0
    let count = 0
    catSkills.forEach((s) => {
      const key = `${memberId}-${s.id}`
      const lvl = levels[key]?.level
      if (lvl) { total += lvl; count++ }
    })
    return count > 0 ? +(total / count).toFixed(1) : 0
  }

  const data = categories.map((cat) => {
    const teamAvg = getCategoryAvg(cat.id)
    const memberAvg = selectedMember ? getMemberAvg(cat.id, selectedMember) : 0
    return {
      category: cat.name,
      color: cat.color,
      teamAvg,
      memberAvg,
    }
  })

  const selectedMemberName = members.find((m) => m.id === selectedMember)?.full_name || 'Membre'

  if (data.length === 0) {
    return <div className="p-8 text-center text-gray-400">Aucune donnée à afficher</div>
  }

  return (
    <div className="bg-white dark:bg-gray-950 rounded-lg p-4">
      <div className="flex items-center gap-4 mb-4">
        <label className="text-sm text-gray-600 dark:text-gray-400">Membre :</label>
        <select
          className="border rounded px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-700"
          value={selectedMember}
          onChange={(e) => setSelectedMember(e.target.value)}
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.full_name || m.email}</option>
          ))}
        </select>
      </div>

      <ResponsiveContainer width="100%" height={450}>
        <RadarChart data={data}>
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis dataKey="category" stroke="var(--foreground)" tick={{ fontSize: 11 }} />
          <PolarRadiusAxis domain={[0, 4]} tickCount={5} stroke="var(--border)" tick={{ fontSize: 10 }} />
          <Tooltip
            contentStyle={{
              background: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontSize: 13,
            }}
          />
          <Radar
            name="Moyenne équipe"
            dataKey="teamAvg"
            stroke="var(--muted-foreground)"
            fill="var(--muted-foreground)"
            fillOpacity={0.1}
            strokeDasharray="4 4"
          />
          <Radar
            name={selectedMemberName}
            dataKey="memberAvg"
            stroke="var(--foreground)"
            fill="var(--foreground)"
            fillOpacity={0.15}
          />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
