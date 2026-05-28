import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useCategories } from '@/hooks/useCategories'
import { useSkills } from '@/hooks/useSkills'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CategoryCard } from '@/components/features/skills/CategoryCard'
import { Search } from 'lucide-react'
import { toast } from 'sonner'

export function Skills() {
  const { categories, refetch: refetchCats } = useCategories()
  const { skills, refetch: refetchSkills } = useSkills()
  const [search, setSearch] = useState('')
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState('#3b82f6')
  const [editCat, setEditCat] = useState(null)
  const [newSkill, setNewSkill] = useState({ name: '', category_id: '' })
  const [catDialogOpen, setCatDialogOpen] = useState(false)
  const [skillDialogOpen, setSkillDialogOpen] = useState(false)

  async function saveCategory() {
    if (editCat) {
      const { error } = await supabase.from('categories').update({ name: newCatName, color: newCatColor }).eq('id', editCat)
      if (error) { toast.error(error.message); return }
    } else {
      const { error } = await supabase.from('categories').insert({ name: newCatName, color: newCatColor })
      if (error) { toast.error(error.message); return }
    }
    setCatDialogOpen(false)
    setEditCat(null)
    setNewCatName('')
    refetchCats()
    toast.success('Catégorie enregistrée')
  }

  async function deleteCategory(id) {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) toast.error(error.message)
    else { refetchCats(); toast.success('Catégorie supprimée') }
  }

  async function saveSkill() {
    const { error } = await supabase.from('skills').insert({ name: newSkill.name, category_id: newSkill.category_id })
    if (error) { toast.error(error.message); return }
    setSkillDialogOpen(false)
    setNewSkill({ name: '', category_id: '' })
    refetchSkills()
    toast.success('Compétence ajoutée')
  }

  function openEditCategory(cat) {
    setEditCat(cat.id)
    setNewCatName(cat.name)
    setNewCatColor(cat.color)
    setCatDialogOpen(true)
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
                  className="w-full border rounded-md px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          className="pl-10"
          placeholder="Rechercher une compétence..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {categories.map((cat) => {
        const catSkills = skills.filter((s) => s.category_id === cat.id && (!search || s.name.toLowerCase().includes(search.toLowerCase())))
        if (search && catSkills.length === 0) return null
        return (
          <CategoryCard
            key={cat.id}
            category={cat}
            skills={catSkills}
            onEdit={openEditCategory}
            onDelete={deleteCategory}
          />
        )
      })}
    </div>
  )
}
