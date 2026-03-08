import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Upload, Search, TrendingUp, Clock, FolderOpen, ChevronRight, Zap, CheckCircle } from 'lucide-react'
import { documentsApi, categoriesApi } from '../lib/api'
import { CATEGORIES, getCategoryInfo, formatDate } from '../lib/utils'
import { useAuth } from '../context/AuthContext'

function StatCard({ icon: Icon, label, value, sub, color, to }) {
    const content = (
        <div className={`card-hover group`}>
            <div className="flex items-start justify-between">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon size={20} className="text-white" />
                </div>
                {to && <ChevronRight size={16} className="text-slate-600 group-hover:text-primary-400 transition-colors mt-1" />}
            </div>
            <div className="mt-4">
                <p className="text-3xl font-bold text-white">{value}</p>
                <p className="text-slate-400 text-sm font-medium mt-0.5">{label}</p>
                {sub && <p className="text-slate-600 text-xs mt-1">{sub}</p>}
            </div>
        </div>
    )

    return to ? <Link to={to}>{content}</Link> : content
}

function CategoryBar({ category, count, total, customList }) {
    const info = getCategoryInfo(category, customList)
    const pct = total ? Math.round((count / total) * 100) : 0

    return (
        <div className="flex items-center gap-3">
            <span className="text-lg w-6 flex-shrink-0">{info.icon}</span>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-300 truncate">{info.label}</span>
                    <span className="text-xs text-slate-500 font-mono ml-2">{count}</span>
                </div>
                <div className="h-1.5 bg-surface-900 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary-600 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                    />
                </div>
            </div>
            <span className="text-xs text-slate-600 w-8 text-right">{pct}%</span>
        </div>
    )
}

export default function DashboardPage() {
    const { user } = useAuth()
    const [stats, setStats] = useState(null)
    const [recentDocs, setRecentDocs] = useState([])
    const [dbCategories, setDbCategories] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            documentsApi.getStats(),
            documentsApi.list({ limit: 5 }),
            categoriesApi.list(),
        ]).then(([statsData, listData, catsData]) => {
            setStats(statsData)
            setRecentDocs(listData.documents || [])
            setDbCategories(catsData)
        }).catch(console.error).finally(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="skeleton h-8 w-64 mb-2" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
                </div>
            </div>
        )
    }

    const totalDocs = stats?.totalDocuments || 0
    const byCategory = stats?.byCategory || {}

    const firstName = user?.name?.split(' ')[0] || 'Usuário'

    return (
        <div className="space-y-6 animate-slide-up">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        Olá, {firstName}! 👋
                    </h1>
                    <p className="text-slate-400 text-sm mt-0.5">
                        Visão geral do seu acervo documental
                    </p>
                </div>
                <Link to="/upload" className="btn-primary self-start">
                    <Upload size={16} />
                    Enviar Documento
                </Link>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={FileText}
                    label="Total de Documentos"
                    value={totalDocs}
                    sub="em seu acervo"
                    color="bg-primary-600"
                    to="/documents"
                />
                <StatCard
                    icon={CheckCircle}
                    label="Aprovados"
                    value={stats?.byStatus?.approved || 0}
                    sub="verificados"
                    color="bg-emerald-600"
                />
                <StatCard
                    icon={Clock}
                    label="Pendentes"
                    value={(stats?.byStatus?.pending || 0) + (stats?.byStatus?.reviewing || 0)}
                    sub="aguardando revisão"
                    color="bg-amber-600"
                />
                <StatCard
                    icon={TrendingUp}
                    label="Enviados este mês"
                    value={stats?.uploadedThisMonth || 0}
                    sub="em 2024"
                    color="bg-violet-600"
                />
            </div>

            {/* Bottom grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Approval & Categories */}
                <div className="space-y-6 lg:col-span-1">
                    {/* Approval Breakdown */}
                    <div className="card">
                        <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                            <CheckCircle size={16} className="text-primary-400" />
                            Status de Aprovação
                        </h2>
                        <div className="space-y-4">
                            {[
                                { label: 'Aprovados', count: stats?.byStatus?.approved || 0, color: 'bg-emerald-500' },
                                { label: 'Em Revisão', count: stats?.byStatus?.reviewing || 0, color: 'bg-amber-500' },
                                { label: 'Pendentes', count: stats?.byStatus?.pending || 0, color: 'bg-slate-500' },
                                { label: 'Rejeitados', count: stats?.byStatus?.rejected || 0, color: 'bg-red-500' },
                            ].map(item => {
                                const pct = totalDocs ? Math.round((item.count / totalDocs) * 100) : 0;
                                return (
                                    <div key={item.label}>
                                        <div className="flex items-center justify-between text-xs mb-1.5">
                                            <span className="text-slate-400 font-medium">{item.label}</span>
                                            <span className="text-white font-bold">{item.count} <span className="text-slate-500 font-normal">({pct}%)</span></span>
                                        </div>
                                        <div className="h-1.5 bg-surface-900 rounded-full overflow-hidden">
                                            <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Categories breakdown */}
                    <div className="card">
                        <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                            <FolderOpen size={16} className="text-primary-400" />
                            Por Categoria
                        </h2>
                        {totalDocs === 0 ? (
                            <p className="text-slate-500 text-sm text-center py-8">Nenhum documento ainda</p>
                        ) : (
                            <div className="space-y-3">
                                {dbCategories.map(cat => {
                                    const count = byCategory[cat.slug] || 0
                                    if (count === 0) return null
                                    return (
                                        <CategoryBar key={cat.slug} category={cat.slug} count={count} total={totalDocs} customList={dbCategories} />
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent documents */}
                <div className="card lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold text-white flex items-center gap-2">
                            <Clock size={16} className="text-primary-400" />
                            Documentos Recentes
                        </h2>
                        <Link to="/documents" className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 font-medium">
                            Ver todos <ChevronRight size={14} />
                        </Link>
                    </div>

                    {recentDocs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-surface-700 flex items-center justify-center mb-4">
                                <Upload size={22} className="text-slate-500" />
                            </div>
                            <p className="text-slate-400 font-medium">Nenhum documento ainda</p>
                            <p className="text-slate-600 text-sm mt-1">Faça upload do seu primeiro documento!</p>
                            <Link to="/upload" className="btn-primary mt-4 text-sm">
                                <Upload size={14} />
                                Enviar agora
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {recentDocs.map(doc => {
                                const cat = getCategoryInfo(doc.category, dbCategories)
                                return (
                                    <Link
                                        key={doc.id}
                                        to={`/documents/${doc.id}`}
                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-700/50 transition-colors group"
                                    >
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cat.bg} ${cat.border} border`}>
                                            <span className="text-base">{cat.icon}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-200 truncate group-hover:text-white">{doc.title}</p>
                                            <p className="text-xs text-slate-500">{formatDate(doc.created_at)}</p>
                                        </div>
                                        <div className={`badge ${cat.bg} ${cat.color} ${cat.border} border hidden sm:flex`}>
                                            {cat.label}
                                        </div>
                                        <ChevronRight size={14} className="text-slate-600 group-hover:text-primary-400 flex-shrink-0 transition-colors" />
                                    </Link>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { to: '/upload', icon: Upload, label: 'Enviar documento', desc: 'Upload de PDF, JPG ou PNG', color: 'hover:border-primary-500/50' },
                    { to: '/search', icon: Search, label: 'Buscar documentos', desc: 'Pesquisa por palavras-chave', color: 'hover:border-emerald-500/50' },
                    { to: '/documents', icon: FileText, label: 'Ver acervo completo', desc: 'Explorar todos os documentos', color: 'hover:border-violet-500/50' },
                ].map(item => (
                    <Link key={item.to} to={item.to} className={`card ${item.color} border group`}>
                        <item.icon size={20} className="text-primary-400 group-hover:scale-110 transition-transform" />
                        <p className="text-sm font-semibold text-white mt-3">{item.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                    </Link>
                ))}
            </div>
        </div>
    )
}
