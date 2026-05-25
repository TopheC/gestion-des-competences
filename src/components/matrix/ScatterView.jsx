import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

export default function ScatterView({
  members, levels, categories,
  filterMember,
  filteredSkills, onMemberSelect,
}) {
  const data = []
  const catGaps = {}
  let xPos = 0

  categories.forEach((cat) => {
    const catSkills = filteredSkills.filter((s) => s.category_id === cat.id)
    if (catSkills.length === 0) return
    xPos += 1
    catGaps[cat.id] = { start: xPos, end: xPos + catSkills.length - 1 }
    catSkills.forEach((s) => {
      const x = xPos++
      members.forEach((m) => {
        if (filterMember !== 'all' && m.id !== filterMember) return
        const key = `${m.id}-${s.id}`
        const lvl = levels[key]?.level
        if (!lvl) return
        data.push({
          x,
          y: lvl + (Math.random() - 0.5) * 0.3,
          memberName: m.full_name || m.email,
          skillName: s.name,
          level: lvl,
          category: cat.name,
          categoryColor: cat.color,
          memberId: m.id,
        })
      })
    })
  })

  const ticks = categories
    .filter((cat) => catGaps[cat.id])
    .map((cat) => ({
      value: (catGaps[cat.id].start + catGaps[cat.id].end) / 2,
      label: cat.name,
    }))

  if (data.length === 0) {
    return <div className="p-8 text-center text-gray-400">Aucune donnée à afficher</div>
  }

  return (
    <div className="bg-white dark:bg-gray-950 rounded-lg p-4">
      <ResponsiveContainer width="100%" height={500}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            type="number"
            dataKey="x"
            domain={[0, 'dataMax']}
            ticks={ticks.map((t) => t.value)}
            tickFormatter={(v) => ticks.find((t) => t.value === v)?.label || ''}
            stroke="var(--foreground)"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            type="number"
            domain={[0.5, 4.5]}
            ticks={[1, 2, 3, 4]}
            tickFormatter={(v) => ['', '1 - Débutant', '2 - Intermédiaire', '3 - Avancé', '4 - Expert'][v]}
            stroke="var(--foreground)"
            tick={{ fontSize: 12 }}
          />
          <ZAxis range={[60, 60]} />
          <Tooltip
            contentStyle={{
              background: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontSize: 13,
            }}
            formatter={(val, name) => {
              if (name === 'y') return null
              return [val, name]
            }}
            labelFormatter={() => ''}
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null
              const d = payload[0].payload
              return (
                <div className="bg-white dark:bg-gray-800 border rounded-lg p-3 shadow-lg text-sm space-y-1">
                  <p className="font-medium">{d.memberName}</p>
                  <p>{d.skillName}</p>
                  <p>Niveau : <strong>{d.level}</strong></p>
                  <p className="text-xs" style={{ color: d.categoryColor }}>{d.category}</p>
                </div>
              )
            }}
          />
          <Legend
            payload={categories.map((c) => ({
              id: c.id,
              value: c.name,
              type: 'circle',
              color: c.color,
            }))}
          />
          {categories.map((cat) => {
            const catData = data.filter((d) => d.category === cat.name)
            return (
              <Scatter
                key={cat.id}
                name={cat.name}
                data={catData}
                fill={cat.color}
                stroke="none"
                onClick={(point) => onMemberSelect?.(point.memberId)}
                style={{ cursor: 'pointer' }}
              />
            )
          })}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
