import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard, FileText, Search, Upload, LogOut,
    Menu, X, Building2, ChevronRight, Bell
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/documents', icon: FileText, label: 'Documentos' },
    { to: '/search', icon: Search, label: 'Busca' },
    { to: '/upload', icon: Upload, label: 'Upload' },
]

export default function Layout() {
    const { user, signOut, isMockMode } = useAuth()
    const navigate = useNavigate()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const handleSignOut = async () => {
        await signOut()
        toast.success('Sessão encerrada')
        navigate('/login')
    }

    const initials = user?.name
        ? user.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
        : user?.email?.[0]?.toUpperCase() || 'U'

    return (
        <div className="min-h-screen flex bg-surface-900">
            {/* Sidebar overlay (mobile) */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed top-0 left-0 h-full w-64 bg-surface-950 border-r border-slate-800 z-40 flex flex-col
        transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}
                style={{ background: 'linear-gradient(180deg, #0a0f1e 0%, #0f172a 100%)' }}>

                {/* Logo */}
                <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800/60">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center glow-primary">
                            <Search size={18} className="text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-white text-base leading-tight tracking-tight">DocSearch</h1>
                            <p className="text-xs text-slate-500">Gestão Documental</p>
                        </div>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden btn-ghost p-1.5">
                        <X size={18} />
                    </button>
                </div>

                {/* Mock mode banner */}
                {isMockMode && (
                    <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                        <p className="text-amber-400 text-xs font-medium">⚡ Modo demonstração</p>
                        <p className="text-amber-500/70 text-xs">Dados fictícios para teste</p>
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 mb-2">Menu</p>
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) =>
                                `sidebar-link ${isActive ? 'active' : ''}`
                            }
                        >
                            <Icon size={18} />
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* User info */}
                <div className="px-3 py-4 border-t border-slate-800/60">
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-800/50">
                        <div className="w-8 h-8 rounded-lg bg-primary-600/80 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">{initials}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-200 truncate">{user?.name || 'Usuário'}</p>
                            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="sidebar-link w-full mt-1 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                        <LogOut size={16} />
                        <span>Sair</span>
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top bar */}
                <header className="h-16 bg-surface-900/80 backdrop-blur-sm border-b border-slate-800/60 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden btn-ghost p-2"
                        >
                            <Menu size={20} />
                        </button>
                        <div className="hidden lg:flex items-center gap-1.5 text-sm text-slate-500">
                            <Building2 size={14} />
                            <span>{user?.organization || 'Organização'}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="btn-ghost p-2 relative">
                            <Bell size={18} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full" />
                        </button>
                        <NavLink to="/upload" className="btn-primary text-sm py-2 hidden sm:flex">
                            <Upload size={15} />
                            Enviar Documento
                        </NavLink>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-auto p-4 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
