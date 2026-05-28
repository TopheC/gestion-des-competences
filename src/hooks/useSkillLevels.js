import { useEffect, useState, useRef, useCallback } from 'react'
import { createSkillLevelsModule } from '@/data/skillLevels'
import { createSupabaseAdapter } from '@/data/adapters/supabaseSkillLevels'

let moduleInstance = null

function getModule() {
  if (!moduleInstance) {
    moduleInstance = createSkillLevelsModule(createSupabaseAdapter())
  }
  return moduleInstance
}

export function useSkillLevels() {
  const mod = getModule()
  const [levels, setLevels] = useState(() => new Map())
  const [loading, setLoading] = useState(true)
  const unsubRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function init() {
      await mod.refresh()
      if (!cancelled) {
        setLevels(mod.list())
        setLoading(false)
      }
    }

    init()

    const unsub = mod.subscribe((event) => {
      if (event.type === 'levels_changed') {
        setLevels(mod.list())
      }
    })
    unsubRef.current = unsub

    return () => {
      cancelled = true
      unsub()
    }
  }, [mod])

  const updateLevel = useCallback(async (memberId, skillId, newLevel, changedBy) => {
    const result = await mod.setLevel(memberId, skillId, newLevel, changedBy)
    if (result.error) {
      return result
    }
    return result
  }, [mod])

  const refetch = useCallback(async () => {
    await mod.refresh()
    setLevels(mod.list())
  }, [mod])

  const getAverageSkillRating = useCallback((skillId) => {
    return mod.getAverageForSkill(skillId)
  }, [mod])

  return { levels, loading, refetch, updateLevel, getAverageSkillRating }
}

export { getModule as skillLevelsModule }

export function getSkillLevelsModule() {
  return getModule()
}