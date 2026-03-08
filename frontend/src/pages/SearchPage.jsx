import { useState, useRef, useEffect } from 'react'
import { Search, Filter, FileText, Clock, X, ChevronRight, Sparkles } from 'lucide-react'
import { searchApi, categoriesApi } from '../lib/api'
import { CATEGORIES, getCategoryInfo, formatDate, highlightText } from '../lib/utils'
import { Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'

function ResultCard({ doc, query }) {
    const cat = getCategoryInfo(doc.category)
    const snippet = doc.snippet || doc.ocr_text?.substring(0, 200) || ''
    const highlightedSnippet = highlightText(snippet, query)

    return (
        <Link to={`/documents/${doc.id}`} className="card-hover group block">
            <div className="flex items-start gap-4">
                <div className="relative w-11 h-11 flex-shrink-0 group-hover:scale-110 transition-transform">
                    {doc.thumbnail_path ? (
                        <img
                            src={`/mock-storage/${doc.thumbnail_path}`}
                            alt=""
                            className={`w-11 h-11 rounded-xl object-cover border ${cat.border}`}
                        />
                    ) : (
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${cat.bg} ${cat.color} ${cat.border} border text-xl`}>
                            {cat.icon}
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3
                            className="font-semibold text-slate-200 group-hover:text-white"
                            dangerouslySetInnerHTML={{ __html: highlightText(doc.title, query) }}
                        />
                        <span className={`badge ${cat.bg} ${cat.color} ${cat.border} border`}>{cat.label}</span>
                    </div>
                    {snippet && (
                        <p
                            className="text-sm text-slate-400 mt-1 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: highlightedSnippet }}
                        />
                    )}
                    <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-slate-600 flex items-center gap-1">
                            <Clock size={11} />
                            {formatDate(doc.created_at)}
                        </span>
                    </div>
                </div>
                <ChevronRight size={16} className="text-slate-600 group-hover:text-primary-400 flex-shrink-0 transition-colors mt-1" />
            </div>
        </Link>
    )
}

const SEARCH_EXAMPLES = [
    'contrato prefeitura 2024',
    'nota fiscal material',
    'ofício equipamentos informática',
    'prontuário consulta',
    'convênio saúde',
]

export default function SearchPage() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [query, setQuery] = useState(searchParams.get('q') || '')
    const [filters, setFilters] = useState({ category: '', dateFrom: '', dateTo: '' })
    const [results, setResults] = useState(null)
    const [loading, setLoading] = useState(false)
    const [searched, setSearched] = useState(false)
    const [showFilters, setShowFilters] = useState(false)
    const [semanticSearch, setSemanticSearch] = useState(false)
    const [dbCategories, setDbCategories] = useState([])
    const inputRef = useRef(null)

    useEffect(() => {
        categoriesApi.list().then(setDbCategories).catch(() => { })
        inputRef.current?.focus()
        const q = searchParams.get('q')
        if (q) performSearch(q)
    }, [])

    const performSearch = async (q = query) => {
        if (!q || q.trim().length < 2) {
            toast.error('Digite pelo menos 2 caracteres para buscar')
            return
        }
        setLoading(true)
        setSearched(true)
        setSearchParams({ q: q.trim() })

        try {
            const data = await searchApi.search(q.trim(), {
                category: filters.category || undefined,
                dateFrom: filters.dateFrom || undefined,
                dateTo: filters.dateTo || undefined,
            })
            setResults(data.results || [])
        } catch (err) {
            toast.error('Erro ao realizar busca')
            setResults([])
        } finally {
            setLoading(false)
        }
    }

    const handleKey = (e) => {
        if (e.key === 'Enter') performSearch()
    }

    const clearSearch = () => {
        setQuery('')
        setResults(null)
        setSearched(false)
        setSearchParams({})
        inputRef.current?.focus()
    }

    const hasFilters = filters.category || filters.dateFrom || filters.dateTo

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
            {/* Header */}
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600/20 border border-primary-500/30 mb-4">
                    <Search size={24} className="text-primary-400" />
                </div>
                <h1 className="text-3xl font-bold text-white">Busca Inteligente</h1>
                <p className="text-slate-400 mt-2">Encontre qualquer documento pelo conteúdo do texto</p>
            </div>

            {/* Search input */}
            <div className="card">
                <div className="relative flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            ref={inputRef}
                            id="search-input"
                            type="text"
                            className="input pl-11 pr-10 py-3.5 text-base"
                            placeholder="Buscar por palavra-chave, número de documento..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={handleKey}
                        />
                        {query && (
                            <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                                <X size={16} />
                            </button>
                        )}
                    </div>
                    <button
                        id="search-btn"
                        onClick={() => performSearch()}
                        disabled={loading}
                        className="btn-primary px-5 py-3.5 text-base flex-shrink-0"
                    >
                        {loading ? <div className="w-5 h-5 spinner" /> : 'Buscar'}
                    </button>
                </div>

                {/* Filter toggle */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/60">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`btn-ghost text-sm ${hasFilters ? 'text-primary-400' : 'text-slate-500'}`}
                    >
                        <Filter size={14} />
                        Filtros avançados
                        {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-primary-400" />}
                    </button>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSemanticSearch(!semanticSearch)}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-semibold transition-all ${semanticSearch
                                ? 'bg-primary-600/10 border-primary-500/40 text-primary-400'
                                : 'bg-surface-800 border-slate-700 text-slate-500 hover:border-slate-600'}`}
                        >
                            <Sparkles size={12} />
                            {semanticSearch ? 'Semantic ON' : 'Basic Search'}
                        </button>
                        {hasFilters && (
                            <button onClick={() => setFilters({ category: '', dateFrom: '', dateTo: '' })} className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1">
                                <X size={11} />Limpar filtros
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 animate-fade-in">
                        <div>
                            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Categoria</label>
                            <select className="select text-sm" value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}>
                                <option value="">Todas</option>
                                {dbCategories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-400 mb-1.5 block">De</label>
                            <input type="date" className="input text-sm" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Até</label>
                            <input type="date" className="input text-sm" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} />
                        </div>
                    </div>
                )}
            </div>

            {/* Examples (before search) */}
            {
                !searched && (
                    <div className="animate-fade-in">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Sparkles size={12} className="text-primary-400" />
                            Exemplos de busca
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {SEARCH_EXAMPLES.map(ex => (
                                <button
                                    key={ex}
                                    onClick={() => { setQuery(ex); performSearch(ex) }}
                                    className="px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-primary-300 bg-surface-800 hover:bg-primary-600/10 border border-slate-700 hover:border-primary-500/40 transition-all"
                                >
                                    {ex}
                                </button>
                            ))}
                        </div>

                        <div className="mt-6 card bg-surface-800/40">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary-600/20 flex items-center justify-center flex-shrink-0">
                                    <Sparkles size={14} className="text-primary-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-300">Busca no conteúdo do texto</p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        O OCR extrai o texto de PDFs e imagens automaticamente. Você pode buscar por qualquer palavra presente nos documentos, mesmo que seja uma imagem escaneada.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Results */}
            {
                searched && (
                    <div className="animate-fade-in">
                        {loading ? (
                            <div className="space-y-3">
                                {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
                            </div>
                        ) : results && results.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-14 h-14 rounded-2xl bg-surface-800 flex items-center justify-center mx-auto mb-4 border border-slate-700">
                                    <Search size={22} className="text-slate-600" />
                                </div>
                                <p className="text-slate-300 font-semibold">Nenhum resultado encontrado</p>
                                <p className="text-slate-500 text-sm mt-1">
                                    Tente outros termos ou verifique se o OCR foi concluído
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-sm text-slate-400">
                                        <span className="text-white font-semibold">{results?.length}</span> resultado{results?.length !== 1 ? 's' : ''} para{' '}
                                        <span className="text-primary-400 font-medium">"{query}"</span>
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    {results?.map(doc => (
                                        <ResultCard key={doc.id} doc={doc} query={query} />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )
            }
        </div >
    )
}
