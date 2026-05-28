import { useEffect, useState, useCallback, useRef } from 'react'
import { createSkillLevelsModule } from '@/data/skillLevels'
import { createSupabaseAdapter } from '@/data/adapters/supabaseSkillLevels'

let moduleInstance = null

function getModule() {
  if (!moduleInstance) {
    moduleInstance = createSkillLevelsModule(createSupabaseAdapter())
  }
  return moduleInstance
}

const PAGE_SIZE = 50

export function useHistory() {
  const mod = getModule()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(0)
  const [filters, setFilters] = useState({ memberId: 'all', skillId: 'all' })
  const unsubRef = useRef(null)

  const totalPages = Math.ceil(count / PAGE_SIZE) || 1

  const fetch = useCallback(async () => {
    setLoading(true)
    const result = await mod.listHistory({ page, memberId: filters.memberId, skillId: filters.skillId, pageSize: PAGE_SIZE })
    if (result.data) setHistory(result.data)
    if (result.count !== null && result.count !== undefined) setCount(result.count)
    setLoading(false)
  }, [mod, page, filters.memberId, filters.skillId])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      const result = await mod.listHistory({ page, memberId: filters.memberId, skillId: filters.skillId, pageSize: PAGE_SIZE })
      if (cancelled) return
      if (result.data) setHistory(result.data)
      if (result.count !== null && result.count !== undefined) setCount(result.count)
      setLoading(false)
    }

    load()

    const unsub = mod.subscribe(() => {
      if (page === 0) load()
    })
    unsubRef.current = unsub

    return () => {
      cancelled = true
      unsub()
    }
  }, [mod, page, filters.memberId, filters.skillId])

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