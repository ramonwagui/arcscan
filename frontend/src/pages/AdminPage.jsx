import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Settings, Users, Tag, Shield, Save, X } from 'lucide-react'
import { usersApi, categoriesApi } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Navigate } from 'react-router-dom'

export default function AdminPage() {
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState('categories')
    const [categories, setCategories] = useState([])
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)

    // Form state para categorias
    const [showCatForm, setShowCatForm] = useState(false)
    const [editingCat, setEditingCat] = useState(null)
    const [catForm, setCatForm] = useState({ slug: '', name: '', color: 'bg-slate-700/20 text-slate-300 border-slate-600/30' })

    useEffect(() => {
        if (user?.role !== 'superadmin') return;
        loadData()
    }, [user, activeTab])

    const loadData = async () => {
        setLoading(true)
        try {
            if (activeTab === 'categories') {
                const data = await categoriesApi.list()
                setCategories(data)
            } else if (activeTab === 'users') {
                const data = await usersApi.list()
                setUsers(data)
            }
        } catch (err) {
            toast.error('Erro ao carregar dados críticos')
        } finally {
            setLoading(false)
        }
    }

    if (user?.role !== 'superadmin') {
        return <Navigate to="/dashboard" replace />
    }

    const handleSaveCategory = async (e) => {
        e.preventDefault()
        try {
            if (editingCat) {
                await categoriesApi.update(editingCat.id, catForm)
                toast.success('Categoria reestruturada')
            } else {
                await categoriesApi.create(catForm)
                toast.success('Nova categoria operacional ativa')
            }
            setShowCatForm(false)
            setEditingCat(null)
            loadData()
        } catch (err) {
            toast.error(err.response?.data?.error || 'Falha na gravação')
        }
    }

    const handleDeleteCategory = async (id) => {
        if (!confirm('Esta ação é irreversível. Confirmar exclusão?')) return
        try {
            await categoriesApi.delete(id)
            toast.success('Categoria removida do sistema')
            loadData()
        } catch (err) {
            toast.error('Erro ao remover registro')
        }
    }

    const handleRoleChange = async (id, newRole) => {
        try {
            await usersApi.updateRole(id, newRole)
            toast.success(`Nível de acesso elevado: ${newRole}`)
            loadData()
        } catch (err) {
            toast.error('Privilégios insuficientes para alteração')
        }
    }

    const handleDeleteUser = async (id) => {
        if (!confirm('ATENÇÃO: Este usuário perderá todo o acesso imediatamente. Confirmar?')) return
        try {
            await usersApi.delete(id)
            toast.success('Acesso revogado com sucesso')
            loadData()
        } catch (err) {
            toast.error('Erro ao excluir conta')
        }
    }

    return (
        <div className="max-w-[1100px] mx-auto space-y-10 animate-slide-up pb-20">
            {/* Admin Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
                            <Shield className="text-primary-500" size={20} />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">System Control</h1>
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] pl-[3.25rem]">Gestão Centralizada de Infraestrutura</p>
                </div>

                <div className="flex p-1 bg-slate-100 dark:bg-surface-800 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'categories' ? 'bg-white dark:bg-surface-900 text-primary-500 shadow-sm border border-slate-200 dark:border-slate-700' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                    >
                        <Tag size={14} strokeWidth={2.5} /> Categorias
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'users' ? 'bg-white dark:bg-surface-900 text-primary-500 shadow-sm border border-slate-200 dark:border-slate-700' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                    >
                        <Users size={14} strokeWidth={2.5} /> Usuários
                    </button>
                </div>
            </div>

            <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500/10 to-blue-500/10 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                <div className="relative bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl dark:shadow-none min-h-[500px]">
                    {activeTab === 'categories' && (
                        <div className="p-10 space-y-8">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-slate-100 dark:border-slate-800">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Arquitetura de Dados</h3>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Definição de categorias e rotulagem neural</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setCatForm({ slug: '', name: '', color: 'bg-slate-700/20 text-slate-300 border-slate-600/30' })
                                        setEditingCat(null)
                                        setShowCatForm(true)
                                    }}
                                    className="h-12 px-6 rounded-xl bg-primary-500 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                >
                                    <Plus size={16} strokeWidth={3} /> Gerar Nova Regra
                                </button>
                            </div>

                            {showCatForm && (
                                <form onSubmit={handleSaveCategory} className="bg-slate-50 dark:bg-surface-950/50 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800/60 animate-slide-up space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Rótulo de Exibição</label>
                                            <input required value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} className="w-full h-12 bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-xs font-bold focus:ring-2 focus:ring-primary-500 transition-all outline-none" placeholder="Ex: Financeiro" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Identificador Único (SLUG)</label>
                                            <input required disabled={!!editingCat} value={catForm.slug} onChange={e => setCatForm({ ...catForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })} className="w-full h-12 bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-xs font-bold focus:ring-2 focus:ring-primary-500 transition-all outline-none disabled:opacity-40" placeholder="ex-financeiro" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Assinatura Visual (CSS)</label>
                                            <input required value={catForm.color} onChange={e => setCatForm({ ...catForm, color: e.target.value })} className="w-full h-12 bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-xs font-bold focus:ring-2 focus:ring-primary-500 transition-all outline-none" placeholder="bg-blue-500/10 text-blue-500" />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-2">
                                        <button type="button" onClick={() => setShowCatForm(false)} className="h-11 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 dark:hover:bg-surface-800 transition-all">Descartar</button>
                                        <button type="submit" className="h-11 px-8 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                                            <Save size={14} /> Confirmar Registro
                                        </button>
                                    </div>
                                </form>
                            )}

                            {loading ? (
                                <div className="py-20 text-center"><div className="w-12 h-12 spinner mx-auto border-4 opacity-20" /></div>
                            ) : (
                                <div className="overflow-hidden border border-slate-100 dark:border-slate-800 rounded-[2rem]">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50 dark:bg-surface-950/40 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                                                <th className="py-5 px-8 font-black">Estrutura Operacional</th>
                                                <th className="py-5 px-8 font-black">Slug de Integração</th>
                                                <th className="py-5 px-8 font-black">Identidade Visual</th>
                                                <th className="py-5 px-8 font-black text-right">Controle</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                            {categories.map(c => (
                                                <tr key={c.id} className="group hover:bg-slate-50 dark:hover:bg-surface-800/30 transition-all">
                                                    <td className="py-5 px-8">
                                                        <span className="text-sm font-black text-slate-800 dark:text-white group-hover:text-primary-500 transition-colors uppercase tracking-tight">{c.name}</span>
                                                    </td>
                                                    <td className="py-5 px-8">
                                                        <code className="px-2 py-1 bg-slate-100 dark:bg-surface-800 rounded text-[10px] font-bold text-slate-500 font-mono tracking-tight">{c.slug}</code>
                                                    </td>
                                                    <td className="py-5 px-8">
                                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${c.color} border border-white dark:border-surface-950 shadow-sm`}>
                                                            Preview Mode
                                                        </span>
                                                    </td>
                                                    <td className="py-5 px-8 text-right">
                                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                title="Reestruturar"
                                                                onClick={() => { setEditingCat(c); setCatForm({ slug: c.slug, name: c.name, color: c.color }); setShowCatForm(true) }}
                                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-all"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button
                                                                title="Excluir"
                                                                onClick={() => handleDeleteCategory(c.id)}
                                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="p-10 space-y-8">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-slate-100 dark:border-slate-800">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Células de Acesso</h3>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Gestão de identidades e privilégios neurais</p>
                                </div>

                                <form
                                    onSubmit={async (e) => {
                                        e.preventDefault();
                                        const email = e.target.email.value;
                                        if (!email) return;
                                        const btn = e.target.querySelector('button');
                                        btn.disabled = true;
                                        try {
                                            await usersApi.invite(email);
                                            toast.success('Autorização expedida: ' + email);
                                            e.target.reset();
                                            loadData();
                                        } catch (err) {
                                            toast.error(err.response?.data?.error || 'Erro na autorização');
                                        } finally {
                                            btn.disabled = false;
                                        }
                                    }}
                                    className="flex gap-2 p-2 bg-slate-50 dark:bg-surface-950 border border-slate-100 dark:border-slate-800 rounded-2xl"
                                >
                                    <input
                                        name="email"
                                        type="email"
                                        required
                                        placeholder="E-mail funcional"
                                        className="bg-transparent border-none focus:ring-0 text-xs font-bold px-4 md:min-w-[280px]"
                                    />
                                    <button type="submit" className="h-10 px-6 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all">
                                        <Plus size={14} strokeWidth={3} /> Autorizar
                                    </button>
                                </form>
                            </div>

                            {loading ? (
                                <div className="py-20 text-center"><div className="w-12 h-12 spinner mx-auto border-4 opacity-20" /></div>
                            ) : (
                                <div className="overflow-hidden border border-slate-100 dark:border-slate-800 rounded-[2rem]">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50 dark:bg-surface-950/40 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                                                <th className="py-5 px-8 font-black">E-mail de Identificação</th>
                                                <th className="py-5 px-8 font-black">Classe de Nível</th>
                                                <th className="py-5 px-8 font-black">Integrado em</th>
                                                <th className="py-5 px-8 font-black text-right">Controle</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                            {users.map(u => (
                                                <tr key={u.id} className="group hover:bg-slate-50 dark:hover:bg-surface-800/30 transition-all">
                                                    <td className="py-5 px-8">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-surface-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] font-black uppercase text-slate-500">
                                                                {u.email.substring(0, 2)}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-black text-slate-800 dark:text-white tracking-tight">{u.email}</span>
                                                                {u.id === user.id && <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest">Identidade Atual</span>}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-5 px-8">
                                                        <select
                                                            value={u.role || 'user'}
                                                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                            disabled={u.id === user.id}
                                                            className="bg-transparent border-none focus:ring-0 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 p-0 cursor-pointer disabled:opacity-40"
                                                        >
                                                            <option value="user">USER_OPERATOR</option>
                                                            <option value="superadmin">SUPER_ADMIN</option>
                                                        </select>
                                                    </td>
                                                    <td className="py-5 px-8 text-[10px] font-bold text-slate-400 uppercase tracking-tight font-mono">
                                                        {new Date(u.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="py-5 px-8 text-right">
                                                        <button
                                                            title="Eliminar Acesso"
                                                            disabled={u.id === user.id}
                                                            onClick={() => handleDeleteUser(u.id)}
                                                            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all disabled:opacity-0"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            <div className="flex items-center gap-2 p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                                <Settings size={16} className="text-amber-500" />
                                <p className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest">Atenção: Modificações em níveis de acesso são registradas na trilha de auditoria global.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
