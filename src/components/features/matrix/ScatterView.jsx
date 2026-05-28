import { useMemo } from 'react'
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

const LEVELS = ['', 'Débutant', 'Intermédiaire', 'Avancé', 'Expert']

export default function ScatterView({
  members, levels, categories,
  filterMember,
  filteredSkills, onMemberSelect,
}) {
  const { points, xTicks, yTicks } = useMemo(() => {
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
          const lvl = levels.get(key)?.level
          if (!lvl) return
          data.push({
            x,
            y: lvl + hashJitter(m.id, s.id),
            memberName: m.full_name || m.email,
            skillName: s.name,
            level: lvl,
            category: cat.name,
            catId: cat.id,
            color: cat.color,
            memberId: m.id,
          })
        })
      })
    })

    const xTicks = categories
      .filter((cat) => catGaps[cat.id])
      .map((cat) => ({
        value: (catGaps[cat.id].start + catGaps[cat.id].end) / 2,
        label: cat.name,
      }))

    return { points: data, xTicks, yTicks: [1, 2, 3, 4] }
  }, [categories, filteredSkills, members, levels, filterMember])

  if (points.length === 0) {
    return (
      <ChartCard>
        <EmptyState />
      </ChartCard>
    )
  }

  const W = 900
  const H = 500
  const pad = { top: 16, right: 16, bottom: 56, left: 56 }
  const plotW = W - pad.left - pad.right
  const plotH = H - pad.top - pad.bottom
  const xMin = 0
  const xMax = points.reduce((m, p) => Math.max(m, p.x), 0) + 1
  const yMin = 0.5
  const yMax = 4.5

  function sx(v) { return pad.left + ((v - xMin) / (xMax - xMin)) * plotW }
  function sy(v) { return pad.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH }
  function sr(lvl) { return 3 + (lvl - 1) * 4.5 }

  return (
    <ChartCard>
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-4 flex-wrap text-xs text-muted-foreground">
          {categories.filter((c) => points.some((p) => p.catId === c.id)).map((c) => (
            <span key={c.id} className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
              {c.name}
            </span>
          ))}
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto rounded-lg" style={{ maxHeight: 500 }}>
        {/* Grid */}
        {yTicks.map((t) => (
          <line
            key={`grid-${t}`}
            x1={pad.left} x2={W - pad.right}
            y1={sy(t)} y2={sy(t)}
            stroke="var(--border)"
            strokeOpacity={0.4}
            strokeDasharray="3 3"
          />
        ))}

        {/* X axis */}
        <line x1={pad.left} x2={W - pad.right} y1={sy(0.5)} y2={sy(0.5)} stroke="var(--border)" />
        {xTicks.map((t) => (
          <text
            key={`xtick-${t.value}`}
            x={sx(t.value)}
            y={H - 8}
            textAnchor="middle"
            fill="var(--muted-foreground)"
            fontSize={11}
          >
            {t.label}
          </text>
        ))}

        {/* Y axis */}
        <line x1={pad.left} x2={pad.left} y1={pad.top} y2={H - pad.bottom} stroke="var(--border)" />
        {yTicks.map((t) => (
          <text
            key={`ytick-${t}`}
            x={pad.left - 8}
            y={sy(t) + 4}
            textAnchor="end"
            fill="var(--muted-foreground)"
            fontSize={11}
          >
            {LEVELS[t]}
          </text>
        ))}

        {/* Points */}
        {points.map((p, i) => (
          <circle
            key={`pt-${i}`}
            cx={sx(p.x)}
            cy={sy(p.y)}
            r={sr(p.level)}
            fill={p.color}
            stroke="var(--background)"
            strokeWidth={0.5}
            style={{ cursor: 'pointer' }}
            onClick={() => onMemberSelect?.(p.memberId)}
          >
            <title>{`${p.memberName} — ${p.skillName} : ${p.level} (${p.category})`}</title>
          </circle>
        ))}
      </svg>
      </div>
    </ChartCard>
  )
}
