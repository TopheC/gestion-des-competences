import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const navItems = [
  { to: '/', label: 'Tableau de bord', icon: '📊' },
  { to: '/skills', label: 'Compétences', icon: '📚', admin: true },
  { to: '/members', label: 'Membres', icon: '👥', admin: true },
  { to: '/matrix', label: 'Matrice', icon: '📋' },
  { to: '/history', label: 'Historique', icon: '📜' },
]

export function Layout({ children }) {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-lg font-bold">Compétences</h1>
          <p className="text-xs text-gray-400">Équipe SysAdmin</p>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems
            .filter((item) => !item.admin || profile?.role === 'admin')
            .map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  location.pathname === item.to
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
        </nav>
        <div className="p-4 border-t border-gray-700">
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
                Mon profil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
      <main className="flex-1 bg-gray-50 p-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}
