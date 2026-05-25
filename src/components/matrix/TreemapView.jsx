import { Treemap, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'

export default function TreemapView({
  categories: allCategories, members, levels,
  filterMember, filterCat,
  filteredSkills, onCellClick,
}) {
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

  const flatData = cats
    .flatMap((cat) => cat.children)
    .sort((a, b) => b.avg - a.avg)

  if (flatData.length === 0) {
    return <div className="p-8 text-center text-gray-400">Aucune donnée à afficher</div>
  }

  function getColor(avg) {
    if (avg >= 3.5) return '#34d399'
    if (avg >= 2.5) return '#fbbf24'
    if (avg >= 1.5) return '#60a5fa'
    return '#9ca3af'
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-950 rounded-lg p-4">
        <ResponsiveContainer width="100%" height={500}>
          <Treemap
            data={flatData}
            dataKey="size"
            aspectRatio={4 / 3}
            stroke="var(--background)"
            fill="#8884d8"
            content={({ x, y, width, height, payload }) => {
              if (!payload) return null
              return (
                <g>
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={getColor(payload.avg)}
                    stroke="var(--background)"
                    strokeWidth={2}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onCellClick?.(payload.catId, filterMember !== 'all' ? filterMember : undefined)}
                    rx={4}
                  />
                  {width > 40 && height > 30 && (
                    <>
                      <text
                        x={x + width / 2}
                        y={y + height / 2 - 4}
                        textAnchor="middle"
                        fill={payload.avg >= 2.5 ? '#000' : '#fff'}
                        fontSize={12}
                        fontWeight={600}
                      >
                        {payload.name}
                      </text>
                      <text
                        x={x + width / 2}
                        y={y + height / 2 + 12}
                        textAnchor="middle"
                        fill={payload.avg >= 2.5 ? '#000' : '#fff'}
                        fontSize={11}
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
      </div>

      {flatData.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
              Détail des compétences
            </h3>
            <div className="space-y-1">
              {flatData.map((s) => (
                <div
                  key={s.skillId}
                  className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-sm"
                  onClick={() => onCellClick?.(s.catId, filterMember !== 'all' ? filterMember : undefined)}
                >
                  <span>{s.name}</span>
                  <span className="font-medium">{s.avg}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
