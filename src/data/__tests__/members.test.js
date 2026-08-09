import { describe, it, expect, beforeEach } from 'vitest'
import { createMembersModule } from '../members.js'
import { createMemoryMembersAdapter } from '../adapters/memoryMembers.js'

function makeMember(id, fullName, extra = {}) {
  return { id, email: `${id}@test.fr`, full_name: fullName, role: 'member', created_at: '2026-01-01T00:00:00Z', ...extra }
}

describe('members module', () => {
  let module
  let adapter

  beforeEach(() => {
    adapter = createMemoryMembersAdapter([
      makeMember('m2', 'Bob'),
      makeMember('m1', 'Alice'),
      makeMember('m3', 'Charlie'),
    ], 'm1')
    module = createMembersModule(adapter)
  })

  describe('refresh + list', () => {
    it('loads members sorted by full_name', async () => {
      const result = await module.refresh()
      expect(result.error).toBeNull()
      expect(module.list().map((m) => m.id)).toEqual(['m1', 'm2', 'm3'])
    })

    it('returns empty list before hydration', () => {
      expect(module.list()).toEqual([])
    })
  })

  describe('loadIfNeeded', () => {
    it('hydrates the cache on first call', async () => {
      const result = await module.loadIfNeeded()
      expect(result.error).toBeNull()
      expect(module.list().length).toBe(3)
    })

    it('is a no-op once hydrated', async () => {
      let calls = 0
      const adapter = createMemoryMembersAdapter([makeMember('m1', 'Alice')], 'm1')
      adapter.fetchAll = async () => { calls += 1; return { data: [makeMember('m1', 'Alice')], error: null } }
      module = createMembersModule(adapter)
      await module.loadIfNeeded()
      await module.loadIfNeeded()
      expect(calls).toBe(1)
    })

    it('deduplicates concurrent calls', async () => {
      let calls = 0
      const adapter = createMemoryMembersAdapter([makeMember('m1', 'Alice')], 'm1')
      adapter.fetchAll = async () => {
        calls += 1
        await new Promise((resolve) => setTimeout(resolve, 10))
        return { data: [makeMember('m1', 'Alice')], error: null }
      }
      module = createMembersModule(adapter)
      const [a, b] = await Promise.all([module.loadIfNeeded(), module.loadIfNeeded()])
      expect(calls).toBe(1)
      expect(a.error).toBeNull()
      expect(b.error).toBeNull()
    })
  })

  describe('getById', () => {
    it('serves from cache after refresh', async () => {
      await module.refresh()
      const result = await module.getById('m2')
      expect(result.error).toBeNull()
      expect(result.data.full_name).toBe('Bob')
    })

    it('fetches from adapter on cache miss', async () => {
      const result = await module.getById('m1')
      expect(result.error).toBeNull()
      expect(result.data.id).toBe('m1')
    })

    it('does not populate the cache on miss', async () => {
      await module.getById('m1')
      expect(module.list()).toEqual([])
    })

    it('returns data null when member does not exist', async () => {
      const result = await module.getById('m99')
      expect(result.error).toBeNull()
      expect(result.data).toBeNull()
    })
  })

  describe('count', () => {
    it('returns the number of cached members', async () => {
      const result = await module.count()
      expect(result.count).toBe(3)
      expect(result.error).toBeNull()
    })
  })

  describe('update', () => {
    it('updates a member, refreshes and notifies', async () => {
      const events = []
      await module.refresh()
      const unsub = module.subscribe((event) => events.push(event))
      const result = await module.update('m2', { full_name: 'Robert' })
      expect(result.error).toBeNull()
      expect(result.data.full_name).toBe('Robert')
      expect(module.list().find((m) => m.id === 'm2').full_name).toBe('Robert')
      expect(events.filter((e) => e.type === 'members_changed').length).toBe(1)
      unsub()
    })

    it('rejects unknown fields', async () => {
      const result = await module.update('m2', { email: 'x@y.fr' })
      expect(result.error).toBeTruthy()
      expect(result.error.message).toContain('Champ non modifiable')
    })

    it('rejects invalid roles', async () => {
      const result = await module.update('m2', { role: 'superuser' })
      expect(result.error).toBeTruthy()
      expect(result.error.message).toContain('Rôle invalide')
    })

    it('propagates adapter errors', async () => {
      const adapter = createMemoryMembersAdapter([makeMember('m1', 'Alice')], 'm1')
      adapter.update = async () => ({ data: null, error: new Error('RLS denied') })
      module = createMembersModule(adapter)
      await module.refresh()
      const result = await module.update('m1', { full_name: 'A' })
      expect(result.error).toBeTruthy()
      expect(result.error.message).toBe('RLS denied')
    })

    it('notifies error subscribers on failure', async () => {
      const events = []
      const adapter = createMemoryMembersAdapter([makeMember('m1', 'Alice')], 'm1')
      adapter.update = async () => ({ data: null, error: new Error('fail') })
      module = createMembersModule(adapter)
      await module.refresh()
      const unsub = module.subscribe((event) => events.push(event))
      await module.update('m1', { full_name: 'A' })
      const errorEvent = events.find((e) => e.type === 'error')
      expect(errorEvent).toBeTruthy()
      expect(errorEvent.source).toBe('update')
      unsub()
    })
  })

  describe('remove', () => {
    it('removes a member, refreshes and notifies', async () => {
      const events = []
      await module.refresh()
      const unsub = module.subscribe((event) => events.push(event))
      const result = await module.remove('m2')
      expect(result.error).toBeNull()
      expect(module.list().map((m) => m.id)).toEqual(['m1', 'm3'])
      expect(events.filter((e) => e.type === 'members_changed').length).toBe(1)
      unsub()
    })

    it('refuses to delete the current user', async () => {
      await module.refresh()
      const result = await module.remove('m1')
      expect(result.error).toBeTruthy()
      expect(result.error.message).toContain('votre propre compte')
      expect(module.list().length).toBe(3)
    })

    it('propagates adapter errors', async () => {
      const adapter = createMemoryMembersAdapter([makeMember('m1', 'Alice')], null)
      adapter.remove = async () => ({ data: null, error: new Error('RLS denied') })
      module = createMembersModule(adapter)
      await module.refresh()
      const result = await module.remove('m1')
      expect(result.error).toBeTruthy()
      expect(result.error.message).toBe('RLS denied')
    })
  })

  describe('subscribe', () => {
    it('calls callback on members_changed', async () => {
      const events = []
      await module.refresh()
      const unsub = module.subscribe((event) => events.push(event))
      await module.remove('m2')
      const changeEvent = events.find((e) => e.type === 'members_changed')
      expect(changeEvent).toBeTruthy()
      unsub()
    })

    it('stops calling after unsubscribe', async () => {
      const events = []
      await module.refresh()
      const unsub = module.subscribe((event) => events.push(event))
      unsub()
      await module.remove('m2')
      expect(events.filter((e) => e.type === 'members_changed').length).toBe(0)
    })
  })

  describe('error handling', () => {
    it('keeps the old cache and notifies on refresh failure', async () => {
      const events = []
      await module.refresh()
      adapter.fetchAll = async () => ({ data: null, error: new Error('DB down') })
      const unsub = module.subscribe((event) => events.push(event))
      const result = await module.refresh()
      expect(result.error).toBeTruthy()
      expect(module.list().length).toBe(3)
      const errorEvent = events.find((e) => e.type === 'error' && e.source === 'refresh')
      expect(errorEvent).toBeTruthy()
      unsub()
    })

    it('count returns error when hydration fails', async () => {
      const adapter = createMemoryMembersAdapter([], 'm1')
      adapter.fetchAll = async () => ({ data: null, error: new Error('DB down') })
      module = createMembersModule(adapter)
      const result = await module.count()
      expect(result.error).toBeTruthy()
      expect(result.count).toBe(0)
    })
  })
})
