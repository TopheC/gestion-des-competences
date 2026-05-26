import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useSkills() {
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    const { data, error } = await supabase.from('skills').select('*, category:category_id(name)').order('name')
    if (!error && data) setSkills(data)
    setLoading(false)
    return { data, error }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetch() }, [fetch])

  return { skills, loading, refetch: fetch }
}
