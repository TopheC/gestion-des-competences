import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { InviteUserModal } from '@/components/features/members/InviteUserModal'
import { Download } from 'lucide-react'
import { toast } from 'sonner'

export function Members() {
  const { profile } = useAuth()
  const [members, setMembers] = useState([])
  const [editMember, setEditMember] = useState(null)
  const [editName, setEditName] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('members').select('*').order('created_at', { ascending: false })
    if (data) setMembers(data)
  }

  async function updateMember() {
    const { error } = await supabase.from('members').update({ full_name: editName }).eq('id', editMember.id)
    if (error) { toast.error(error.message); return }
    setEditMember(null)
    load()
    toast.success('Membre mis à jour')
  }

  async function deleteMember(id) {
    if (!confirm('Supprimer ce membre ?')) return
    const { error } = await supabase.from('members').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    load()
    toast.success('Membre supprimé')
  }

  function exportCSV() {
    const header = 'Nom,Email,Rôle,Inscrit le\n'
    const rows = members.map((m) =>
      `"${m.full_name || ''}","${m.email}","${m.role}","${new Date(m.created_at).toLocaleDateString()}"`
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'membres.csv'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Fichier CSV téléchargé')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Membres</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <InviteUserModal />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Inscrit le</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.full_name || '—'}</TableCell>
                  <TableCell>{m.email}</TableCell>
                  <TableCell>
                    <Badge variant={m.role === 'admin' ? 'default' : 'secondary'}>
                      {m.role === 'admin' ? 'Admin' : 'Membre'}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(m.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="ghost" onClick={() => { setEditMember(m); setEditName(m.full_name) }}>✎</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Modifier le membre</DialogTitle></DialogHeader>
                          <div className="space-y-4">
                            <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                            <Button onClick={updateMember}>Enregistrer</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      {m.id !== profile?.id && (
                        <Button size="sm" variant="ghost" onClick={() => deleteMember(m.id)}>🗑</Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
