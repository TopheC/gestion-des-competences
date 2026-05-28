import { lazy, Suspense, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useCategories } from '@/hooks/useCategories'
import { useSkills } from '@/hooks/useSkills'
import { useMembers } from '@/hooks/useMembers'
import { useSkillLevels } from '@/hooks/useSkillLevels'
import { SkillMatrixFilters } from '@/components/features/matrix/SkillMatrixFilters'
import { SkillMatrixTable } from '@/components/features/matrix/SkillMatrixTable'
import { SkillMemberForm } from '@/components/features/matrix/SkillMemberForm'
import { ViewSwitcher } from '@/components/features/matrix/ViewSwitcher'
import { ChartSkeleton } from '@/components/features/matrix/ChartCard'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const ScatterView = lazy(() => import('@/components/features/matrix/ScatterView'))
const TreemapView = lazy(() => import('@/components/features/matrix/TreemapView'))
const RadarView = lazy(() => import('@/components/features/matrix/RadarView'))
const BarChartView = lazy(() => import('@/components/features/matrix/BarChartView'))

const hideMemberViews = new Set(['bars'])
const showLevelLegendViews = new Set(['table'])

export function SkillMatrix() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const currentUserId = profile?.id
  const { categories } = useCategories()
  const { skills } = useSkills()
  const { members } = useMembers()
  const { levels, updateLevel } = useSkillLevels()

  const [searchParams, setSearchParams] = useSearchParams()
  const viewMode = searchParams.get('view') || 'table'

  const [filterCat, setFilterCat] = useState('all')
  const [filterMember, setFilterMember] = useState('all')
  const [filterMinLevel, setFilterMinLevel] = useState(0)
  const [editing, setEditing] = useState(null)

  function setViewMode(mode) {
    setSearchParams(mode === 'table' ? {} : { view: mode }, { replace: true })
  }

  function onFilterChange(key, value) {
    if (key === 'cat') setFilterCat(value)
    if (key === 'member') setFilterMember(value)
    if (key === 'minLevel') setFilterMinLevel(value)
  }

  const filteredSkills = filterCat === 'all'
    ? skills
    : skills.filter((s) => s.category_id === filterCat)

  const filteredMembers = filterMember === 'all'
    ? members
    : members.filter((m) => m.id === filterMember)

  const visibleMembers = filterMinLevel === 0
    ? filteredMembers
    : filteredMembers.filter((m) =>
        filteredSkills.some((s) => {
          const key = `${m.id}-${s.id}`
          return (levels[key]?.level || 0) >= filterMinLevel
        })
      )

  async function handleUpdate(memberId, skillId, newLevel) {
    await updateLevel(memberId, skillId, newLevel, profile.id)
    setEditing(null)
    toast.success('Niveau mis à jour')
  }

  function exportCSV() {
    const header = ['Compétence', ...visibleMembers.map((m) => m.full_name || m.email)].join(',')
    const rows = filteredSkills.map((s) => {
      const levelsRow = visibleMembers.map((m) => {
        const key = `${m.id}-${s.id}`
        return levels[key]?.level || ''
      })
      return [`"${s.name}"`, ...levelsRow].join(',')
    })
    const blob = new Blob(['\uFEFF' + header + '\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'matrice-competences.csv'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Fichier CSV téléchargé')
  }

  function navigateToView(mode, filters) {
    if (filters.cat !== undefined) setFilterCat(filters.cat)
    if (filters.member !== undefined) setFilterMember(filters.member)
    if (filters.minLevel !== undefined) setFilterMinLevel(filters.minLevel)
    setViewMode(mode)
  }

  const commonProps = {
    categories, skills, members, levels,
    isAdmin, currentUserId,
    filterCat, filterMember, filterMinLevel,
  }

  function renderView() {
    const lazyViews = {
      scatter: <ScatterView
        {...commonProps}
        filteredSkills={filteredSkills}
        onMemberSelect={(memberId) => navigateToView('table', { member: memberId })}
      />,
      treemap: <TreemapView
        {...commonProps}
        filteredSkills={filteredSkills}
        onCellClick={(catId, memberId) => navigateToView('table', { cat: catId, member: memberId })}
      />,
      radar: <RadarView {...commonProps} />,
      bars: <BarChartView
        {...commonProps}
        onBarClick={(catId, level) => navigateToView('table', { cat: catId, minLevel: level })}
      />,
    }

    if (lazyViews[viewMode]) {
      return (
        <div key={viewMode} className="animate-chart-fade">
          <Suspense fallback={<ChartSkeleton />}>
            {lazyViews[viewMode]}
          </Suspense>
        </div>
      )
    }

    if (filterMember !== 'all' && visibleMembers.length === 1) {
      return (
        <div key="form" className="animate-chart-slide">
          <SkillMemberForm
            member={visibleMembers[0]}
            categories={categories}
            skills={filteredSkills}
            levels={levels}
            isAdmin={isAdmin}
            currentUserId={currentUserId}
            onSave={(memberId, changes) => {
              Promise.all(changes.map((c) => updateLevel(memberId, c.skillId, c.newLevel, profile.id)))
                .then(() => toast.success('Compétences mises à jour'))
                .catch(() => toast.error('Erreur lors de la mise à jour'))
            }}
          />
        </div>
      )
    }

    return (
      <div key="table" className="animate-chart-fade">
        <SkillMatrixTable
          categories={categories}
          skills={filteredSkills}
          members={visibleMembers}
          levels={levels}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
          editing={editing}
          onEdit={setEditing}
          onUpdate={handleUpdate}
          onCancel={() => setEditing(null)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Matrice des compétences</h1>
        <div className="flex items-center gap-2">
          <ViewSwitcher active={viewMode} onChange={setViewMode} />
          <Button variant="outline" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
        </div>
      </div>

      <SkillMatrixFilters
        categories={categories}
        members={members}
        filterCat={filterCat}
        filterMember={filterMember}
        filterMinLevel={filterMinLevel}
        onFilterChange={onFilterChange}
        hideMember={hideMemberViews.has(viewMode)}
      />

      {showLevelLegendViews.has(viewMode) && (
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span><span className="inline-block w-3 h-3 rounded-full mr-1" style={{ background: 'var(--level-1)' }} /> Débutant</span>
          <span><span className="inline-block w-3 h-3 rounded-full mr-1" style={{ background: 'var(--level-2)' }} /> Intermédiaire</span>
          <span><span className="inline-block w-3 h-3 rounded-full mr-1" style={{ background: 'var(--level-3)' }} /> Avancé</span>
          <span><span className="inline-block w-3 h-3 rounded-full mr-1" style={{ background: 'var(--level-4)' }} /> Expert</span>
        </div>
      )}

      {renderView()}
    </div>
  )
}


