import { useEffect, useState, useCallback } from 'react'
import { createMembersModule } from '@/data/members'
import { createSupabaseMembersAdapter } from '@/data/adapters/supabaseMembers'

let moduleInstance = null

function getModule() {
  if (!moduleInstance) {
    moduleInstance = createMembersModule(createSupabaseMembersAdapter())
  }
  return moduleInstance
}

export function useMembers() {
  const mod = getModule()
  const [members, setMembers] = useState(() => mod.list())
  const [loading, setLoading] = useState(() => !mod.isHydrated())
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true

    const unsub = mod.subscribe((event) => {
      if (!alive) return
      if (event.type === 'members_changed') {
        setMembers(mod.list())
        setLoading(false)
      }
      if (event.type === 'error') {
        setError(event.error)
        setLoading(false)
      }
    })

    mod.loadIfNeeded().then((result) => {
      if (!alive) return
      setError(result.error)
      setLoading(false)
    })

    return () => { alive = false; unsub() }
  }, [mod])

  const updateMember = useCallback((memberId, changes) => mod.update(memberId, changes), [mod])
  const removeMember = useCallback((memberId) => mod.remove(memberId), [mod])
  const refetch = useCallback(() => mod.refresh(), [mod])

  return { members, loading, error, refetch, updateMember, removeMember }
}

export { getModule as membersModule }
