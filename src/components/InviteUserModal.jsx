import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'

export function InviteUserModal() {
  const [email, setEmail] = useState('')
  const [open, setOpen] = useState(false)
  const [link, setLink] = useState('')

  async function handleInvite() {
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const { error } = await supabase.from('invitations').insert({
      email,
      token,
      expires_at: expiresAt,
    })

    if (error) {
      toast.error("Erreur lors de l'invitation")
      return
    }

    const inviteLink = `${window.location.origin}/accept-invite?token=${token}`
    setLink(inviteLink)
    toast.success('Invitation créée')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Inviter un membre</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Inviter un membre</DialogTitle>
        </DialogHeader>
        {!link ? (
          <div className="space-y-4">
            <Input
              type="email"
              placeholder="Email du membre"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button onClick={handleInvite}>Envoyer l'invitation</Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Lien d'invitation (à partager) :</p>
            <Input readOnly value={link} onClick={(e) => e.target.select()} />
            <Button onClick={() => { navigator.clipboard.writeText(link); toast.success('Copié !') }}>
              Copier le lien
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
