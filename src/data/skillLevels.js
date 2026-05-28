const VALID_LEVELS = [1, 2, 3, 4]

function toKey(memberId, skillId) {
  return `${memberId}-${skillId}`
}

export function createSkillLevelsModule(adapter) {
  let cache = new Map()
  const listeners = new Set()

  function notify(event) {
    for (const cb of listeners) {
      try { cb(event) } catch { /* non-fatal */ }
    }
  }

  async function refresh() {
    const result = await adapter.fetchLevels()
    if (result.error) {
      notify({ type: 'error', source: 'refresh', error: result.error })
      return result
    }
    const map = new Map()
    for (const row of result.data) {
      map.set(toKey(row.member_id, row.skill_id), row)
    }
    cache = map
    notify({ type: 'levels_changed' })
    return result
  }

  function subscribe(callback) {
    listeners.add(callback)
    const unsubRealtime = adapter.subscribeToLevels(() => refresh())
    return () => {
      listeners.delete(callback)
      unsubRealtime()
    }
  }

  function list() {
    return cache
  }

  function get(memberId, skillId) {
    return cache.get(toKey(memberId, skillId))
  }

  async function setLevel(memberId, skillId, newLevel, changedBy) {
    if (!VALID_LEVELS.includes(newLevel)) {
      const error = new Error(`Niveau invalide: ${newLevel}. Doit être entre 1 et 4.`)
      notify({ type: 'error', source: 'setLevel', error })
      return { error }
    }

    const existing = cache.get(toKey(memberId, skillId))
    const oldLevel = existing?.level ?? null

    if (existing) {
      const result = await adapter.updateLevel(existing.id, { level: newLevel })
      if (result.error) {
        notify({ type: 'error', source: 'setLevel', error: result.error })
        return result
      }
    } else {
      const result = await adapter.insertLevel({ member_id: memberId, skill_id: skillId, level: newLevel })
      if (result.error) {
        notify({ type: 'error', source: 'setLevel', error: result.error })
        return result
      }
    }

    if (oldLevel !== newLevel && changedBy) {
      const histResult = await adapter.insertHistory({
        member_id: memberId,
        skill_id: skillId,
        old_level: oldLevel,
        new_level: newLevel,
        changed_by: changedBy,
      })
      if (histResult.error) {
        notify({ type: 'error', source: 'setLevel', error: histResult.error })
        return histResult
      }
    }

    await refresh()
    return { error: null }
  }

  function getAverageForSkill(skillId) {
    let total = 0
    let count = 0
    for (const row of cache.values()) {
      if (row.skill_id === skillId) {
        total += row.level
        count += 1
      }
    }
    return count === 0 ? null : Number((total / count).toFixed(1))
  }

  async function listHistory(options = {}) {
    return adapter.fetchHistory(options)
  }

  async function count() {
    return adapter.countLevels()
  }

  async function getTopSkills(limit = 5) {
    return adapter.fetchTopSkills(limit)
  }

  async function getStats() {
    return adapter.fetchStats()
  }

  return {
    refresh,
    subscribe,
    list,
    get,
    setLevel,
    getAverageForSkill,
    listHistory,
    count,
    getTopSkills,
    getStats,
  }
}