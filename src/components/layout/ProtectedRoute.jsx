import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <div className="flex items-center justify-center min-h-screen">Chargement...</div>
  if (!user) return <Navigate to="/login" replace />

  return children
}

export function AdminRoute({ children }) {
  const { profile, loading } = useAuth()

  if (loading) return <div className="flex items-center justify-center min-h-screen">Chargement...</div>
  if (!profile || profile.role !== 'admin') return <Navigate to="/" replace />

  return children
}
