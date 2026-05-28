import { describe, it, expect, beforeEach } from 'vitest'
import { createSkillLevelsModule } from '../skillLevels.js'
import { createMemoryAdapter } from '../adapters/memorySkillLevels.js'

function makeLevel(memberId, skillId, level) {
  return {
    id: `${memberId}-${skillId}`,
    member_id: memberId,
    skill_id: skillId,
    level,
    updated_at: new Date().toISOString(),
  }
}

describe('skillLevels module', () => {
  let module

  beforeEach(() => {
    const adapter = createMemoryAdapter([
      makeLevel('m1', 's1', 2),
      makeLevel('m1', 's2', 3),
      makeLevel('m2', 's1', 1),
    ], [])
    module = createSkillLevelsModule(adapter)
  })

  describe('refresh + list', () => {
    it('loads levels into the cache', async () => {
      await module.refresh()
      const levels = module.list()
      expect(levels.size).toBe(3)
    })

    it('returns empty map when no levels', async () => {
      const adapter = createMemoryAdapter([], [])
      module = createSkillLevelsModule(adapter)
      await module.refresh()
      expect(module.list().size).toBe(0)
    })
  })

  describe('get', () => {
    it('returns a level by memberId + skillId', async () => {
      await module.refresh()
      const level = module.get('m1', 's1')
      expect(level.level).toBe(2)
    })

    it('returns undefined for missing entry', async () => {
      await module.refresh()
      expect(module.get('m99', 's99')).toBeUndefined()
    })
  })

  describe('setLevel', () => {
    it('updates an existing level', async () => {
      await module.refresh()
      const result = await module.setLevel('m1', 's1', 4, 'admin1')
      expect(result.error).toBeNull()
      expect(module.get('m1', 's1').level).toBe(4)
    })

    it('inserts a new level when none exists', async () => {
      await module.refresh()
      const result = await module.setLevel('m3', 's3', 2, 'm3')
      expect(result.error).toBeNull()
      expect(module.get('m3', 's3').level).toBe(2)
    })

    it('rejects invalid level values', async () => {
      await module.refresh()
      const result = await module.setLevel('m1', 's1', 5, 'admin1')
      expect(result.error).toBeTruthy()
      expect(result.error.message).toContain('1 et 4')
    })

    it('rejects level 0', async () => {
      await module.refresh()
      const result = await module.setLevel('m1', 's1', 0, 'admin1')
      expect(result.error).toBeTruthy()
    })

    it('logs history when level changes', async () => {
      const historyEntries = []
      const adapter = createMemoryAdapter([makeLevel('m1', 's1', 2)], historyEntries)
      module = createSkillLevelsModule(adapter)
      await module.refresh()
      await module.setLevel('m1', 's1', 3, 'admin1')

      const histResult = await module.listHistory()
      expect(histResult.data.length).toBe(1)
      expect(histResult.data[0].old_level).toBe(2)
      expect(histResult.data[0].new_level).toBe(3)
      expect(histResult.data[0].changed_by).toBe('admin1')
    })

    it('does not log history when level stays the same', async () => {
      const historyEntries = []
      const adapter = createMemoryAdapter([makeLevel('m1', 's1', 2)], historyEntries)
      module = createSkillLevelsModule(adapter)
      await module.refresh()
      await module.setLevel('m1', 's1', 2, 'admin1')

      const histResult = await module.listHistory()
      expect(histResult.data.length).toBe(0)
    })

    it('logs history with null old_level for new entries', async () => {
      const historyEntries = []
      const adapter = createMemoryAdapter([], historyEntries)
      module = createSkillLevelsModule(adapter)
      await module.refresh()
      await module.setLevel('m1', 's1', 3, 'm1')

      const histResult = await module.listHistory()
      expect(histResult.data[0].old_level).toBeNull()
    })

    it('refreshes cache after setLevel', async () => {
      await module.refresh()
      expect(module.get('m1', 's1').level).toBe(2)
      await module.setLevel('m1', 's1', 4, 'admin1')
      expect(module.get('m1', 's1').level).toBe(4)
    })
  })

  describe('getAverageForSkill', () => {
    it('computes average from cached levels', async () => {
      await module.refresh()
      const avg = module.getAverageForSkill('s1')
      expect(avg).toBe(1.5)
    })

    it('returns null when no levels exist for skill', async () => {
      await module.refresh()
      expect(module.getAverageForSkill('s999')).toBeNull()
    })
  })

  describe('listHistory', () => {
    it('returns history entries', async () => {
      await module.refresh()
      const history = [
        { id: 'h1', member_id: 'm1', skill_id: 's1', old_level: 1, new_level: 2, changed_by: 'admin1', created_at: new Date().toISOString() },
      ]
      const adapter = createMemoryAdapter([makeLevel('m1', 's1', 2)], history)
      module = createSkillLevelsModule(adapter)
      const result = await module.listHistory()
      expect(result.data.length).toBe(1)
    })

    it('filters by memberId', async () => {
      const history = [
        { id: 'h1', member_id: 'm1', skill_id: 's1', old_level: 1, new_level: 2, changed_by: 'admin1', created_at: new Date().toISOString() },
        { id: 'h2', member_id: 'm2', skill_id: 's1', old_level: null, new_level: 3, changed_by: 'm2', created_at: new Date().toISOString() },
      ]
      const adapter = createMemoryAdapter([], history)
      module = createSkillLevelsModule(adapter)
      const result = await module.listHistory({ memberId: 'm1' })
      expect(result.data.length).toBe(1)
      expect(result.data[0].member_id).toBe('m1')
    })

    it('paginates', async () => {
      const history = Array.from({ length: 100 }, (_, i) => ({
        id: `h${i}`, member_id: 'm1', skill_id: 's1', old_level: 1, new_level: 2, changed_by: 'admin1', created_at: new Date().toISOString(),
      }))
      const adapter = createMemoryAdapter([], history)
      module = createSkillLevelsModule(adapter)
      const page0 = await module.listHistory({ page: 0 })
      expect(page0.data.length).toBe(50)
      expect(page0.totalPages).toBe(2)
    })
  })

  describe('count', () => {
    it('returns the number of levels', async () => {
      const result = await module.count()
      expect(result.count).toBe(3)
    })
  })

  describe('getTopSkills', () => {
    it('returns skills sorted by average level', async () => {
      const result = await module.getTopSkills(5)
      expect(result.data.length).toBeGreaterThan(0)
      expect(result.data[0].avg).toBeGreaterThanOrEqual(result.data[result.data.length - 1].avg)
    })

    it('respects limit', async () => {
      const result = await module.getTopSkills(2)
      expect(result.data.length).toBeLessThanOrEqual(2)
    })
  })

  describe('subscribe', () => {
    it('calls callback on level changes', async () => {
      const events = []
      await module.refresh()
      const unsub = module.subscribe((event) => events.push(event))
      await module.setLevel('m1', 's1', 4, 'admin1')
      const changeEvent = events.find((e) => e.type === 'levels_changed')
      expect(changeEvent).toBeTruthy()
      unsub()
    })

    it('stops calling after unsubscribe', async () => {
      const events = []
      await module.refresh()
      const unsub = module.subscribe((event) => events.push(event))
      unsub()
      await module.setLevel('m1', 's1', 4, 'admin1')
      const changeEvents = events.filter((e) => e.type === 'levels_changed')
      expect(changeEvents.length).toBe(0)
    })
  })

  describe('error handling', () => {
    it('propagates fetch errors', async () => {
      const adapter = createMemoryAdapter([], [])
      adapter.fetchLevels = async () => ({ data: null, error: new Error('DB down') })
      module = createSkillLevelsModule(adapter)
      const result = await module.refresh()
      expect(result.error).toBeTruthy()
    })

    it('propagates update errors via setLevel', async () => {
      const adapter = createMemoryAdapter([makeLevel('m1', 's1', 2)])
      adapter.updateLevel = async () => ({ data: null, error: new Error('RLS denied') })
      module = createSkillLevelsModule(adapter)
      await module.refresh()
      const result = await module.setLevel('m1', 's1', 4, 'admin1')
      expect(result.error).toBeTruthy()
      expect(result.error.message).toBe('RLS denied')
    })

    it('notifies error subscribers on setLevel failure', async () => {
      const events = []
      const adapter = createMemoryAdapter([makeLevel('m1', 's1', 2)])
      adapter.updateLevel = async () => ({ data: null, error: new Error('fail') })
      module = createSkillLevelsModule(adapter)
      await module.refresh()
      const unsub = module.subscribe((event) => events.push(event))
      await module.setLevel('m1', 's1', 4, 'admin1')
      const errorEvent = events.find((e) => e.type === 'error')
      expect(errorEvent).toBeTruthy()
      unsub()
    })
  })
})