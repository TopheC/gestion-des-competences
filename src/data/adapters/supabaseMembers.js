import { supabase } from '@/lib/supabase'

export function createSupabaseMembersAdapter() {
  async function fetchAll() {
    const { data, error } = await supabase.from('members').select('*')
    return { data, error }
  }

  async function fetchById(id) {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .single()
    return { data, error }
  }

  async function update(id, changes) {
    const { data, error } = await supabase
      .from('members')
      .update(changes)
      .eq('id', id)
      .select()
    return { data, error }
  }

  async function remove(id) {
    const { data, error } = await supabase
      .from('members')
      .delete()
      .eq('id', id)
    return { data, error }
  }

  async function getCurrentUserId() {
    const { data, error } = await supabase.auth.getUser()
    if (error) return { data: null, error }
    return { data: data?.user?.id ?? null, error: null }
  }

  return { fetchAll, fetchById, update, remove, getCurrentUserId }
}
