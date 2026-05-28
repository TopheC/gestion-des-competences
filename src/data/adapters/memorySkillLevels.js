export function createMemoryAdapter(initialLevels = [], initialHistory = []) {
  const levels = new Map()
  let nextId = 1
  let historyNextId = 1
  const historyEntries = [...initialHistory]
  const subscriptions = new Set()

  for (const row of initialLevels) {
    const id = row.id || `mem-${nextId++}`
    levels.set(id, { ...row, id })
  }

  function notify(event) {
    for (const cb of subscriptions) {
      cb(event)
    }
  }

  async function fetchLevels() {
    return { data: Array.from(levels.values()), error: null }
  }

  async function updateLevel(id, updates) {
    const existing = levels.get(id)
    if (!existing) return { data: null, error: new Error(`Level ${id} not found`) }
    const updated = { ...existing, ...updates }
    levels.set(id, updated)
    notify({})
    return { data: updated, error: null }
  }

  async function insertLevel(row) {
    const id = row.id || `mem-${nextId++}`
    const newRow = { ...row, id }
    levels.set(id, newRow)
    notify({})
    return { data: newRow, error: null }
  }

  async function insertHistory(entry) {
    const id = `hist-${historyNextId++}`
    const row = { ...entry, id, created_at: new Date().toISOString() }
    historyEntries.unshift(row)
    notify({})
    return { data: row, error: null }
  }

  function subscribeToLevels(onChange) {
    subscriptions.add(onChange)
    return () => { subscriptions.delete(onChange) }
  }

  async function fetchHistory(options = {}) {
    const { page = 0, memberId = 'all', skillId = 'all', pageSize = 50 } = options
    let filtered = [...historyEntries]
    if (memberId !== 'all') filtered = filtered.filter((e) => e.member_id === memberId)
    if (skillId !== 'all') filtered = filtered.filter((e) => e.skill_id === skillId)

    const count = filtered.length
    const totalPages = Math.ceil(count / pageSize) || 1
    const start = page * pageSize
    const data = filtered.slice(start, start + pageSize)

    return { data, count, error: null, page, totalPages }
  }

  async function countLevels() {
    return { count: levels.size, error: null }
  }

  async function fetchTopSkills(limit = 5) {
    const avgMap = {}
    for (const row of levels.values()) {
      if (!avgMap[row.skill_id]) {
        avgMap[row.skill_id] = { name: `Skill ${row.skill_id}`, total: 0, count: 0 }
      }
      avgMap[row.skill_id].total += row.level
      avgMap[row.skill_id].count += 1
    }

    const sorted = Object.values(avgMap)
      .map((s) => ({ ...s, avg: Number((s.total / s.count).toFixed(1)) }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, limit)

    return { data: sorted, error: null }
  }

  async function fetchStats() {
    return { members: 0, skills: 0, categories: 0 }
  }

  return {
    fetchLevels,
    updateLevel,
    insertLevel,
    insertHistory,
    subscribeToLevels,
    fetchHistory,
    countLevels,
    fetchTopSkills,
    fetchStats,
    _levels: levels,
  }
}