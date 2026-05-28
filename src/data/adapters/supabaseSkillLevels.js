import { supabase } from '@/lib/supabase'

const PAGE_SIZE = 50

export function createSupabaseAdapter() {
  async function fetchLevels() {
    const { data, error } = await supabase.from('skill_levels').select('*')
    return { data, error }
  }

  async function updateLevel(id, updates) {
    const { data, error } = await supabase
      .from('skill_levels')
      .update(updates)
      .eq('id', id)
      .select()
    return { data, error }
  }

  async function insertLevel(row) {
    const { data, error } = await supabase
      .from('skill_levels')
      .insert(row)
      .select()
    return { data, error }
  }

  async function insertHistory(entry) {
    const { data, error } = await supabase
      .from('skill_history')
      .insert(entry)
      .select()
    return { data, error }
  }

  function subscribeToLevels(onChange) {
    const channel = supabase
      .channel('skill_levels_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'skill_levels' }, onChange)
      .subscribe()

    return () => { channel.unsubscribe() }
  }

  async function fetchHistory(options = {}) {
    const { page = 0, memberId = 'all', skillId = 'all' } = options

    let query = supabase
      .from('skill_history')
      .select('*, member:member_id(full_name), skill:skill_id(name), changer:changed_by(full_name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (memberId !== 'all') query = query.eq('member_id', memberId)
    if (skillId !== 'all') query = query.eq('skill_id', skillId)

    const { data, count, error } = await query
    return { data, count, error, page, totalPages: Math.ceil((count || 0) / PAGE_SIZE) }
  }

  async function countLevels() {
    const { count, error } = await supabase
      .from('skill_levels')
      .select('*', { count: 'exact', head: true })
    return { count, error }
  }

  async function fetchTopSkills(limit = 5) {
    const { data, error } = await supabase
      .from('skill_levels')
      .select('skill_id, level, skill:skill_id(name)')

    if (error) return { data: null, error }

    const avgMap = {}
    for (const l of data) {
      if (!avgMap[l.skill_id]) {
        avgMap[l.skill_id] = { name: l.skill?.name || 'Inconnu', total: 0, count: 0 }
      }
      avgMap[l.skill_id].total += l.level
      avgMap[l.skill_id].count += 1
    }

    const sorted = Object.values(avgMap)
      .map((s) => ({ ...s, avg: Number((s.total / s.count).toFixed(1)) }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, limit)

    return { data: sorted, error: null }
  }

  async function fetchStats() {
    const [members, skills, categories] = await Promise.all([
      supabase.from('members').select('*', { count: 'exact', head: true }),
      supabase.from('skills').select('*', { count: 'exact', head: true }),
      supabase.from('categories').select('*', { count: 'exact', head: true }),
    ])
    return {
      members: members.count || 0,
      skills: skills.count || 0,
      categories: categories.count || 0,
    }
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
  }
}