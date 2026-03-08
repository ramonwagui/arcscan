import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard, FileText, Search, Upload, LogOut,
    Menu, X, Building2, ChevronRight, Bell, Shield, Settings
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
        toast.success('Sessão encerrada com segurança')
        navigate('/login')
    }

    const initials = user?.name
        ? user.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
        : user?.email?.[0]?.toUpperCase() || 'U'

    return (
        <div className="min-h-screen flex bg-[#f8fafc] dark:bg-surface-950 transition-colors duration-500 font-sans selection:bg-primary-500/30">
            {/* Sidebar overlay (mobile) */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-md transition-opacity duration-300"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 h-full w-72 bg-white dark:bg-surface-900 border-r border-slate-200/60 dark:border-slate-800/40 z-50 flex flex-col
                transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
                ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
                lg:translate-x-0 lg:static lg:z-auto
            `}>
                {/* Brand Identity */}
                <div className="px-8 py-10 flex items-center gap-4">
                    <div className="relative group">
                        <div className="absolute -inset-1.5 bg-gradient-to-tr from-primary-600 to-blue-400 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-500" />
                        <div className="relative w-12 h-12 rounded-2xl bg-primary-500 flex items-center justify-center text-white shadow-xl shadow-primary-500/20">
                            <Search size={24} strokeWidth={3} className="group-hover:scale-110 transition-transform duration-500" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">Arcscan</h1>
                        <p className="text-[10px] font-black text-primary-500 uppercase tracking-[0.3em] mt-1.5 opacity-80">Neural Engine</p>
                    </div>
                </div>

                {/* Primary Navigation */}
                <nav className="flex-1 px-4 space-y-1.5 flex flex-col pt-2">
                    <p className="px-5 mb-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Sistemas Centrais</p>
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) =>
                                `sidebar-link group ${isActive ? 'active' : ''}`
                            }
                        >
                            <Icon size={18} strokeWidth={2.5} className="group-hover:rotate-6 transition-transform" />
                            <span className="tracking-tight">{label}</span>
                        </NavLink>
                    ))}

                    {user?.role === 'superadmin' && (
                        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800/50">
                            <p className="px-5 mb-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Nível de Comando</p>
                            <NavLink
                                to="/admin"
                                onClick={() => setSidebarOpen(false)}
                                className={({ isActive }) =>
                                    `sidebar-link group ${isActive ? 'active' : ''}`
                                }
                            >
                                <Shield size={18} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
                                <span className="tracking-tight">Configurações Base</span>
                            </NavLink>
                        </div>
                    )}
                </nav>

                {/* Secure Authentication Block */}
                <div className="p-6 mt-auto">
                    <div className="p-4 rounded-[1.5rem] bg-slate-50 dark:bg-surface-950 border border-slate-100 dark:border-slate-800/60 shadow-inner group/profile">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="absolute -inset-1 bg-primary-500 rounded-full blur-[2px] opacity-0 group-hover/profile:opacity-20 transition-opacity" />
                                <div className="relative w-10 h-10 rounded-xl bg-white dark:bg-surface-800 text-primary-500 flex items-center justify-center font-black border border-slate-200 dark:border-slate-700 text-xs shadow-sm">
                                    {initials}
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-black text-slate-900 dark:text-white truncate uppercase tracking-tighter">{user?.name || 'Administrador'}</p>
                                <div className="flex items-center gap-1 mt-0.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{user?.role === 'superadmin' ? 'Acesso Total' : 'Operador'}</p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="w-full mt-4 h-10 rounded-xl text-[10px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all duration-300 flex items-center justify-center gap-2 border border-rose-500/10"
                        >
                            <LogOut size={14} strokeWidth={3} />
                            Desconectar
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Application Interface */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                {/* Neural Header (Glassmorphism) */}
                <header className="h-20 lg:h-24 glass dark:bg-surface-950/60 border-b border-slate-200/50 dark:border-slate-800/30 flex items-center justify-between px-6 lg:px-12 sticky top-0 z-30 transition-all duration-300">
                    <div className="flex items-center gap-6 flex-1">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden w-11 h-11 rounded-xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shadow-sm active:scale-90 transition-all"
                        >
                            <Menu size={22} />
                        </button>

                        {/* Search Core Integration */}
                        <div className="hidden md:flex relative items-center max-w-lg w-full group">
                            <div className="absolute inset-0 bg-slate-100 dark:bg-surface-900 group-focus-within:bg-white dark:group-focus-within:bg-surface-800 rounded-2xl transition-all duration-300" />
                            <Search size={16} className="absolute left-5 text-slate-400 group-focus-within:text-primary-500 transition-colors z-10" strokeWidth={2.5} />
                            <input
                                type="text"
                                className="relative w-full bg-transparent border-none focus:ring-0 py-3 pl-14 pr-4 text-xs font-bold text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 z-10"
                                placeholder="Consultar base de dados, registros ou auditorias..."
                            />
                            <div className="absolute right-4 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-[9px] font-black text-slate-300 tracking-tighter z-10 cursor-default">
                                ⌘K
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 lg:gap-8">
                        <div className="flex items-center gap-2">
                            <button className="w-11 h-11 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-surface-800 transition-all relative flex items-center justify-center">
                                <Bell size={20} />
                                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary-500 rounded-full border-2 border-white dark:border-surface-950 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                            </button>

                            <button className="hidden sm:flex w-11 h-11 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-surface-800 transition-all items-center justify-center">
                                <Settings size={20} />
                            </button>
                        </div>

                        <div className="h-10 w-px bg-slate-200/60 dark:bg-slate-800/40 hidden sm:block" />

                        <NavLink
                            to="/upload"
                            className="h-12 px-6 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 hover:translate-y-[-2px] active:translate-y-0 transition-all flex items-center gap-3"
                        >
                            <Upload size={16} strokeWidth={3} />
                            <span className="hidden lg:block">Novo Registro</span>
                            <span className="lg:hidden">Upload</span>
                        </NavLink>
                    </div>
                </header>

                {/* Main Viewport */}
                <main className="flex-1 overflow-y-auto custom-scrollbar bg-transparent">
                    <div className="p-6 lg:p-12">
                        <div className="max-w-[1400px] mx-auto">
                            <Outlet />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
