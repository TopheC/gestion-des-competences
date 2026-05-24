import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export function useSkillLevels() {
  const [levels, setLevels] = useState({})
  const [loading, setLoading] = useState(true)
  const channelRef = useRef(null)

  const fetch = useCallback(async () => {
    const { data, error } = await supabase.from('skill_levels').select('*')
    if (!error && data) {
      const map = {}
      data.forEach((l) => { map[`${l.member_id}-${l.skill_id}`] = l })
      setLevels(map)
    }
    setLoading(false)
    return { data, error }
  }, [])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetch()

    channelRef.current = supabase
      .channel('skill_levels_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'skill_levels' }, () => {
        fetch()
      })
      .subscribe()

    return () => {
      channelRef.current?.unsubscribe()
    }
  }, [fetch])
  /* eslint-enable react-hooks/set-state-in-effect */

  async function updateLevel(memberId, skillId, newLevel, changedBy) {
    const key = `${memberId}-${skillId}`
    const existing = levels[key]
    const oldLevel = existing?.level

    if (existing) {
      await supabase.from('skill_levels').update({ level: newLevel }).eq('id', existing.id)
    } else {
      await supabase.from('skill_levels').insert({ member_id: memberId, skill_id: skillId, level: newLevel })
    }

    if (oldLevel !== newLevel && changedBy) {
      await supabase.from('skill_history').insert({
        member_id: memberId,
        skill_id: skillId,
        old_level: oldLevel || null,
        new_level: newLevel,
        changed_by: changedBy,
      })
    }

    await fetch()
  }

  async function getAverageSkillRating(skillId) {
    const { data } = await supabase
      .from('skill_levels')
      .select('level')
      .eq('skill_id', skillId)
    if (!data || data.length === 0) return null
    return (data.reduce((sum, l) => sum + l.level, 0) / data.length).toFixed(1)
  }

  return { levels, loading, refetch: fetch, updateLevel, getAverageSkillRating }
}
