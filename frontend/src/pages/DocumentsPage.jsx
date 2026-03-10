import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Filter, Search, Trash2, Eye, ChevronRight, SlidersHorizontal, X, Upload, Clock, FolderOpen, ArrowLeft } from 'lucide-react'
import { documentsApi, categoriesApi } from '../lib/api'
import { CATEGORIES, getCategoryInfo, formatDate, formatFileSize, getFileIcon } from '../lib/utils'
import toast from 'react-hot-toast'

function DocumentCard({ doc, onDelete, dbCategories }) {
    const cat = getCategoryInfo(doc.category, dbCategories)
    const [deleting, setDeleting] = useState(false)

    const handleDelete = async (e) => {
        e.preventDefault()
        if (!confirm(`Remover "${doc.title}"?`)) return
        setDeleting(true)
        try {
            await documentsApi.delete(doc.id)
            onDelete(doc.id)
            toast.success('Documento removido')
        } catch {
            toast.error('Erro ao remover documento')
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-primary-500/30 hover:shadow-md transition-all duration-300 group flex flex-col md:flex-row items-center gap-6">
            {/* Thumbnail/Icon */}
            <div className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl flex-shrink-0 flex items-center justify-center ${cat.bg} border-2 border-white shadow-sm overflow-hidden relative group-hover:scale-105 transition-transform duration-500`}>
                {doc.thumbnail_path ? (
                    <img src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/documents/${doc.thumbnail_path}`} alt="" className="w-full h-full object-cover" />
                ) : (
                    <FileText size={36} strokeWidth={1.5} className={`relative z-10 ${cat.color}`} />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight truncate group-hover:text-primary-500 transition-colors">
                        {doc.title}
                    </h3>
                    <div className="flex items-center justify-center md:justify-start gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${cat.bg} ${cat.color} border border-white shadow-sm`}>
                            {cat.label}
                        </span>
                        {doc.status === 'processing' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500 text-white animate-pulse">
                                Processing
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2">
                    <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                        <FileText size={12} strokeWidth={2.5} className="text-primary-500" />
                        {doc.filename}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                        <SlidersHorizontal size={12} strokeWidth={2.5} className="text-primary-500" />
                        {formatFileSize(doc.file_size)}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                        <Clock size={12} strokeWidth={2.5} className="text-primary-500" />
                        {formatDate(doc.created_at)}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 md:pl-2">
                <Link
                    to={`/documents/${doc.id}`}
                    className="p-3 rounded-xl bg-slate-50 text-slate-600 hover:bg-primary-500 hover:text-white transition-all border border-slate-100 shadow-sm"
                    title="Visualizar Detalhes"
                >
                    <Eye size={20} />
                </Link>
                <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-500 hover:text-white transition-all border border-slate-100 shadow-sm disabled:opacity-50"
                    title="Excluir Registro"
                >
                    {deleting ? <div className="w-5 h-5 spinner" /> : <Trash2 size={20} />}
                </button>
            </div>
        </div>
    )
}

function CategoryFolder({ group, onDelete, dbCategories }) {
    const [isOpen, setIsOpen] = useState(true)

    return (
        <div className="bg-slate-50/50 rounded-[2rem] border border-slate-200/80 overflow-hidden transition-all duration-300 shadow-sm">
            <div
                className="flex items-center justify-between p-5 md:px-8 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${group.info.bg} ${group.info.color} shadow-sm border-2 border-white`}>
                        {isOpen ? '📂' : (group.info.icon || '📁')}
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">{group.info.label}</h2>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                            {group.documents.length} {group.documents.length === 1 ? 'documento' : 'documentos'}
                        </p>
                    </div>
                </div>
                <div className={`p-2 rounded-full text-slate-400 bg-white border border-slate-200 shadow-sm transition-transform duration-300 ${isOpen ? 'rotate-90 bg-primary-50 text-primary-600 border-primary-100' : ''}`}>
                    <ChevronRight size={20} strokeWidth={3} />
                </div>
            </div>

            {isOpen && (
                <div className="p-6 md:p-8 grid grid-cols-1 gap-5 lg:grid-cols-2 bg-white/50 border-t border-slate-200/60">
                    {group.documents.map(doc => (
                        <DocumentCard key={doc.id} doc={doc} onDelete={onDelete} dbCategories={dbCategories} />
                    ))}
                </div>
            )}
        </div>
    )
}

export default function DocumentsPage() {
    const [docs, setDocs] = useState([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [showFilters, setShowFilters] = useState(false)
    const [filters, setFilters] = useState({ category: '', dateFrom: '', dateTo: '', search: '' })
    const [dbCategories, setDbCategories] = useState([])
    const [selectedCategory, setSelectedCategory] = useState(null)

    useEffect(() => {
        categoriesApi.list().then(setDbCategories).catch(() => { })
    }, [])

    const loadDocs = useCallback(async () => {
        setLoading(true)
        try {
            const params = {}
            if (filters.category) params.category = filters.category
            if (filters.dateFrom) params.dateFrom = filters.dateFrom
            if (filters.dateTo) params.dateTo = filters.dateTo
            if (filters.search) params.q = filters.search

            const data = await documentsApi.list(params)
            setDocs(data.documents || [])
            setTotal(data.total || 0)
        } catch (err) {
            toast.error('Erro ao carregar documentos')
        } finally {
            setLoading(false)
        }
    }, [filters])

    useEffect(() => { loadDocs() }, [loadDocs])

    const handleDelete = (id) => setDocs(prev => prev.filter(d => d.id !== id))
    const clearFilters = () => setFilters({ category: '', dateFrom: '', dateTo: '', search: '' })
    const hasFilters = filters.category || filters.dateFrom || filters.dateTo || filters.search

    const categoriesMap = new Map()
    docs.forEach(doc => {
        const catInfo = getCategoryInfo(doc.category, dbCategories)
        const catKey = catInfo.value || catInfo.slug || 'outros'
        if (!categoriesMap.has(catKey)) {
            categoriesMap.set(catKey, { info: catInfo, documents: [] })
        }
        categoriesMap.get(catKey).documents.push(doc)
    })
    const groupedDocs = Array.from(categoriesMap.values()).sort((a, b) => a.info.label.localeCompare(b.info.label))

    // Handle view based on selection
    const viewDocuments = selectedCategory ? (categoriesMap.get(selectedCategory)?.documents || []) : []
    const viewGroupInfo = selectedCategory ? categoriesMap.get(selectedCategory)?.info : null

    return (
        <div className="space-y-10 animate-slide-up pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none uppercase">
                        Arquivo <span className="text-primary-500">Digital</span>
                    </h1>
                    <p className="text-slate-500 font-bold text-sm mt-3 uppercase tracking-widest">
                        Total de {total} registros localizados
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`btn-secondary py-3 px-6 ${showFilters || hasFilters ? 'bg-primary-500/10 border-primary-500/30 text-primary-500' : ''}`}
                    >
                        <SlidersHorizontal size={18} />
                        <span>Parâmetros</span>
                        {hasFilters && <div className="w-2 h-2 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(123,143,242,0.4)] animate-pulse" />}
                    </button>
                    <Link to="/upload" className="btn-primary py-3 px-6">
                        <Upload size={18} />
                        <span>Novo Upload</span>
                    </Link>
                </div>
            </div>

            {/* Filters panel */}
            {showFilters && (
                <div className="bg-white p-8 rounded-[2rem] border-2 border-primary-500/20 shadow-xl shadow-primary-500/5 backdrop-blur-xl animate-fade-in relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                        {hasFilters && (
                            <button onClick={clearFilters} className="text-[10px] font-black uppercase tracking-widest text-primary-500 bg-primary-500/10 px-3 py-1.5 rounded-full hover:bg-primary-500 hover:text-white transition-all flex items-center gap-2">
                                <X size={12} strokeWidth={3} />
                                Limpar Tudo
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="md:col-span-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Pesquisa Rápida</label>
                            <div className="relative group">
                                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" />
                                <input
                                    type="text"
                                    className="input pl-12 h-12 rounded-xl text-sm"
                                    placeholder="Nome, ID ou OCR..."
                                    value={filters.search}
                                    onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Classificação</label>
                            <select
                                className="select h-12 rounded-xl text-sm"
                                value={filters.category}
                                onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
                            >
                                <option value="">Todos os Tipos</option>
                                {dbCategories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Período (De)</label>
                            <input
                                type="date"
                                className="input h-12 rounded-xl text-sm"
                                value={filters.dateFrom}
                                onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Período (Até)</label>
                            <input
                                type="date"
                                className="input h-12 rounded-xl text-sm"
                                value={filters.dateTo}
                                onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Documents Section */}
            {loading ? (
                <div className="grid grid-cols-1 gap-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="skeleton h-32 rounded-2xl" />
                    ))}
                </div>
            ) : docs.length === 0 ? (
                <div className="py-32 flex flex-col items-center justify-center text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
                    <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mb-6 text-slate-200 shadow-inner">
                        <FileText size={48} strokeWidth={1} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Vazio Absoluto</h3>
                    <p className="text-slate-400 font-bold text-sm mt-3 max-w-xs mx-auto uppercase tracking-wide">
                        {hasFilters ? 'Nenhum registro corresponde aos seus parâmetros de busca.' : 'Seu arquivo digital está pronto para receber o primeiro documento.'}
                    </p>
                    {hasFilters ? (
                        <button onClick={clearFilters} className="mt-8 btn-secondary font-black text-[10px] uppercase tracking-widest">
                            Resetar Parâmetros
                        </button>
                    ) : (
                        <Link to="/upload" className="mt-8 btn-primary font-black text-[10px] uppercase tracking-widest px-10">
                            Iniciar Captura
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    {!selectedCategory ? (
                        /* BREADCRUMB / VIEW TITLE */
                        <>
                            <div className="flex items-center gap-2 mb-2 text-slate-500 font-medium">
                                <FolderOpen size={18} />
                                <span>Meu Arquivo</span>
                                <ChevronRight size={16} />
                                <span className="text-slate-400">Categorias</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {groupedDocs.map(group => {
                                    const gk = group.info.value || group.info.slug;
                                    return (
                                        <div
                                            key={gk}
                                            onClick={() => setSelectedCategory(gk)}
                                            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-primary-500/30 hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col group items-start gap-4"
                                        >
                                            <div className={`w-16 h-16 rounded-2xl flex flex-shrink-0 items-center justify-center text-4xl ${group.info.bg} ${group.info.color} border-2 border-white shadow-sm overflow-hidden relative group-hover:scale-105 transition-transform duration-500`}>
                                                <span className="relative z-10">{group.info.icon || '📁'}</span>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-slate-900 tracking-tight group-hover:text-primary-500 transition-colors">{group.info.label}</h3>
                                                <p className="text-sm font-medium text-slate-500 mt-1">
                                                    {group.documents.length} {group.documents.length === 1 ? 'arquivo' : 'arquivos'}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    ) : (
                        /* INSIDE FOLDER VIEW */
                        <div className="animate-fade-in space-y-6">
                            <div className="flex items-center gap-4 border-b border-slate-200/60 pb-4 mb-4">
                                <button
                                    onClick={() => setSelectedCategory(null)}
                                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors flex items-center justify-center"
                                    title="Voltar às categorias"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${viewGroupInfo.bg} ${viewGroupInfo.color}`}>
                                    {viewGroupInfo.icon || '📁'}
                                </div>
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">{viewGroupInfo.label}</h2>
                            </div>

                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                {viewDocuments.length > 0 ? (
                                    viewDocuments.map(doc => (
                                        <DocumentCard key={doc.id} doc={doc} onDelete={handleDelete} dbCategories={dbCategories} />
                                    ))
                                ) : (
                                    <div className="col-span-full py-16 text-center text-slate-400">
                                        Nenhum arquivo encontrado nesta pasta.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
