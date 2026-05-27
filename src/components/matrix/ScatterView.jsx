import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { ChartCard, EmptyState } from './ChartCard'

function hashJitter(id1, id2) {
  let h = 0
  const s = `${id1}-${id2}`
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i)
    h |= 0
  }
  return ((h % 100) / 100 - 0.5) * 0.3
}

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
          y: lvl + hashJitter(m.id, s.id),
          memberName: m.full_name || m.email,
          skillName: s.name,
          level: lvl,
          category: cat.name,
          catId: cat.id,
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
    return (
      <ChartCard>
        <EmptyState />
      </ChartCard>
    )
  }

  return (
    <ChartCard>
      <ResponsiveContainer width="100%" height={500}>
        <ScatterChart margin={{ top: 16, right: 16, bottom: 56, left: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4} />
          <XAxis
            type="number"
            dataKey="x"
            domain={[0, 'dataMax']}
            ticks={ticks.map((t) => t.value)}
            tickFormatter={(v) => ticks.find((t) => t.value === v)?.label || ''}
            stroke="var(--foreground)"
            strokeOpacity={0.5}
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="number"
            domain={[0.5, 4.5]}
            ticks={[1, 2, 3, 4]}
            tickFormatter={(v) => ['', 'Débutant', 'Intermédiaire', 'Avancé', 'Expert'][v]}
            stroke="var(--foreground)"
            strokeOpacity={0.5}
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <ZAxis range={[48, 120]} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null
              const d = payload[0].payload
              return (
                <div className="bg-popover border rounded-xl p-3 shadow-lg text-sm space-y-1.5 min-w-[160px]">
                  <p className="font-semibold">{d.memberName}</p>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: d.categoryColor }} />
                    <span className="text-muted-foreground text-xs">{d.category}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{d.skillName}</p>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-muted">{d.level}</span>
                    <span className="text-xs text-muted-foreground">
                      {['', 'Débutant', 'Intermédiaire', 'Avancé', 'Expert'][d.level]}
                    </span>
                  </div>
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
            const catData = data.filter((d) => d.catId === cat.id)
            return (
              <Scatter
                key={cat.id}
                name={cat.name}
                data={catData}
                fill={cat.color}
                stroke={cat.color}
                strokeWidth={0.5}
                strokeOpacity={0.3}
                onClick={(point) => onMemberSelect?.(point.memberId)}
                style={{ cursor: 'pointer' }}
              />
            )
          })}
        </ScatterChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
