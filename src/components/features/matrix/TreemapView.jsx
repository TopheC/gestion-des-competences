import { useMemo, useState } from 'react'
import { ChevronRight, ChevronDown, ListCollapse } from 'lucide-react'
import { ChartCard, EmptyState } from './ChartCard'
import { Card, CardContent } from '@/components/ui/card'

function getColor(avg, base) {
  if (avg >= 3.5) return base
  if (avg >= 2.5) return `${base}cc`
  if (avg >= 1.5) return `${base}88`
  return `${base}55`
}

export default function TreemapView({
  categories: allCategories, members, levels,
  filterMember, filterCat,
  filteredSkills, onCellClick,
}) {
  const { cats, items } = useMemo(() => {
    const cats = allCategories
      .filter((cat) => filterCat === 'all' || cat.id === filterCat)
      .map((cat) => {
        const catSkills = filteredSkills.filter((s) => s.category_id === cat.id)
        const children = catSkills.map((s) => {
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
          return { name: s.name, avg, count, skillId: s.id, catId: cat.id, color: cat.color }
        })
        return { ...cat, children }
      })
      .filter((cat) => cat.children.length > 0)

    const items = cats
      .flatMap((cat) => cat.children)
      .sort((a, b) => {
        if (a.catId !== b.catId) return a.catId.localeCompare?.(b.catId) || 0
        return b.avg - a.avg
      })

    return { cats, items }
  }, [allCategories, filterCat, filteredSkills, members, levels, filterMember])

  const [collapsed, setCollapsed] = useState(new Set())

  function toggleCat(catId) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(catId)) next.delete(catId)
      else next.add(catId)
      return next
    })
  }

  const allCollapsed = cats.length > 0 && cats.every((c) => collapsed.has(c.id))

  function toggleAll() {
    if (allCollapsed) {
      setCollapsed(new Set())
    } else {
      setCollapsed(new Set(cats.map((c) => c.id)))
    }
  }
  const W = 900
  const H = 500

  const squares = useMemo(() => {
    if (items.length === 0) return []

    const sorted = [...items].sort((a, b) => b.avg - a.avg)
    const nRows = Math.max(Math.ceil(Math.sqrt(sorted.length)), 1)

    const rows = []
    for (let i = 0; i < nRows; i++) {
      rows.push({ items: [], sum: 0 })
    }
    sorted.forEach((item) => {
      const v = Math.max(item.avg, 0.01)
      let best = 0
      let bestScore = rows[0].sum + v
      for (let r = 1; r < nRows; r++) {
        const score = rows[r].sum + v
        if (score < bestScore) { bestScore = score; best = r }
      }
      rows[best].items.push(item)
      rows[best].sum += v
    })

    const totalRowSum = rows.reduce((a, r) => a + r.sum, 0)
    let y = 0
    const results = []

    rows.forEach((row) => {
      const rowH = (row.sum / totalRowSum) * H
      let x = 0
      row.items.forEach((item) => {
        const itemW = (Math.max(item.avg, 0.01) / row.sum) * W
        results.push({
          ...item,
          x, y,
          w: Math.max(itemW - 4, 0),
          h: Math.max(rowH - 4, 0),
        })
        x += itemW
      })
      y += rowH
    })

    return results
  }, [items])

  if (items.length === 0) {
    return (
      <ChartCard>
        <EmptyState />
      </ChartCard>
    )
  }

  return (
    <div className="space-y-4 animate-chart-slide">
      <ChartCard>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto rounded-lg"
          style={{ maxHeight: 500 }}
        >
          {squares.map((s) => {
            const base = s.color || '#9ca3af'
            const fill = getColor(s.avg, base)
            const textColor = s.avg >= 2.5 ? '#fff' : '#111'
            const showText = s.w > 50 && s.h > 35
            return (
              <g
                key={s.skillId}
                onClick={() => onCellClick?.(s.catId, filterMember !== 'all' ? filterMember : undefined)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={s.x}
                  y={s.y}
                  width={s.w}
                  height={s.h}
                  fill={fill}
                  stroke="var(--background)"
                  strokeWidth={2}
                  rx={4}
                />
                {showText && (
                  <>
                    <text
                      x={s.x + s.w / 2}
                      y={s.y + s.h / 2 - 5}
                      textAnchor="middle"
                      fill={textColor}
                      fontSize={13}
                      fontWeight={600}
                      style={{ textShadow: textColor === '#fff' ? '0 1px 3px rgba(0,0,0,0.4)' : 'none', pointerEvents: 'none' }}
                    >
                      {s.name}
                    </text>
                    <text
                      x={s.x + s.w / 2}
                      y={s.y + s.h / 2 + 12}
                      textAnchor="middle"
                      fill={textColor}
                      fontSize={11}
                      style={{ textShadow: textColor === '#fff' ? '0 1px 3px rgba(0,0,0,0.4)' : 'none', pointerEvents: 'none' }}
                    >
                      {s.avg}
                      {filterMember === 'all' && ` (${s.count})`}
                    </text>
                  </>
                )}
                {!showText && s.w > 20 && s.h > 16 && (
                  <text
                    x={s.x + s.w / 2}
                    y={s.y + s.h / 2 + 4}
                    textAnchor="middle"
                    fill={textColor}
                    fontSize={10}
                    style={{ textShadow: textColor === '#fff' ? '0 1px 2px rgba(0,0,0,0.4)' : 'none', pointerEvents: 'none' }}
                  >
                    {s.avg}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </ChartCard>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <button
              className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={toggleAll}
              title={allCollapsed ? 'Tout dérouler' : 'Tout replier'}
            >
              <ListCollapse className={`h-3.5 w-3.5 transition-transform duration-200 ${allCollapsed ? '' : 'rotate-180'}`} />
            </button>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Détail des compétences
            </h3>
          </div>
          <div className="space-y-1">
            {cats.map((cat) => {
              const open = !collapsed.has(cat.id)
              return (
                <div key={cat.id}>
                  <button
                    className="flex items-center justify-between w-full py-1.5 px-2 rounded-md hover:bg-muted text-sm gap-2"
                    onClick={() => toggleCat(cat.id)}
                  >
                    <span className="flex items-center gap-2 min-w-0 flex-1">
                      {open ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat.color }} />
                      <span className="font-medium">{cat.name}</span>
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">{cat.children.length} comp.</span>
                  </button>
                  {open && (
                    <div className="ml-7 space-y-0.5 border-l-2 border-muted pl-3">
                      {cat.children.map((s) => (
                        <div
                          key={s.skillId}
                          className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-muted/50 cursor-pointer text-sm gap-4"
                          onClick={() => onCellClick?.(s.catId, filterMember !== 'all' ? filterMember : undefined)}
                        >
                          <span className="truncate">{s.name}</span>
                          <span className="flex items-center gap-2 shrink-0">
                            <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${(s.avg / 4) * 100}%`,
                                  background: getColor(s.avg, s.color || '#9ca3af'),
                                }}
                              />
                            </div>
                            <span className="font-medium text-xs tabular-nums w-8 text-right">{s.avg}</span>
                            {filterMember === 'all' && (
                              <span className="text-xs text-muted-foreground w-6 text-right">({s.count})</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
