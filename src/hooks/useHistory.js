import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'

const PAGE_SIZE = 50

export function useHistory() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(0)
  const [filters, setFilters] = useState({ memberId: 'all', skillId: 'all' })
  const channelRef = useRef(null)

  const totalPages = Math.ceil(count / PAGE_SIZE)

  const fetch = useCallback(async () => {
    setLoading(true)

    let query = supabase
      .from('skill_history')
      .select('*, member:member_id(full_name), skill:skill_id(name), changer:changed_by(full_name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (filters.memberId !== 'all') query = query.eq('member_id', filters.memberId)
    if (filters.skillId !== 'all') query = query.eq('skill_id', filters.skillId)

    const { data, count: total } = await query
    if (data) setHistory(data)
    if (total !== null) setCount(total)
    setLoading(false)
  }, [page, filters])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetch()

    channelRef.current = supabase
      .channel('skill_history_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'skill_history' }, () => {
        if (page === 0) fetch()
      })
      .subscribe()

    return () => {
      channelRef.current?.unsubscribe()
    }
  }, [fetch, page])
  /* eslint-enable react-hooks/set-state-in-effect */

  function setFilter(key, value) {
    setFilters((f) => ({ ...f, [key]: value }))
    setPage(0)
  }

  function nextPage() {
    if (page < totalPages - 1) setPage((p) => p + 1)
  }

  function prevPage() {
    if (page > 0) setPage((p) => p - 1)
  }

  return {
    history, loading, count, page, totalPages, filters,
    setFilter, nextPage, prevPage, refetch: fetch,
  }
}
