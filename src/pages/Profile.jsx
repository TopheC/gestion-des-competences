import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export function Profile() {
  const { profile, fetchProfile } = useAuth()
  const [name, setName] = useState(profile?.full_name || '')

  async function handleSave() {
    const { error } = await supabase.from('members').update({ full_name: name }).eq('id', profile.id)
    if (error) {
      toast.error('Erreur lors de la mise à jour')
    } else {
      fetchProfile(profile.id)
      toast.success('Profil mis à jour')
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Mon profil</h1>
      <Card>
        <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-gray-600">Email</label>
            <p className="font-medium">{profile?.email}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Rôle</label>
            <p className="font-medium capitalize">{profile?.role}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Nom complet</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <Button onClick={handleSave}>Enregistrer</Button>
        </CardContent>
      </Card>
    </div>
  )
}
