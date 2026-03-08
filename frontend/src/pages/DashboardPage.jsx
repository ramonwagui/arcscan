import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Upload, Search, TrendingUp, Clock, FolderOpen, ChevronRight, Zap, CheckCircle, Shield } from 'lucide-react'
import { documentsApi, categoriesApi } from '../lib/api'
import { CATEGORIES, getCategoryInfo, formatDate } from '../lib/utils'
import { useAuth } from '../context/AuthContext'

function StatCard({ icon: Icon, label, value, trend, color, to }) {
    const content = (
        <div className="bg-white dark:bg-surface-900 p-6 rounded-[1.25rem] border border-slate-200 dark:border-slate-800 shadow-sm group hover:border-primary-500/30 transition-all duration-300">
            <div className="flex justify-between items-start">
                <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-tight">{label}</p>
                <div className={`${color} p-2.5 rounded-xl text-white shadow-lg shadow-current/20`}>
                    <Icon size={20} strokeWidth={2.5} />
                </div>
            </div>
            <div className="mt-5">
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{value}</h3>
                {trend && (
                    <p className={`text-[11px] font-bold mt-2 flex items-center gap-1 ${trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                        <TrendingUp size={12} strokeWidth={3} className={trend.startsWith('-') ? 'rotate-180' : ''} />
                        {trend} desde o último mês
                    </p>
                )}
            </div>
        </div>
    )

    return to ? <Link to={to}>{content}</Link> : content
}

export default function DashboardPage() {
    const { user } = useAuth()
    const [stats, setStats] = useState(null)
    const [recentDocs, setRecentDocs] = useState([])
    const [dbCategories, setDbCategories] = useState([])
    const [expiringDocs, setExpiringDocs] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            documentsApi.getStats().catch(() => ({ totalDocuments: 0, byCategory: {}, byStatus: {}, uploadedThisMonth: 0 })),
            documentsApi.list({ limit: 5 }).catch(() => ({ documents: [] })),
            categoriesApi.list().catch(() => []),
            documentsApi.getExpiring(30).catch(() => [])
        ]).then(([statsData, listData, catsData, expiringData]) => {
            setStats(statsData || { totalDocuments: 0, byCategory: {}, byStatus: {}, uploadedThisMonth: 0 })
            setRecentDocs(Array.isArray(listData?.documents) ? listData.documents : (Array.isArray(listData) ? listData : []))
            setDbCategories(Array.isArray(catsData) ? catsData : [])
            setExpiringDocs(Array.isArray(expiringData) ? expiringData : [])
        }).catch(err => {
            console.error('[DASHBOARD ERROR]', err)
        }).finally(() => {
            setLoading(false);
        })
    }, [])

    if (loading) {
        return (
            <div className="space-y-8 animate-fade-in px-2">
                <div className="skeleton h-10 w-48 mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-40" />)}
                </div>
            </div>
        )
    }

    const totalDocs = stats?.totalDocuments || 0
    const firstName = user?.name?.split(' ')[0] || 'Gestor'

    const approvalItems = [
        { label: 'Aprovados', count: stats?.byStatus?.approved || 0, color: 'bg-emerald-500', text: 'text-emerald-500' },
        { label: 'Pendentes', count: (stats?.byStatus?.pending || 0) + (stats?.byStatus?.reviewing || 0), color: 'bg-amber-500', text: 'text-amber-500' },
        { label: 'Rejeitados', count: stats?.byStatus?.rejected || 0, color: 'bg-rose-500', text: 'text-rose-500' },
    ];

    return (
        <div className="space-y-10 animate-slide-up pb-12">
            {/* Greeting Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                        Dashboard <span className="text-primary-500">Executiva</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-3 uppercase tracking-widest">
                        Bem-vindo de volta, {firstName}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden lg:flex flex-col items-end mr-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Última Atualização</p>
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-200">Há poucos segundos</p>
                    </div>
                    <Link to="/upload" className="btn-primary">
                        <Zap size={18} fill="currentColor" />
                        Nova Captura
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={FileText}
                    label="Total Processado"
                    value={totalDocs?.toLocaleString()}
                    trend="+12.5%"
                    color="bg-primary-500"
                    to="/documents"
                />
                <StatCard
                    icon={Zap}
                    label="Taxa de Precisão"
                    value="99.2%"
                    trend="+2.1%"
                    color="bg-emerald-500"
                />
                <StatCard
                    icon={Clock}
                    label="Tempo Médio"
                    value="14.2m"
                    trend="-0.5%"
                    color="bg-amber-500"
                />
                <StatCard
                    icon={TrendingUp}
                    label="Envios do Mês"
                    value={stats?.uploadedThisMonth || 0}
                    color="bg-violet-500"
                />
            </div>

            {/* Main Charts area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Approval Pipeline */}
                <div className="lg:col-span-1 bg-white dark:bg-surface-900 p-8 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    <div className="relative z-10">
                        <h4 className="font-black text-xl text-slate-900 dark:text-white mb-2">Fila de Aprovação</h4>
                        <p className="text-slate-500 text-sm font-bold mb-8 uppercase tracking-tight">Status atual dos documentos</p>

                        <div className="space-y-8">
                            {approvalItems.map(item => {
                                const pct = totalDocs ? Math.round((item.count / totalDocs) * 100) : 0;
                                return (
                                    <div key={item.label}>
                                        <div className="flex justify-between items-center mb-2.5">
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{item.label}</span>
                                            <span className={`text-sm font-black ${item.text}`}>{item.count} ({pct}%)</span>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-surface-950 h-3 rounded-full overflow-hidden">
                                            <div className={`${item.color} h-full rounded-full shadow-[0_0_12px_rgba(0,0,0,0.1)] transition-all duration-1000`} style={{ width: `${pct}%` }}></div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Eficácia</p>
                                <p className="text-lg font-black text-slate-900 dark:text-white">99.2%</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">SLA</p>
                                <p className="text-lg font-black text-slate-900 dark:text-white">12h</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Manual</p>
                                <p className="text-lg font-black text-slate-900 dark:text-white">5.8%</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Documents with Thumbnails style */}
                <div className="lg:col-span-2 bg-white dark:bg-surface-900 p-8 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h4 className="font-black text-xl text-slate-900 dark:text-white">Capas Recentes</h4>
                            <p className="text-slate-500 text-sm font-bold uppercase tracking-tight">Últimas entradas no sistema</p>
                        </div>
                        <Link to="/documents" className="text-primary-500 text-xs font-black uppercase tracking-widest hover:underline flex items-center gap-1">
                            Ver Acervo <ChevronRight size={14} />
                        </Link>
                    </div>

                    {recentDocs.length === 0 ? (
                        <div className="py-20 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                            <FolderOpen size={40} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                            <p className="text-slate-400 font-bold">Nenhum registro ainda</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {recentDocs.slice(0, 4).map(doc => {
                                const cat = getCategoryInfo(doc.category, dbCategories)
                                return (
                                    <Link
                                        key={doc.id}
                                        to={`/documents/${doc.id}`}
                                        className="group p-4 bg-slate-50 dark:bg-surface-950 border border-slate-100 dark:border-slate-800 rounded-[1.25rem] hover:border-primary-500/30 transition-all duration-300 flex gap-4"
                                    >
                                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl ${cat.bg} border border-white dark:border-slate-800 shadow-sm transition-transform group-hover:scale-105`}>
                                            {doc.thumbnail_path ? (
                                                <img src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/documents/${doc.thumbnail_path}`} alt="" className="w-full h-full object-cover rounded-xl" />
                                            ) : cat.icon}
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <p className="text-sm font-black text-slate-900 dark:text-white truncate group-hover:text-primary-500 transition-colors uppercase tracking-tight">{doc.title}</p>
                                            <p className="text-[10px] font-bold text-slate-400 mt-0.5">{cat.label} • {formatDate(doc.created_at)}</p>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Section: System Events & Expiring */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* System Events */}
                <div className="xl:col-span-2 bg-white dark:bg-surface-900 p-8 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h4 className="font-black text-xl text-slate-900 dark:text-white">Eventos do Sistema</h4>
                        <button className="text-primary-500 text-[10px] font-black uppercase tracking-widest hover:underline px-3 py-1 bg-primary-50 dark:bg-primary-500/10 rounded-full">Limpar Logs</button>
                    </div>
                    <div className="space-y-4">
                        {[
                            { title: 'IA: Extração Concluída', desc: 'Metadados extraídos com 98% de confiança para Doc #442.', time: '2 mins atrás', icon: Zap, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' },
                            { title: 'Organização Atualizada', desc: 'Alteração nos parâmetros de visualização de marca d\'água.', time: '1h atrás', icon: Shield, color: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10' },
                            { title: 'Alerta de Armazenamento', desc: 'Cota mensal de processamento atingiu 85%.', time: '3h atrás', icon: CheckCircle, color: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' }
                        ].map((event, i) => (
                            <div key={i} className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-surface-950 border border-slate-100 dark:border-slate-800 hover:translate-x-1 transition-transform cursor-pointer">
                                <div className={`p-2.5 rounded-xl ${event.color} h-fit`}>
                                    <event.icon size={18} strokeWidth={2.5} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{event.title}</p>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">{event.time}</span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">{event.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Expiring Soon */}
                <div className="bg-white dark:bg-surface-900 p-8 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h4 className="font-black text-xl text-slate-900 dark:text-white mb-2">Próximos Vencimentos</h4>
                    <p className="text-slate-500 text-sm font-bold mb-8 uppercase tracking-tight">Atenção aos prazos</p>

                    {expiringDocs.length === 0 ? (
                        <div className="py-12 text-center bg-slate-50 dark:bg-surface-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <TrendingUp size={30} className="mx-auto text-slate-200 dark:text-slate-800 mb-2" />
                            <p className="text-xs font-bold text-slate-400">Nenhum documento expirando em 30 dias</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {expiringDocs.slice(0, 3).map(doc => {
                                const expDate = new Date(doc.expires_at)
                                const days = Math.ceil((expDate - new Date()) / (1000 * 60 * 60 * 24))
                                return (
                                    <Link key={doc.id} to={`/documents/${doc.id}`} className="block group">
                                        <div className={`p-4 rounded-2xl border-l-[6px] transition-all duration-300 ${days <= 7 ? 'bg-rose-50 dark:bg-rose-500/5 border-rose-500 shadow-sm' : 'bg-amber-50 dark:bg-amber-500/5 border-amber-500'}`}>
                                            <div className="flex justify-between items-start">
                                                <p className={`text-xs font-black uppercase tracking-tight ${days <= 7 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                                    {doc.title}
                                                </p>
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${days <= 7 ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'}`}>
                                                    {days <= 0 ? 'Expirado' : `${days} d`}
                                                </span>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-2">Validade: {expDate.toLocaleDateString()}</p>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    )}

                    <button className="w-full mt-8 py-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-surface-950 transition-all">
                        Ver Todos os Alertas
                    </button>
                </div>
            </div>
        </div>
    )
}
