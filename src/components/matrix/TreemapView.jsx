import { useState } from 'react'
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts'
import { ChartCard, EmptyState } from './ChartCard'
import { Card, CardContent } from '@/components/ui/card'

export default function TreemapView({
  categories: allCategories, members, levels,
  filterMember, filterCat,
  filteredSkills, onCellClick,
}) {
  const [hoveredId, setHoveredId] = useState(null)

  const cats = allCategories
    .filter((cat) => filterCat === 'all' || cat.id === filterCat)
    .map((cat) => {
      const catSkills = filteredSkills.filter((s) => s.category_id === cat.id)
      return {
        name: cat.name,
        color: cat.color,
        children: catSkills.map((s) => {
          let total = 0
          let count = 0
          if (filterMember !== 'all') {
            const key = `${filterMember}-${s.id}`
            const lvl = levels[key]?.level
            if (lvl) { total += lvl; count++ }
          } else {
            members.forEach((m) => {
              const key = `${m.id}-${s.id}`
              const lvl = levels[key]?.level
              if (lvl) { total += lvl; count++ }
            })
          }
          const avg = count > 0 ? +(total / count).toFixed(1) : 0
          return {
            name: s.name,
            size: 1,
            avg,
            count,
            skillId: s.id,
            catId: cat.id,
          }
        }),
      }
    })
    .filter((cat) => cat.children.length > 0)

  const catColorMap = {}
  cats.forEach((c) => { catColorMap[c.name] = c.color })

  const flatData = cats
    .flatMap((cat) => cat.children)
    .sort((a, b) => {
      if (a.catId !== b.catId) return a.catId.localeCompare?.(b.catId) || 0
      return b.avg - a.avg
    })

  if (flatData.length === 0) {
    return (
      <ChartCard>
        <EmptyState />
      </ChartCard>
    )
  }

  function getColor(avg, catId) {
    const cat = allCategories.find((c) => c.id === catId)
    const base = cat?.color || '#9ca3af'
    if (avg >= 3.5) return base
    if (avg >= 2.5) return `${base}cc`
    if (avg >= 1.5) return `${base}88`
    return `${base}55`
  }

  function getTextColor(avg) {
    if (avg >= 3) return '#000'
    return '#fff'
  }

  return (
    <div className="space-y-4 animate-chart-slide">
      <ChartCard>
        <ResponsiveContainer width="100%" height={500}>
          <Treemap
            data={flatData}
            dataKey="size"
            aspectRatio={4 / 3}
            stroke="var(--background)"
            strokeWidth={1}
            fill="#8884d8"
            content={({ x, y, width, height, payload }) => {
              if (!payload) return null
              const isHovered = hoveredId === payload.skillId
              const catColor = allCategories.find((c) => c.id === payload.catId)?.color
              const showLabels = width > 50 && height > 35
              const scale = isHovered ? 1.03 : 1
              const cx = x + width / 2
              const cy = y + height / 2
              const nw = width * scale
              const nh = height * scale
              const nx = cx - nw / 2
              const ny = cy - nh / 2

              return (
                <g>
                  <rect
                    x={nx}
                    y={ny}
                    width={nw}
                    height={nh}
                    fill={getColor(payload.avg, payload.catId)}
                    stroke={catColor || 'var(--background)'}
                    strokeWidth={isHovered ? 3 : 2}
                    style={{
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease, stroke-width 0.15s ease',
                    }}
                    onClick={() => onCellClick?.(payload.catId, filterMember !== 'all' ? filterMember : undefined)}
                    rx={5}
                    onMouseEnter={() => setHoveredId(payload.skillId)}
                    onMouseLeave={() => setHoveredId(null)}
                  />
                  {showLabels && (
                    <>
                      <text
                        x={cx}
                        y={cy - 5}
                        textAnchor="middle"
                        fill={getTextColor(payload.avg)}
                        fontSize={12}
                        fontWeight={600}
                        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)', pointerEvents: 'none' }}
                      >
                        {payload.name}
                      </text>
                      <text
                        x={cx}
                        y={cy + 11}
                        textAnchor="middle"
                        fill={getTextColor(payload.avg)}
                        fontSize={11}
                        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)', pointerEvents: 'none' }}
                      >
                        {payload.avg}
                        {filterMember === 'all' && ` (${payload.count})`}
                      </text>
                    </>
                  )}
                </g>
              )
            }}
          >
            <Tooltip
              contentStyle={{
                background: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                fontSize: 13,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}
              formatter={(value, name, props) => {
                const p = props.payload
                if (!p) return []
                return [
                  filterMember === 'all'
                    ? `Moyenne : ${p.avg} — ${p.count} évalué(s)`
                    : `Niveau : ${p.avg}`,
                  p.name,
                ]
              }}
            />
          </Treemap>
        </ResponsiveContainer>
      </ChartCard>

      {flatData.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-widest">
              Détail des compétences
            </h3>
            <div className="space-y-0.5">
              {flatData.map((s) => (
                <div
                  key={s.skillId}
                  className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted cursor-pointer text-sm gap-4"
                  onClick={() => onCellClick?.(s.catId, filterMember !== 'all' ? filterMember : undefined)}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: allCategories.find((c) => c.id === s.catId)?.color }}
                    />
                    <span className="truncate">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(s.avg / 4) * 100}%`,
                          background: getColor(s.avg, s.catId),
                        }}
                      />
                    </div>
                    <span className="font-medium text-xs tabular-nums w-8 text-right">{s.avg}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
