import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    const { data, error } = await supabase.from('categories').select('*').order('name')
    if (!error && data) setCategories(data)
    setLoading(false)
    return { data, error }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetch() }, [fetch])

  return { categories, loading, refetch: fetch }
}
