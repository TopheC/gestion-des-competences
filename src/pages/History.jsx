import { useMembers } from '@/hooks/useMembers'
import { useSkills } from '@/hooks/useSkills'
import { useHistory } from '@/hooks/useHistory'
import { Card, CardContent } from '@/components/ui/card'
import { SkillLevelBadge } from '@/components/SkillLevelBadge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function History() {
  const { members } = useMembers()
  const { skills } = useSkills()
  const { history, loading, count, page, totalPages, filters, setFilter, nextPage, prevPage } = useHistory()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Historique des évolutions</h1>

      <div className="flex gap-4">
        <select
          className="border rounded px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-700"
          value={filters.memberId}
          onChange={(e) => setFilter('memberId', e.target.value)}
        >
          <option value="all">Tous les membres</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.full_name || m.email}</option>
          ))}
        </select>
        <select
          className="border rounded px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-700"
          value={filters.skillId}
          onChange={(e) => setFilter('skillId', e.target.value)}
        >
          <option value="all">Toutes les compétences</option>
          {skills.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-6 text-gray-400">Chargement...</p>
          ) : history.length === 0 ? (
            <p className="p-6 text-gray-400">Aucun historique</p>
          ) : (
            <ul className="divide-y dark:divide-gray-800">
              {history.map((h) => (
                <li key={h.id} className="p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Membre :</span>
                      {' '}<span className="font-medium">{h.member?.full_name || h.member_id?.slice(0, 8)}</span>
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Compétence :</span>
                      {' '}<span className="font-medium">{h.skill?.name}</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Par {h.changer?.full_name} — {new Date(h.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {h.old_level && <SkillLevelBadge level={h.old_level} />}
                    {h.old_level && <span className="text-gray-400">→</span>}
                    <SkillLevelBadge level={h.new_level} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>{count} entrées — Page {page + 1} / {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={prevPage} disabled={page === 0}>
              <ChevronLeft className="h-4 w-4" /> Précédent
            </Button>
            <Button variant="outline" size="sm" onClick={nextPage} disabled={page >= totalPages - 1}>
              Suivant <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
