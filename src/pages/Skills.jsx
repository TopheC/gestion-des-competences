import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'

export function Skills() {
  const [categories, setCategories] = useState([])
  const [skills, setSkills] = useState([])
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState('#3b82f6')
  const [editCat, setEditCat] = useState(null)
  const [newSkill, setNewSkill] = useState({ name: '', category_id: '' })
  const [catDialogOpen, setCatDialogOpen] = useState(false)
  const [skillDialogOpen, setSkillDialogOpen] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const [catRes, skillRes] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('skills').select('*, category:category_id(name)').order('name'),
    ])
    if (catRes.data) setCategories(catRes.data)
    if (skillRes.data) setSkills(skillRes.data)
  }

  async function saveCategory() {
    if (editCat) {
      await supabase.from('categories').update({ name: newCatName, color: newCatColor }).eq('id', editCat)
    } else {
      await supabase.from('categories').insert({ name: newCatName, color: newCatColor })
    }
    setCatDialogOpen(false)
    setEditCat(null)
    setNewCatName('')
    load()
    toast.success('Catégorie enregistrée')
  }

  async function deleteCategory(id) {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) toast.error(error.message)
    else { load(); toast.success('Catégorie supprimée') }
  }

  async function saveSkill() {
    await supabase.from('skills').insert({ name: newSkill.name, category_id: newSkill.category_id })
    setSkillDialogOpen(false)
    setNewSkill({ name: '', category_id: '' })
    load()
    toast.success('Compétence ajoutée')
  }

  async function deleteSkill(id) {
    await supabase.from('skills').delete().eq('id', id)
    load()
    toast.success('Compétence supprimée')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Compétences</h1>
        <div className="flex gap-2">
          <Dialog open={skillDialogOpen} onOpenChange={setSkillDialogOpen}>
            <DialogTrigger asChild><Button>+ Compétence</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nouvelle compétence</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Nom" value={newSkill.name} onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })} />
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={newSkill.category_id}
                  onChange={(e) => setNewSkill({ ...newSkill, category_id: e.target.value })}
                >
                  <option value="">Choisir une catégorie</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <Button onClick={saveSkill}>Ajouter</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={catDialogOpen} onOpenChange={(o) => { setCatDialogOpen(o); if (!o) setEditCat(null) }}>
            <DialogTrigger asChild><Button variant="outline">+ Catégorie</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editCat ? 'Modifier' : 'Nouvelle'} catégorie</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Nom" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
                <Input type="color" value={newCatColor} onChange={(e) => setNewCatColor(e.target.value)} />
                <Button onClick={saveCategory}>{editCat ? 'Modifier' : 'Créer'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {categories.map((cat) => {
        const catSkills = skills.filter((s) => s.category_id === cat.id)
        return (
          <Card key={cat.id}>
            <CardHeader className="flex flex-row items-center justify-between py-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                {cat.name}
                <Badge variant="secondary" className="ml-2">{catSkills.length}</Badge>
              </CardTitle>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => {
                  setEditCat(cat.id)
                  setNewCatName(cat.name)
                  setNewCatColor(cat.color)
                  setCatDialogOpen(true)
                }}>✎</Button>
                <Button size="sm" variant="ghost" onClick={() => deleteCategory(cat.id)}>🗑</Button>
              </div>
            </CardHeader>
            <CardContent>
              {catSkills.length === 0 ? (
                <p className="text-sm text-gray-400">Aucune compétence dans cette catégorie</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {catSkills.map((s) => (
                    <Badge key={s.id} variant="outline" className="pr-1">
                      {s.name}
                      <button className="ml-1 text-gray-400 hover:text-red-500" onClick={() => deleteSkill(s.id)}>×</button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
