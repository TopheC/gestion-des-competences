export function SkillMatrixFilters({ categories, members, filterCat, filterMember, filterMinLevel, onFilterChange }) {
  return (
    <div className="flex gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600 dark:text-gray-400">Catégorie :</label>
        <select
          className="border rounded px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-700"
          value={filterCat}
          onChange={(e) => onFilterChange('cat', e.target.value)}
        >
          <option value="all">Toutes</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600 dark:text-gray-400">Membre :</label>
        <select
          className="border rounded px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-700"
          value={filterMember}
          onChange={(e) => onFilterChange('member', e.target.value)}
        >
          <option value="all">Tous</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.full_name || m.email}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600 dark:text-gray-400">Niveau min. :</label>
        <select
          className="border rounded px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-700"
          value={filterMinLevel}
          onChange={(e) => onFilterChange('minLevel', Number(e.target.value))}
        >
          <option value={0}>Aucun</option>
          {[1, 2, 3, 4].map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>
    </div>
  )
}
