import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { ChartCard, EmptyState } from './ChartCard'

const levelColors = {
  1: { label: 'Débutant', color: 'var(--level-1)' },
  2: { label: 'Intermédiaire', color: 'var(--level-2)' },
  3: { label: 'Avancé', color: 'var(--level-3)' },
  4: { label: 'Expert', color: 'var(--level-4)' },
}

export default function BarChartView({
  categories, skills: allSkills, members, levels, filterCat,
  onBarClick,
}) {
  const cats = filterCat === 'all' ? categories : categories.filter((c) => c.id === filterCat)

  const data = cats.map((cat) => {
    const catSkills = allSkills.filter((s) => s.category_id === cat.id)
    const buckets = { 1: 0, 2: 0, 3: 0, 4: 0 }
    members.forEach((m) => {
      catSkills.forEach((s) => {
        const key = `${m.id}-${s.id}`
        const lvl = levels[key]?.level
        if (lvl) buckets[lvl]++
      })
    })
    const total = Object.values(buckets).reduce((a, b) => a + b, 0)
    return {
      name: cat.name,
      color: cat.color,
      id: cat.id,
      ...buckets,
      total,
    }
  })

  if (data.length === 0) {
    return (
      <ChartCard>
        <EmptyState />
      </ChartCard>
    )
  }

  function handleClick(entry, _index, level) {
    if (onBarClick && entry?.id) {
      onBarClick(entry.id, level)
    }
  }

  return (
    <ChartCard>
      <ResponsiveContainer width="100%" height={Math.max(300, data.length * 60)}>
        <BarChart data={data} layout="vertical" margin={{ top: 12, right: 40, left: 100, bottom: 5 }} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.3} horizontal={false} />
          <XAxis type="number" stroke="var(--foreground)" strokeOpacity={0.4} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" stroke="var(--foreground)" strokeOpacity={0.4} tick={{ fontSize: 12 }} width={90} axisLine={false} tickLine={false} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              const entry = payload[0]?.payload
              if (!entry) return null
              const total = entry.total || 0
              return (
                <div className="bg-popover border rounded-xl p-3 shadow-lg text-sm min-w-[160px] space-y-1.5">
                  <p className="font-semibold">{label}</p>
                  {[1, 2, 3, 4].map((l) => {
                    const val = entry[l]
                    if (!val) return null
                    const pct = total > 0 ? Math.round((val / total) * 100) : 0
                    return (
                      <div key={l} className="flex items-center justify-between gap-3 text-xs">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-sm" style={{ background: levelColors[l].color }} />
                          {levelColors[l].label}
                        </span>
                        <span className="font-medium tabular-nums">{val} <span className="text-muted-foreground">({pct}%)</span></span>
                      </div>
                    )
                  })}
                  <div className="border-t pt-1.5 mt-1 flex justify-between text-xs font-medium">
                    <span>Total</span>
                    <span className="tabular-nums">{total}</span>
                  </div>
                </div>
              )
            }}
          />
          <Legend
            payload={[1, 2, 3, 4].map((l) => ({
              value: `${l} - ${levelColors[l].label}`,
              type: 'rect',
              color: levelColors[l].color,
            }))}
          />
          {[1, 2, 3, 4].map((lvl) => (
            <Bar
              key={lvl}
              dataKey={lvl}
              stackId="a"
              fill={levelColors[lvl].color}
              name={levelColors[lvl].label}
              cursor="pointer"
              radius={[3, 3, 0, 0]}
              maxBarSize={24}
              onClick={(entry) => handleClick(entry, null, lvl)}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
