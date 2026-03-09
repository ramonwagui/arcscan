import { useState, useRef, useEffect } from 'react'
import { Search, Filter, FileText, Clock, X, ChevronRight, Sparkles, Cpu } from 'lucide-react'
import { searchApi, categoriesApi } from '../lib/api'
import { CATEGORIES, getCategoryInfo, formatDate, highlightText } from '../lib/utils'
import { Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'

function ResultCard({ doc, query }) {
    const cat = getCategoryInfo(doc.category)
    const snippet = doc.snippet || doc.ocr_text?.substring(0, 200) || ''
    const highlightedSnippet = highlightText(snippet, query)

    return (
        <Link to={`/documents/${doc.id}`} className="block group">
            <div className="bg-white border border-slate-100 rounded-[1.5rem] p-6 hover:border-primary-500/30 hover:shadow-xl hover:shadow-primary-500/5 transition-all duration-300">
                <div className="flex items-start gap-5">
                    <div className="relative w-14 h-14 flex-shrink-0 group-hover:scale-105 transition-transform duration-500">
                        {doc.thumbnail_path ? (
                            <img
                                src={`/mock-storage/${doc.thumbnail_path}`}
                                alt=""
                                className="w-14 h-14 rounded-2xl object-cover border border-slate-100 shadow-sm"
                            />
                        ) : (
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${cat.bg} ${cat.color} border border-white shadow-sm text-2xl`}>
                                {cat.icon}
                            </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center border border-slate-100 shadow-sm">
                            <FileText size={10} className="text-slate-400" />
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                            <h3
                                className="text-lg font-black text-slate-900 group-hover:text-primary-500 transition-colors tracking-tight"
                                dangerouslySetInnerHTML={{ __html: highlightText(doc.title, query) }}
                            />
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${cat.bg} ${cat.color} border border-white shadow-sm`}>
                                {cat.label}
                            </span>
                        </div>

                        {snippet && (
                            <div className="relative p-3 bg-slate-50 rounded-xl border border-slate-100 mt-2">
                                <p
                                    className="text-xs text-slate-500 leading-relaxed font-medium line-clamp-2"
                                    dangerouslySetInnerHTML={{ __html: highlightedSnippet }}
                                />
                                <div className="absolute top-2 right-2 opacity-20">
                                    <Sparkles size={10} className="text-primary-500" />
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-4 mt-4">
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 border border-slate-100">
                                <Clock size={10} className="text-slate-400" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                                    Auditado em {formatDate(doc.created_at)}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-black text-primary-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                Acessar Registro <ChevronRight size={12} strokeWidth={3} />
                            </div>
                        </div>
                    </div>
                </div>
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
    const [semanticSearch, setSemanticSearch] = useState(true)
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
            toast.error('Digite pelo menos 2 caracteres')
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
                semantic: semanticSearch,
            })
            setResults(data.results || [])
        } catch (err) {
            toast.error('Falha na consulta')
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
        <div className="max-w-[1000px] mx-auto space-y-12 animate-slide-up pb-20">
            {/* Minimal Header */}
            <div className="text-center pt-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2.5rem] bg-primary-500/10 border border-primary-500/20 mb-8 shadow-inner group">
                    <Search size={32} className="text-primary-500 group-hover:scale-110 transition-transform duration-500" strokeWidth={2.5} />
                </div>
                <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none mb-4">Busca Neural</h1>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em]">Exploração avançada de base de dados</p>
            </div>

            {/* Search Input Section */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary-500/20 to-blue-500/20 rounded-[2.5rem] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-white border border-slate-200 rounded-[2rem] p-3 shadow-2xl flex flex-col md:flex-row items-stretch md:items-center gap-3">
                    <div className="relative flex-1">
                        <Search size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" strokeWidth={2.5} />
                        <input
                            ref={inputRef}
                            type="text"
                            className="w-full bg-transparent border-none focus:ring-0 pl-16 pr-12 py-5 text-xl font-bold text-slate-800 placeholder:text-slate-300"
                            placeholder="Descreva o que você procura..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={handleKey}
                        />
                        {query && (
                            <button onClick={clearSearch} className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={14} strokeWidth={3} />
                            </button>
                        )}
                    </div>

                    <div className="h-10 w-[2px] bg-slate-100 hidden md:block" />

                    <div className="flex items-center gap-2 pl-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`h-14 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-2
                                ${showFilters || hasFilters
                                    ? 'bg-primary-500/10 border-primary-500/30 text-primary-500 shadow-sm'
                                    : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-50'
                                }`}
                        >
                            <Filter size={16} strokeWidth={2.5} />
                            Filtros
                            {hasFilters && <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-ping" />}
                        </button>

                        <button
                            onClick={() => performSearch()}
                            disabled={loading}
                            className="h-14 px-10 rounded-2xl bg-primary-500 text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-primary-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                        >
                            {loading ? <div className="w-5 h-5 spinner" /> : 'Executar'}
                        </button>
                    </div>
                </div>

                {/* Expanded Filters */}
                {showFilters && (
                    <div className="absolute top-full left-0 right-0 mt-4 p-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl z-30 animate-slide-up grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Segmento Especial</label>
                            <select
                                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-xs font-bold text-slate-700 outline-none focus:border-primary-500"
                                value={filters.category}
                                onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
                            >
                                <option value="">Todos os Segmentos</option>
                                {dbCategories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Período Inicial</label>
                            <input
                                type="date"
                                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-xs font-bold text-slate-700 outline-none focus:border-primary-500"
                                value={filters.dateFrom}
                                onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Período Final</label>
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    className="flex-1 h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-xs font-bold text-slate-700 outline-none focus:border-primary-500"
                                    value={filters.dateTo}
                                    onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                                />
                                {hasFilters && (
                                    <button
                                        onClick={() => setFilters({ category: '', dateFrom: '', dateTo: '' })}
                                        className="h-12 w-12 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"
                                    >
                                        <X size={18} strokeWidth={3} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Examples & Tech Info */}
            {!searched && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-10 animate-fade-in pt-8">
                    <div className="md:col-span-8 space-y-8">
                        <div>
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                                <Sparkles size={16} className="text-primary-500" />
                                Sugestões de Pesquisa
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                {SEARCH_EXAMPLES.map(ex => (
                                    <button
                                        key={ex}
                                        onClick={() => { setQuery(ex); performSearch(ex) }}
                                        className="px-5 py-3 rounded-2xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:border-primary-500 hover:text-primary-500 hover:shadow-lg transition-all"
                                    >
                                        "{ex}"
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-4">
                        <div className="p-8 bg-primary-50 rounded-[2.5rem] border border-primary-100 space-y-6">
                            <div className="w-12 h-12 rounded-2xl bg-primary-500 flex items-center justify-center text-white shadow-xl shadow-primary-500/20">
                                <Cpu size={24} />
                            </div>
                            <div>
                                <h4 className="text-slate-700 font-black uppercase tracking-widest text-sm mb-2">Motor Neural v3.0</h4>
                                <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight">
                                    Otimizada para extração semântica em documentos escaneados e PDF nativos. Precisão superior a 99% em OCR.
                                </p>
                            </div>
                            <button
                                onClick={() => setSemanticSearch(!semanticSearch)}
                                className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all
                                    ${semanticSearch
                                        ? 'bg-primary-500 text-white border-primary-400 shadow-lg shadow-primary-500/20'
                                        : 'bg-white border-slate-200 text-slate-500'}`}
                            >
                                Busca Semântica: {semanticSearch ? 'Otimizada' : 'Padrão'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Results Grid */}
            {searched && (
                <div className="space-y-6 animate-fade-in">
                    {loading ? (
                        <div className="space-y-4 pt-10">
                            {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-slate-100 rounded-[2rem] animate-pulse" />)}
                        </div>
                    ) : results && results.length === 0 ? (
                        <div className="text-center py-32 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                            <div className="w-20 h-20 rounded-[2rem] bg-slate-100 flex items-center justify-center mx-auto mb-6 text-slate-300">
                                <Search size={32} strokeWidth={1} />
                            </div>
                            <h3 className="text-xl font-black text-slate-400 uppercase tracking-tight">Nenhum Registro Localizado</h3>
                            <p className="text-xs font-bold text-slate-500 mt-2 uppercase tracking-widest">Ajuste os termos ou verifique os filtros aplicados</p>
                        </div>
                    ) : (
                        <div className="space-y-4 pt-4">
                            <div className="flex items-center justify-between mb-8 px-4">
                                <div className="flex items-center gap-3">
                                    <div className="px-3 py-1 bg-primary-500 text-white text-[10px] font-black rounded-lg uppercase tracking-widest">
                                        {results?.length} Encontrados
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                        Resultados para <span className="text-slate-900">"{query}"</span>
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {results?.map(doc => (
                                    <ResultCard key={doc.id} doc={doc} query={query} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
