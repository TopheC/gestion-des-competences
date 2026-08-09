import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useMembers } from '@/hooks/useMembers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export function Profile() {
  const { profile } = useAuth()
  const { updateMember } = useMembers()
  const [name, setName] = useState(profile?.full_name || '')

  async function handleSave() {
    const { error } = await updateMember(profile.id, { full_name: name })
    if (error) {
      toast.error('Erreur lors de la mise à jour')
    } else {
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
            <label className="text-sm text-gray-600 dark:text-gray-400">Email</label>
            <p className="font-medium">{profile?.email}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400">Rôle</label>
            <p className="font-medium capitalize">{profile?.role}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400">Nom complet</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <Button onClick={handleSave}>Enregistrer</Button>
        </CardContent>
      </Card>
    </div>
  )
}
