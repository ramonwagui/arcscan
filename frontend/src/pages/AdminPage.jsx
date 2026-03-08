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
            toast.error('Erro ao carregar dados')
        } finally {
            setLoading(false)
        }
    }

    if (user?.role !== 'superadmin') {
        return <Navigate to="/dashboard" replace />
    }

    // Handlers para Categorias
    const handleSaveCategory = async (e) => {
        e.preventDefault()
        try {
            if (editingCat) {
                await categoriesApi.update(editingCat.id, catForm)
                toast.success('Categoria atualizada')
            } else {
                await categoriesApi.create(catForm)
                toast.success('Categoria principal criada')
            }
            setShowCatForm(false)
            setEditingCat(null)
            loadData()
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erro ao salvar')
        }
    }

    const handleDeleteCategory = async (id) => {
        if (!confirm('Deseja realmente remover esta categoria?')) return
        try {
            await categoriesApi.delete(id)
            toast.success('Categoria removida')
            loadData()
        } catch (err) {
            toast.error('Erro ao remover categoria')
        }
    }

    // Handlers para Usuários
    const handleRoleChange = async (id, newRole) => {
        try {
            await usersApi.updateRole(id, newRole)
            toast.success(`Cargo atualizado para ${newRole}`)
            loadData()
        } catch (err) {
            toast.error('Erro ao atualizar cargo')
        }
    }

    const handleDeleteUser = async (id) => {
        if (!confirm('ATENÇÃO: Deseja realmente excluir este usuário permanentemente?')) return
        try {
            await usersApi.delete(id)
            toast.success('Usuário removido')
            loadData()
        } catch (err) {
            toast.error('Erro ao excluir usuário')
        }
    }

    return (
        <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white mb-1 flex items-center gap-2">
                        <Shield className="text-primary-500" />
                        Painel Administrativo
                    </h1>
                    <p className="text-slate-400">Controle total de categorias, acessos e usuários do sistema.</p>
                </div>
            </div>

            <div className="flex gap-2 p-1 bg-surface-800 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'categories' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <Tag size={16} /> Categorias
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'users' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <Users size={16} /> Usuários
                </button>
            </div>

            <div className="card">
                {activeTab === 'categories' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-white">Gerenciar Categorias</h3>
                            <button
                                onClick={() => {
                                    setCatForm({ slug: '', name: '', color: 'bg-slate-700/20 text-slate-300 border-slate-600/30' })
                                    setEditingCat(null)
                                    setShowCatForm(true)
                                }}
                                className="btn-primary text-sm"
                            >
                                <Plus size={16} /> Nova Categoria
                            </button>
                        </div>

                        {showCatForm && (
                            <form onSubmit={handleSaveCategory} className="bg-surface-800 p-4 rounded-xl border border-slate-700 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Nome de exibição</label>
                                        <input required value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} className="input text-sm w-full" placeholder="Ex: Contratos" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Slug (ID interno)</label>
                                        <input required disabled={!!editingCat} value={catForm.slug} onChange={e => setCatForm({ ...catForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })} className="input text-sm w-full disabled:opacity-50" placeholder="Ex: contratos" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Classes de Cor (Tailwind)</label>
                                        <input required value={catForm.color} onChange={e => setCatForm({ ...catForm, color: e.target.value })} className="input text-sm w-full" placeholder="Ex: bg-blue-500/10 text-blue-400" />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button type="button" onClick={() => setShowCatForm(false)} className="btn-ghost text-sm"><X size={16} /> Cancelar</button>
                                    <button type="submit" className="btn-primary text-sm"><Save size={16} /> Salvar Categoria</button>
                                </div>
                            </form>
                        )}

                        {loading ? (
                            <div className="py-8 text-center text-slate-500"><div className="w-8 h-8 spinner mx-auto" /></div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-700 text-slate-400 text-sm">
                                            <th className="py-3 px-4 font-medium">Nome</th>
                                            <th className="py-3 px-4 font-medium">Slug</th>
                                            <th className="py-3 px-4 font-medium">Preview</th>
                                            <th className="py-3 px-4 font-medium text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {categories.map(c => (
                                            <tr key={c.id} className="hover:bg-surface-800/30 transition-colors">
                                                <td className="py-3 px-4 text-slate-200">{c.name}</td>
                                                <td className="py-3 px-4 text-slate-400 font-mono text-xs">{c.slug}</td>
                                                <td className="py-3 px-4">
                                                    <span className={`badge ${c.color} border`}>{c.name}</span>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button title="Editar" onClick={() => { setEditingCat(c); setCatForm({ slug: c.slug, name: c.name, color: c.color }); setShowCatForm(true) }} className="p-1.5 text-slate-400 hover:text-white transition-colors"><Edit2 size={16} /></button>
                                                        <button title="Excluir" onClick={() => handleDeleteCategory(c.id)} className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
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
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h3 className="text-lg font-semibold text-white">Gerenciar Usuários e Acessos</h3>

                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    const email = e.target.email.value;
                                    if (!email) return;
                                    const btn = e.target.querySelector('button');
                                    btn.disabled = true;
                                    try {
                                        await usersApi.invite(email);
                                        toast.success('Convite enviado para ' + email);
                                        e.target.reset();
                                        loadData();
                                    } catch (err) {
                                        toast.error(err.response?.data?.error || 'Erro ao enviar convite');
                                    } finally {
                                        btn.disabled = false;
                                    }
                                }}
                                className="flex gap-2"
                            >
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="E-mail do novo usuário"
                                    className="input text-sm py-2 px-3 min-w-[220px]"
                                />
                                <button type="submit" className="btn-primary text-xs py-2 h-10 px-4 whitespace-nowrap">
                                    <Plus size={14} /> Convidar Usuário
                                </button>
                            </form>
                        </div>
                        <p className="text-sm text-slate-400 mb-4">Apenas superadmins podem ver esta área. O convidar enviará um e-mail para o usuário criar a senha.</p>

                        {loading ? (
                            <div className="py-8 text-center text-slate-500"><div className="w-8 h-8 spinner mx-auto" /></div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-700 text-slate-400 text-sm">
                                            <th className="py-3 px-4 font-medium">E-mail</th>
                                            <th className="py-3 px-4 font-medium">Cargo (Role)</th>
                                            <th className="py-3 px-4 font-medium">Data de Cadastro</th>
                                            <th className="py-3 px-4 font-medium text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {users.map(u => (
                                            <tr key={u.id} className="hover:bg-surface-800/30 transition-colors">
                                                <td className="py-3 px-4 text-slate-200 flex items-center gap-2">
                                                    {u.email}
                                                    {u.id === user.id && <span className="text-[10px] bg-primary-500/20 text-primary-400 px-1.5 py-0.5 rounded ml-2">Você</span>}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <select
                                                        value={u.role || 'user'}
                                                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                        disabled={u.id === user.id}
                                                        className="bg-surface-900 border border-slate-700 text-slate-300 text-sm rounded focus:ring-1 focus:ring-primary-500 disabled:opacity-50 p-1"
                                                    >
                                                        <option value="user">Usuário Comum</option>
                                                        <option value="superadmin">Super Admin</option>
                                                    </select>
                                                </td>
                                                <td className="py-3 px-4 text-slate-400 font-mono text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                                                <td className="py-3 px-4 text-right">
                                                    <button
                                                        title="Excluir Usuário"
                                                        disabled={u.id === user.id}
                                                        onClick={() => handleDeleteUser(u.id)}
                                                        className="p-1.5 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-30 disabled:hover:text-slate-400"
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
                    </div>
                )}
            </div>
        </div>
    )
}
