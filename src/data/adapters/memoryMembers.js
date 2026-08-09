export function createMemoryMembersAdapter(initialMembers = [], currentUserId = null) {
  const members = [...initialMembers]

  async function fetchAll() {
    return { data: [...members], error: null }
  }

  async function fetchById(id) {
    const member = members.find((m) => m.id === id)
    return { data: member ?? null, error: null }
  }

  async function update(id, changes) {
    const index = members.findIndex((m) => m.id === id)
    if (index === -1) return { data: null, error: new Error(`Member ${id} not found`) }
    const updated = { ...members[index], ...changes }
    members[index] = updated
    return { data: updated, error: null }
  }

  async function remove(id) {
    const index = members.findIndex((m) => m.id === id)
    if (index === -1) return { data: null, error: new Error(`Member ${id} not found`) }
    members.splice(index, 1)
    return { data: null, error: null }
  }

  async function getCurrentUserId() {
    return { data: currentUserId, error: null }
  }

  return { fetchAll, fetchById, update, remove, getCurrentUserId }
}
