import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export function AcceptInvite() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [valid, setValid] = useState(false)

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    let cancelled = false
    async function checkToken() {
      const { data } = await supabase
        .from('invitations')
        .select('*')
        .eq('token', token)
        .eq('accepted', false)
        .gte('expires_at', new Date().toISOString())
        .single()
      if (!cancelled) {
        if (data) {
          setEmail(data.email)
          setValid(true)
        }
        setLoading(false)
      }
    }
    if (token) checkToken()
    else setLoading(false)
    return () => { cancelled = true }
  }, [token])
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    await supabase.from('invitations').update({ accepted: true }).eq('token', token)

    toast.success('Compte créé ! Vous pouvez vous connecter.')
    navigate('/login')
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Vérification...</div>
  if (!valid) return (
    <div className="min-h-screen flex items-center justify-center">
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-red-600">Lien d'invitation invalide ou expiré.</p>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Accepter l'invitation</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">{email}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Nom complet"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Création...' : 'Créer mon compte'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
