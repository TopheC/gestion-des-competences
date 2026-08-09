const VALID_FIELDS = ['full_name', 'role']
const VALID_ROLES = ['admin', 'member']

function sortByFullName(members) {
  return [...members].sort((a, b) =>
    (a.full_name || a.email || '').localeCompare(b.full_name || b.email || '', 'fr')
  )
}

export function createMembersModule(adapter) {
  let cache = []
  let hydrated = false
  let inFlight = null
  const listeners = new Set()

  function notify(event) {
    for (const cb of listeners) {
      try { cb(event) } catch { /* non-fatal */ }
    }
  }

  async function refresh() {
    const result = await adapter.fetchAll()
    if (result.error) {
      notify({ type: 'error', source: 'refresh', error: result.error })
      return { data: null, error: result.error }
    }
    cache = sortByFullName(result.data)
    hydrated = true
    notify({ type: 'members_changed' })
    return { data: cache, error: null }
  }

  function loadIfNeeded() {
    if (hydrated) return Promise.resolve({ data: cache, error: null })
    if (!inFlight) {
      inFlight = refresh().finally(() => { inFlight = null })
    }
    return inFlight
  }

  function isHydrated() {
    return hydrated
  }

  function list() {
    return cache
  }

  async function getById(id) {
    const cached = cache.find((m) => m.id === id)
    if (cached) return { data: cached, error: null }
    const result = await adapter.fetchById(id)
    if (result.error) {
      notify({ type: 'error', source: 'getById', error: result.error })
      return { data: null, error: result.error }
    }
    return { data: result.data ?? null, error: null }
  }

  async function count() {
    const result = await loadIfNeeded()
    if (result.error) return { count: 0, error: result.error }
    return { count: cache.length, error: null }
  }

  async function update(id, changes) {
    const unknown = Object.keys(changes).filter((key) => !VALID_FIELDS.includes(key))
    if (unknown.length > 0) {
      const error = new Error(`Champ non modifiable: ${unknown.join(', ')}`)
      notify({ type: 'error', source: 'update', error })
      return { data: null, error }
    }
    if (changes.role !== undefined && !VALID_ROLES.includes(changes.role)) {
      const error = new Error(`Rôle invalide: ${changes.role}. Doit être admin ou member.`)
      notify({ type: 'error', source: 'update', error })
      return { data: null, error }
    }
    const result = await adapter.update(id, changes)
    if (result.error) {
      notify({ type: 'error', source: 'update', error: result.error })
      return { data: null, error: result.error }
    }
    await refresh()
    return { data: result.data ?? null, error: null }
  }

  async function remove(id) {
    const { data: currentUserId, error: identityError } = await adapter.getCurrentUserId()
    if (identityError) {
      notify({ type: 'error', source: 'remove', error: identityError })
      return { error: identityError }
    }
    if (id === currentUserId) {
      const error = new Error('Impossible de supprimer votre propre compte')
      notify({ type: 'error', source: 'remove', error })
      return { error }
    }
    const result = await adapter.remove(id)
    if (result.error) {
      notify({ type: 'error', source: 'remove', error: result.error })
      return { error: result.error }
    }
    await refresh()
    return { error: null }
  }

  function subscribe(callback) {
    listeners.add(callback)
    return () => { listeners.delete(callback) }
  }

  return {
    refresh,
    loadIfNeeded,
    list,
    getById,
    count,
    update,
    remove,
    subscribe,
    isHydrated,
  }
}
