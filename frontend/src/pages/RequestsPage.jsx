import React, { useState, useEffect } from 'react'
import {
    Send, Plus, Search, Filter, MoreVertical,
    Calendar, Mail, Link as LinkIcon, Trash2,
    CheckCircle2, Clock, AlertCircle, X, FilePlus
} from 'lucide-react'
import { docRequestsApi, categoriesApi } from '../lib/api'
import { formatDate } from '../lib/utils'
import toast from 'react-hot-toast'

export default function RequestsPage() {
    const [requests, setRequests] = useState([]) // Ideally would have a list endpoint
    const [categories, setCategories] = useState([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [expandedRows, setExpandedRows] = useState([])

    const toggleRow = (id) => {
        setExpandedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id])
    }

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        emails: ''
    })

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [cats, reqs] = await Promise.all([
                    categoriesApi.list(),
                    docRequestsApi.list()
                ])
                setCategories(cats)
                setRequests(reqs)
            } catch (err) {
                console.error(err)
            }
        }
        loadInitialData()
    }, [])

    const handleCreate = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const payload = {
                ...formData,
                emails: formData.emails.split(',').map(e => e.trim()).filter(Boolean)
            }

            const res = await docRequestsApi.create(payload)
            toast.success('Solicitação criada e e-mails enviados!')

            // For MVP we just add to local state since there's no DB persistence yet
            setRequests(prev => [{
                ...payload,
                id: res.token,
                createdAt: new Date(),
                status: 'pending'
            }, ...prev])

            setIsModalOpen(false)
            setFormData({ title: '', description: '', category: '', emails: '' })
        } catch (error) {
            toast.error('Falha ao criar solicitação.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-slide-up pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Solicitações de Envio</h1>
                    <p className="text-slate-500 mt-1 text-lg">Gerencie links seguros para recebimento de documentos externos.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-2 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    <Plus className="w-5 h-5 text-indigo-100" />
                    Nova Solicitação
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Aguardando Envio', value: requests.filter(r => r.status === 'pending').length, color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock },
                    { label: 'Concluídos hoje', value: requests.filter(r => r.status === 'completed' && r.completedAt && new Date(r.completedAt).toDateString() === new Date().toDateString()).length, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 },
                    { label: 'Links Ativos', value: requests.filter(r => r.status === 'pending' && new Date(r.expiresAt) > new Date()).length, color: 'text-indigo-600', bg: 'bg-indigo-50', icon: LinkIcon }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all">
                        <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
                            <h3 className="text-3xl font-bold text-slate-900">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State / List */}
            {requests.length === 0 ? (
                <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-20 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                        <Send className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Nenhuma solicitação ativa</h3>
                    <p className="text-slate-500 mt-2 max-w-sm">Crie agora um link de envio seguro e receba documentação externa direto no seu sistema.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Solicitação</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Atualização</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {requests.map(req => {
                                const isExpired = new Date(req.expiresAt) < new Date();
                                const isCompleted = req.status === 'completed';
                                const hasHistory = req.history && req.history.length > 0;
                                const isExpanded = expandedRows.includes(req.id);

                                return (
                                    <React.Fragment key={req.id}>
                                        <tr className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isCompleted ? 'bg-emerald-100 text-emerald-600' : isExpired ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : isExpired ? <AlertCircle className="w-5 h-5" /> : <FilePlus className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 leading-none mb-1">{req.title}</div>
                                                        <div className="text-xs text-slate-500 flex items-center gap-1">
                                                            <LinkIcon className="w-3 h-3" />
                                                            {req.id.substring(0, 8)}...
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                {isCompleted ? (
                                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase">Concluído</span>
                                                ) : isExpired ? (
                                                    <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold uppercase">Expirado</span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase">Aguardando</span>
                                                )}
                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    {req.emails.map(email => (
                                                        <span key={email} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-medium border border-slate-200" title="Destinatário">
                                                            {email}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-sm text-slate-500">
                                                {isCompleted ? (
                                                    <>
                                                        <span className="block font-medium text-slate-700">Recebido em:</span>
                                                        {formatDate(req.completedAt)}
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="block font-medium text-slate-700">Criado em:</span>
                                                        {formatDate(req.createdAt)}
                                                    </>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {hasHistory && (
                                                        <button
                                                            title="Ver Histórico"
                                                            onClick={() => toggleRow(req.id)}
                                                            className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-indigo-600 transition-all shadow-sm"
                                                        >
                                                            <Search className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {!isExpired && !isCompleted && (
                                                        <button
                                                            title="Copiar Link"
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(`${window.location.origin}/upload/${req.id}`)
                                                                toast.success('Link copiado!')
                                                            }}
                                                            className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-indigo-600 transition-all shadow-sm"
                                                        >
                                                            <LinkIcon className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button title="Excluir" className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-rose-600 transition-all shadow-sm">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                        {isExpanded && hasHistory && (
                                            <tr className="bg-slate-50/50">
                                                <td colSpan="4" className="px-6 py-4">
                                                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                                                        <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Histórico de Recebimentos</h4>
                                                        <div className="space-y-4">
                                                            {req.history.map((hist, idx) => {
                                                                const doc = req.documents?.find(d => d.id === hist.docId);
                                                                return (
                                                                    <div key={idx} className="flex items-center justify-between text-sm">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                                                                <Mail className="w-4 h-4 text-slate-500" />
                                                                            </div>
                                                                            <div>
                                                                                <div className="font-bold text-slate-900 text-sm">{hist.senderName} <span className="text-slate-400 font-normal">({hist.senderEmail})</span></div>
                                                                                <div className="text-xs text-slate-500">{formatDate(hist.uploadedAt)} • IP: {hist.ipAddress || 'Não registrado'}</div>
                                                                            </div>
                                                                        </div>
                                                                        {doc ? (
                                                                            <a href={`/documents/${doc.id}`} className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                                                                                <FilePlus className="w-3 h-3" />
                                                                                {doc.filename}
                                                                            </a>
                                                                        ) : (
                                                                            <span className="text-slate-400 text-xs italic">Documento removido</span>
                                                                        )}
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">Solicitar Envio</h2>
                                <p className="text-slate-500 text-sm mt-1">Gere um link para que terceiros enviem arquivos.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">Título do Pedido</label>
                                    <input
                                        required
                                        placeholder="Ex: Documentação de Cadastro - Cliente X"
                                        className="w-full px-4 h-12 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 font-medium transition-all"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">Observação / Mensagem (Opcional)</label>
                                    <textarea
                                        placeholder="Ex: Envie os extratos dos últimos 3 meses."
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 font-medium transition-all min-h-[80px]"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">Observação / Mensagem (Opcional)</label>
                                    <textarea
                                        placeholder="Ex: Por favor envie os comprovantes dos meses de janeiro e fevereiro."
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 font-medium transition-all min-h-[80px]"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">E-mails (Separados por vírgula)</label>
                                    <textarea
                                        required
                                        placeholder="destinatario@email.com, outro@email.com"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 font-medium transition-all min-h-[80px]"
                                        value={formData.emails}
                                        onChange={e => setFormData({ ...formData, emails: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">Categoria Sugerida</label>
                                        <select
                                            className="w-full px-4 h-12 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 font-medium transition-all"
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            <option value="">Selecione...</option>
                                            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">Expiração</label>
                                        <div className="w-full px-4 h-12 bg-slate-100 border border-slate-200 rounded-xl flex items-center text-slate-500 text-sm italic">
                                            15 dias (Padrão)
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
                            >
                                {loading ? 'Processando...' : (
                                    <>
                                        Gerar e Enviar Convite
                                        <Send className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
