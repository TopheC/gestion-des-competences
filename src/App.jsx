import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ProtectedRoute, AdminRoute } from '@/components/layout/ProtectedRoute'
import { ErrorBoundary } from '@/components/layout/ErrorBoundary'
import { Layout } from '@/components/layout/Layout'
import { Toaster } from 'sonner'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { AcceptInvite } from '@/pages/AcceptInvite'
import { Dashboard } from '@/pages/Dashboard'
import { SkillMatrix } from '@/pages/SkillMatrix'
import { History } from '@/pages/History'
import { Profile } from '@/pages/Profile'

const Members = lazy(() => import('@/pages/Members').then(m => ({ default: m.Members })))
const Skills = lazy(() => import('@/pages/Skills').then(m => ({ default: m.Skills })))

function AppLayout({ children }) {
  return <Layout>{children}</Layout>
}

function SuspenseWrapper({ children }) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh] text-gray-400">Chargement...</div>}>
      {children}
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <Toaster />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/accept-invite" element={<AcceptInvite />} />

            <Route path="/" element={
              <ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>
            } />
            <Route path="/matrix" element={
              <ProtectedRoute><AppLayout><SkillMatrix /></AppLayout></ProtectedRoute>
            } />
            <Route path="/history" element={
              <ProtectedRoute><AppLayout><History /></AppLayout></ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>
            } />

            <Route path="/members" element={
              <ProtectedRoute><AdminRoute><AppLayout>
                <SuspenseWrapper><Members /></SuspenseWrapper>
              </AppLayout></AdminRoute></ProtectedRoute>
            } />
            <Route path="/skills" element={
              <ProtectedRoute><AdminRoute><AppLayout>
                <SuspenseWrapper><Skills /></SuspenseWrapper>
              </AppLayout></AdminRoute></ProtectedRoute>
            } />
          </Routes>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  )
}
