import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Filter, Search, Trash2, Eye, ChevronRight, SlidersHorizontal, X } from 'lucide-react'
import { documentsApi } from '../lib/api'
import { CATEGORIES, getCategoryInfo, formatDate, formatFileSize, getFileIcon } from '../lib/utils'
import toast from 'react-hot-toast'

function DocumentCard({ doc, onDelete }) {
    const cat = getCategoryInfo(doc.category)
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
        <div className="card-hover group relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* File icon */}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${cat.bg} ${cat.border} border text-2xl`}>
                {cat.icon}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-200 group-hover:text-white truncate">{doc.title}</p>
                    <span className={`badge ${cat.bg} ${cat.color} ${cat.border} border`}>{cat.label}</span>
                    {doc.status === 'processing' && (
                        <span className="badge bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse-slow">
                            ⏳ Processando OCR
                        </span>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                    <span className="text-xs text-slate-500">{getFileIcon(doc.file_type)} {doc.filename}</span>
                    <span className="text-xs text-slate-500">{formatFileSize(doc.file_size)}</span>
                    <span className="text-xs text-slate-500">{formatDate(doc.created_at)}</span>
                </div>
                {doc.ocr_text && (
                    <p className="text-xs text-slate-600 mt-1 truncate max-w-xl">
                        {doc.ocr_text.substring(0, 120)}...
                    </p>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                    to={`/documents/${doc.id}`}
                    className="btn-ghost text-xs px-2.5 py-1.5"
                >
                    <Eye size={14} />
                    Ver
                </Link>
                <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="btn-ghost text-xs px-2.5 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                >
                    {deleting ? <div className="w-3.5 h-3.5 spinner" /> : <Trash2 size={14} />}
                </button>
            </div>
        </div>
    )
}

export default function DocumentsPage() {
    const [docs, setDocs] = useState([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [showFilters, setShowFilters] = useState(false)
    const [filters, setFilters] = useState({ category: '', dateFrom: '', dateTo: '' })

    const loadDocs = useCallback(async () => {
        setLoading(true)
        try {
            const params = {}
            if (filters.category) params.category = filters.category
            if (filters.dateFrom) params.dateFrom = filters.dateFrom
            if (filters.dateTo) params.dateTo = filters.dateTo

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
    const clearFilters = () => setFilters({ category: '', dateFrom: '', dateTo: '' })
    const hasFilters = filters.category || filters.dateFrom || filters.dateTo

    return (
        <div className="space-y-5 animate-slide-up">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <FileText size={22} className="text-primary-400" />
                        Documentos
                    </h1>
                    <p className="text-slate-400 text-sm mt-0.5">
                        {total} documento{total !== 1 ? 's' : ''} no seu acervo
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`btn-secondary text-sm ${hasFilters ? 'border-primary-500/50 text-primary-400' : ''}`}
                    >
                        <SlidersHorizontal size={15} />
                        Filtros
                        {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-primary-400" />}
                    </button>
                    <Link to="/search" className="btn-ghost text-sm">
                        <Search size={15} />
                        Buscar
                    </Link>
                </div>
            </div>

            {/* Filters panel */}
            {showFilters && (
                <div className="card animate-fade-in">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                            <Filter size={14} className="text-primary-400" />
                            Filtros
                        </h3>
                        {hasFilters && (
                            <button onClick={clearFilters} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
                                <X size={12} />
                                Limpar
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Categoria</label>
                            <select
                                className="select text-sm"
                                value={filters.category}
                                onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
                            >
                                <option value="">Todas</option>
                                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Data inicial</label>
                            <input
                                type="date"
                                className="input text-sm"
                                value={filters.dateFrom}
                                onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Data final</label>
                            <input
                                type="date"
                                className="input text-sm"
                                value={filters.dateTo}
                                onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Documents list */}
            {loading ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
                </div>
            ) : docs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-surface-800 flex items-center justify-center mb-4 border border-slate-700">
                        <FileText size={26} className="text-slate-600" />
                    </div>
                    <p className="text-slate-300 font-semibold text-lg">Nenhum documento encontrado</p>
                    <p className="text-slate-500 text-sm mt-1">
                        {hasFilters ? 'Tente ajustar os filtros.' : 'Comece enviando seu primeiro documento.'}
                    </p>
                    {hasFilters && (
                        <button onClick={clearFilters} className="btn-ghost mt-3 text-sm text-primary-400">
                            <X size={14} />
                            Limpar filtros
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {docs.map(doc => (
                        <DocumentCard key={doc.id} doc={doc} onDelete={handleDelete} />
                    ))}
                </div>
            )}
        </div>
    )
}
