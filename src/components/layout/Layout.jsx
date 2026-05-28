import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  LayoutDashboard, BookOpen, Users, Table2, History, Menu, X, Sun, Moon, LogOut, User,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import APP_VERSION from '../../../version?raw'

const navItems = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/skills', label: 'Compétences', icon: BookOpen, admin: true },
  { to: '/members', label: 'Membres', icon: Users, admin: true },
  { to: '/matrix', label: 'Matrice', icon: Table2 },
  { to: '/history', label: 'Historique', icon: History },
]

export function Layout({ children }) {
  const { profile, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const sidebar = (
    <aside className={`w-64 bg-gray-900 text-white flex flex-col shrink-0 ${sidebarOpen ? 'fixed inset-0 z-50' : 'hidden lg:flex'}`}>
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Compétences</h1>
          <p className="text-xs text-gray-400">Équipe SysAdmin</p>
        </div>
        <span className="text-[10px] text-gray-500 font-mono tracking-tight">
          v{APP_VERSION.trim()}
        </span>
        {sidebarOpen && (
          <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navItems
          .filter((item) => !item.admin || profile?.role === 'admin')
          .map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  location.pathname === item.to
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
      </nav>
      <div className="p-4 border-t border-gray-700 space-y-2">
        <button
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white w-full"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full flex items-center gap-2 text-gray-300 hover:text-white">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm truncate">{profile?.full_name || profile?.email}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User className="h-4 w-4 mr-2" />
              Mon profil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950 dark:text-gray-100">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      {sidebar}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden flex items-center justify-between p-4 border-b bg-white dark:bg-gray-900 dark:border-gray-800">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-700 dark:text-gray-300">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-bold text-sm">Compétences</span>
          <div className="w-5" />
        </div>
        <div className="p-4 md:p-8 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
