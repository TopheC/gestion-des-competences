/* eslint-disable react-refresh/only-export-components */
import { Card } from '@/components/ui/card'

const tooltipBaseStyle = {
  background: 'var(--background)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  fontSize: 13,
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
}

export function ChartCard({ children, className }) {
  return (
    <Card className={`overflow-hidden animate-chart-fade ${className || ''}`}>
      <div className="p-4 sm:p-5">
        {children}
      </div>
    </Card>
  )
}

export function EmptyState({ message = 'Aucune donnée à afficher' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <svg className="w-10 h-10 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <p className="text-sm">{message}</p>
    </div>
  )
}

export function ChartSkeleton({ height = 400 }) {
  return (
    <div className="p-4 animate-pulse">
      <div className="flex gap-2 mb-4">
        <div className="h-3 w-20 rounded bg-muted" />
        <div className="h-3 w-16 rounded bg-muted" />
      </div>
      <div
        className="rounded-lg bg-muted/60"
        style={{ height }}
      />
    </div>
  )
}

export { tooltipBaseStyle }
