import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useMembers() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    const { data, error } = await supabase.from('members').select('*').order('full_name')
    if (!error && data) setMembers(data)
    setLoading(false)
    return { data, error }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetch() }, [fetch])

  return { members, loading, refetch: fetch }
}
