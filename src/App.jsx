import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ProtectedRoute, AdminRoute } from '@/components/ProtectedRoute'
import { Layout } from '@/components/Layout'
import { Toaster } from 'sonner'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { AcceptInvite } from '@/pages/AcceptInvite'
import { Dashboard } from '@/pages/Dashboard'
import { Members } from '@/pages/Members'
import { Skills } from '@/pages/Skills'
import { SkillMatrix } from '@/pages/SkillMatrix'
import { History } from '@/pages/History'
import { Profile } from '@/pages/Profile'

function AppLayout({ children }) {
  return (
    <Layout>{children}</Layout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
            <ProtectedRoute><AdminRoute><AppLayout><Members /></AppLayout></AdminRoute></ProtectedRoute>
          } />
          <Route path="/skills" element={
            <ProtectedRoute><AdminRoute><AppLayout><Skills /></AppLayout></AdminRoute></ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
