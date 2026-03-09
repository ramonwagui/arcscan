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

    const [showUserForm, setShowUserForm] = useState(false)
    const [editingUser, setEditingUser] = useState(null)
    const [userForm, setUserForm] = useState({ email: '', name: '', password: '', role: 'user' })

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

    const handleSaveUser = async (e) => {
        e.preventDefault()
        try {
            if (editingUser) {
                await usersApi.update(editingUser.id, {
                    name: userForm.name,
                    password: userForm.password || undefined,
                    role: userForm.role
                })
                toast.success('Usuário atualizado com sucesso')
            } else {
                await usersApi.create(userForm)
                toast.success('Novo usuário criado')
            }
            setShowUserForm(false)
            setEditingUser(null)
            loadData()
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erro ao processar usuário')
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
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Control</h1>
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] pl-[3.25rem]">Gestão Centralizada de Infraestrutura</p>
                </div>

                <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'categories' ? 'bg-white text-primary-500 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Tag size={14} strokeWidth={2.5} /> Categorias
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'users' ? 'bg-white text-primary-500 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Users size={14} strokeWidth={2.5} /> Usuários
                    </button>
                </div>
            </div>

            <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500/10 to-blue-500/10 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                <div className="relative bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl min-h-[500px]">
                    {activeTab === 'categories' && (
                        <div className="p-10 space-y-8">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-slate-100">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Arquitetura de Dados</h3>
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
                                <form onSubmit={handleSaveCategory} className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 animate-slide-up space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Rótulo de Exibição</label>
                                            <input required value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 text-xs font-bold focus:ring-2 focus:ring-primary-500 transition-all outline-none" placeholder="Ex: Financeiro" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Identificador Único (SLUG)</label>
                                            <input required disabled={!!editingCat} value={catForm.slug} onChange={e => setCatForm({ ...catForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })} className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 text-xs font-bold focus:ring-2 focus:ring-primary-500 transition-all outline-none disabled:opacity-40" placeholder="ex-financeiro" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Assinatura Visual (CSS)</label>
                                            <input required value={catForm.color} onChange={e => setCatForm({ ...catForm, color: e.target.value })} className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 text-xs font-bold focus:ring-2 focus:ring-primary-500 transition-all outline-none" placeholder="bg-blue-500/10 text-blue-500" />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-2">
                                        <button type="button" onClick={() => setShowCatForm(false)} className="h-11 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all">Descartar</button>
                                        <button type="submit" className="h-11 px-8 rounded-xl bg-primary-500 text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                                            <Save size={14} /> Confirmar Registro
                                        </button>
                                    </div>
                                </form>
                            )}

                            {loading ? (
                                <div className="py-20 text-center"><div className="w-12 h-12 spinner mx-auto border-4 opacity-20" /></div>
                            ) : (
                                <div className="overflow-hidden border border-slate-100 rounded-[2rem]">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                                                <th className="py-5 px-8 font-black">Estrutura Operacional</th>
                                                <th className="py-5 px-8 font-black">Slug de Integração</th>
                                                <th className="py-5 px-8 font-black">Identidade Visual</th>
                                                <th className="py-5 px-8 font-black text-right">Controle</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {categories.map(c => (
                                                <tr key={c.id} className="group hover:bg-slate-50 transition-all">
                                                    <td className="py-5 px-8">
                                                        <span className="text-sm font-black text-slate-800 group-hover:text-primary-500 transition-colors uppercase tracking-tight">{c.name}</span>
                                                    </td>
                                                    <td className="py-5 px-8">
                                                        <code className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-500 font-mono tracking-tight">{c.slug}</code>
                                                    </td>
                                                    <td className="py-5 px-8">
                                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${c.color} border border-white shadow-sm`}>
                                                            Preview Mode
                                                        </span>
                                                    </td>
                                                    <td className="py-5 px-8 text-right">
                                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                title="Reestruturar"
                                                                onClick={() => { setEditingCat(c); setCatForm({ slug: c.slug, name: c.name, color: c.color }); setShowCatForm(true) }}
                                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary-500 hover:bg-primary-50 transition-all"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button
                                                                title="Excluir"
                                                                onClick={() => handleDeleteCategory(c.id)}
                                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
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
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-slate-100">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Células de Acesso</h3>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Gestão de identidades e privilégios neurais</p>
                                </div>

                                <button
                                    onClick={() => {
                                        setUserForm({ email: '', name: '', password: '', role: 'user' })
                                        setEditingUser(null)
                                        setShowUserForm(true)
                                    }}
                                    className="h-12 px-6 rounded-xl bg-primary-500 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                >
                                    <Plus size={16} strokeWidth={3} /> Gerar Acesso
                                </button>
                            </div>

                            {showUserForm && (
                                <form onSubmit={handleSaveUser} className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 animate-slide-up space-y-6">
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-2">{editingUser ? 'Atualizar Identidade' : 'Registrar Novo Usuário'}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Assinatura Digital (E-mail)</label>
                                            <input required disabled={!!editingUser} type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 text-xs font-bold focus:ring-2 focus:ring-primary-500 transition-all outline-none disabled:opacity-50 disabled:bg-slate-100" placeholder="usuario@empresa.com" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Nome de Operador</label>
                                            <input required type="text" value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 text-xs font-bold focus:ring-2 focus:ring-primary-500 transition-all outline-none" placeholder="Ex: João Silva" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Chave de Segurança (Senha) {editingUser && <span className="text-slate-300 normal-case tracking-normal font-normal">- Opcional</span>}</label>
                                            <input required={!editingUser} type="text" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 text-xs font-bold focus:ring-2 focus:ring-primary-500 transition-all outline-none" placeholder={editingUser ? "Deixe em branco para não alterar" : "••••••••"} minLength={6} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Classe de Nível</label>
                                            <select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })} className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 transition-all outline-none uppercase tracking-widest">
                                                <option value="user">USER_OPERATOR</option>
                                                <option value="superadmin">SUPER_ADMIN</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-2">
                                        <button type="button" onClick={() => setShowUserForm(false)} className="h-11 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all">Descartar</button>
                                        <button type="submit" className="h-11 px-8 rounded-xl bg-primary-500 text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                                            <Save size={14} /> Registrar
                                        </button>
                                    </div>
                                </form>
                            )}

                            {loading ? (
                                <div className="py-20 text-center"><div className="w-12 h-12 spinner mx-auto border-4 opacity-20" /></div>
                            ) : (
                                <div className="overflow-hidden border border-slate-100 rounded-[2rem]">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                                                <th className="py-5 px-8 font-black">Operador</th>
                                                <th className="py-5 px-8 font-black">Nível</th>
                                                <th className="py-5 px-8 font-black">Registro</th>
                                                <th className="py-5 px-8 font-black text-right">Controles</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {users.map(u => (
                                                <tr key={u.id} className="group hover:bg-slate-50 transition-all">
                                                    <td className="py-5 px-8">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black uppercase text-slate-500">
                                                                {u.email.substring(0, 2)}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-black text-slate-900 tracking-tight">{u.raw_user_meta_data?.name || 'Desconhecido'}</span>
                                                                <span className="text-[10px] font-bold text-slate-500 tracking-tight">{u.email}</span>
                                                                {u.id === user.id && <span className="text-[9px] font-black text-primary-500 uppercase tracking-widest mt-0.5">Sessão Atual</span>}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-5 px-8">
                                                        <span className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest ${u.role === 'superadmin' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                                            {u.role || 'user'}
                                                        </span>
                                                    </td>
                                                    <td className="py-5 px-8 text-[10px] font-bold text-slate-400 uppercase tracking-tight font-mono">
                                                        {new Date(u.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="py-5 px-8 text-right">
                                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                title="Editar"
                                                                onClick={() => {
                                                                    setEditingUser(u)
                                                                    setUserForm({ email: u.email, name: u.raw_user_meta_data?.name || '', password: '', role: u.role || 'user' })
                                                                    setShowUserForm(true)
                                                                }}
                                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary-500 hover:bg-primary-50 transition-all"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button
                                                                title="Revogar Acesso"
                                                                disabled={u.id === user.id}
                                                                onClick={() => handleDeleteUser(u.id)}
                                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all disabled:opacity-0"
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
