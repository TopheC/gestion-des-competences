import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

const levelLabels = {
  1: { label: 'Débutant', color: '#9ca3af' },
  2: { label: 'Intermédiaire', color: '#60a5fa' },
  3: { label: 'Avancé', color: '#fbbf24' },
  4: { label: 'Expert', color: '#34d399' },
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
    return {
      name: cat.name,
      color: cat.color,
      id: cat.id,
      ...buckets,
    }
  })

  if (data.length === 0) {
    return <div className="p-8 text-center text-gray-400">Aucune donnée à afficher</div>
  }

  function handleClick(entry, _index, level) {
    if (onBarClick && entry?.id) {
      onBarClick(entry.id, level)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-950 rounded-lg p-4">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 80, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis type="number" stroke="var(--foreground)" tick={{ fontSize: 12 }} />
          <YAxis type="category" dataKey="name" stroke="var(--foreground)" tick={{ fontSize: 12 }} width={100} />
          <Tooltip
            contentStyle={{
              background: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontSize: 13,
            }}
          />
          <Legend
            payload={[1, 2, 3, 4].map((l) => ({
              value: `${l} - ${levelLabels[l].label}`,
              type: 'rect',
              color: levelLabels[l].color,
            }))}
          />
          {[1, 2, 3, 4].map((lvl) => (
            <Bar
              key={lvl}
              dataKey={lvl}
              stackId="a"
              fill={levelLabels[lvl].color}
              name={`Niveau ${lvl}`}
              cursor="pointer"
              onClick={(entry) => handleClick(entry, null, lvl)}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
