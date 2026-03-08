import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, X, CheckCircle, AlertCircle, Info, Tag } from 'lucide-react'
import { documentsApi, categoriesApi } from '../lib/api'
import toast from 'react-hot-toast'

const ACCEPTED = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
const MAX_SIZE = 10 * 1024 * 1024

function FilePreview({ file, onRemove }) {
    const isImage = file.type.startsWith('image/')
    const url = isImage ? URL.createObjectURL(file) : null

    return (
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 shadow-sm animate-fade-in group">
            <div className="relative">
                {url ? (
                    <img src={url} alt="" className="w-16 h-16 rounded-xl object-cover border border-slate-100 dark:border-slate-800 shadow-sm" />
                ) : (
                    <div className="w-16 h-16 rounded-xl bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20 flex items-center justify-center">
                        <FileText size={24} className="text-primary-500" />
                    </div>
                )}
                <div className="absolute -top-2 -right-2">
                    <button
                        onClick={onRemove}
                        className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg hover:bg-rose-600 transition-colors border-2 border-white dark:border-surface-900"
                    >
                        <X size={12} strokeWidth={3} />
                    </button>
                </div>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">{file.name}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{(file.size / 1024).toFixed(1)} KB • {file.type.split('/')[1].toUpperCase()}</p>
            </div>
        </div>
    )
}

export default function UploadPage() {
    const navigate = useNavigate()
    const [file, setFile] = useState(null)
    const [title, setTitle] = useState('')
    const [category, setCategory] = useState('outros')
    const [dbCategories, setDbCategories] = useState([])
    const [dragOver, setDragOver] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [error, setError] = useState('')
    const [expiresAt, setExpiresAt] = useState('')

    useEffect(() => {
        categoriesApi.list().then(setDbCategories).catch(() => { })
    }, [])

    const validateFile = (f) => {
        if (!ACCEPTED.includes(f.type)) {
            return 'Formato não suportado. Use PDF, JPG ou PNG.'
        }
        if (f.size > MAX_SIZE) {
            return 'Arquivo muito grande. Tamanho máximo: 10MB.'
        }
        return null
    }

    const handleFile = (f) => {
        const err = validateFile(f)
        if (err) { toast.error(err); return }
        setFile(f)
        setError('')
        if (!title) {
            setTitle(f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '))
        }
    }

    const onDrop = useCallback((e) => {
        e.preventDefault()
        setDragOver(false)
        const f = e.dataTransfer.files?.[0]
        if (f) handleFile(f)
    }, [title])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!file) { toast.error('Selecione um arquivo'); return }
        if (!title.trim()) { toast.error('Título é obrigatório'); return }

        setUploading(true)
        setProgress(0)

        const formData = new FormData()
        formData.append('file', file)
        formData.append('title', title.trim())
        formData.append('category', category)
        if (expiresAt) formData.append('expiresAt', expiresAt)

        try {
            await documentsApi.upload(formData, (pct) => setProgress(pct))
            toast.success('Documento enviado! Analisando conteúdo...')
            navigate('/documents')
        } catch (err) {
            const msg = err.response?.data?.error || 'Erro ao enviar documento'
            setError(msg)
            toast.error(msg)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto animate-slide-up pb-20">
            {/* Header section with icon and title */}
            <div className="text-center mb-12">
                <div className="w-20 h-20 bg-primary-500 rounded-[2rem] flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-primary-500/20 animate-bounce-slow">
                    <Upload size={32} strokeWidth={2.5} />
                </div>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                    Central de <span className="text-primary-500">Captura</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-4 uppercase tracking-[0.2em]">
                    Inteligência Artificial & Extração de Metadados
                </p>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left side: Upload Area */}
                <div className="lg:col-span-7 space-y-8">
                    <div
                        className={`relative group rounded-[2.5rem] border-4 border-dashed transition-all duration-500 flex flex-col items-center justify-center p-12 text-center
                            ${dragOver ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-500/5 scale-[1.02]' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-900'}
                            ${file ? 'border-emerald-500/30 bg-emerald-50/10 dark:bg-emerald-500/5' : ''}
                        `}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={onDrop}
                        onClick={() => !file && document.getElementById('file-input').click()}
                    >
                        <input
                            id="file-input"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
                        />

                        {!file ? (
                            <>
                                <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-surface-950 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary-500 group-hover:text-white transition-all duration-300 shadow-sm">
                                    <Upload size={28} strokeWidth={2.5} className="text-slate-400 group-hover:text-white" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Arraste seus Arquivos</h3>
                                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-8">Clique para explorar ou solte aqui</p>

                                <div className="flex flex-wrap justify-center gap-3">
                                    {['PDF', 'JPG', 'PNG'].map(type => (
                                        <span key={type} className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-surface-950 text-[10px] font-black text-slate-400 border border-slate-100 dark:border-slate-800 uppercase tracking-widest group-hover:border-primary-500/20 transition-all">
                                            {type} format
                                        </span>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="w-full animate-fade-in">
                                <div className="flex items-center justify-center gap-2 mb-6 text-emerald-500">
                                    <CheckCircle size={20} fill="currentColor" className="text-white" />
                                    <span className="text-xs font-black uppercase tracking-widest">Documento Carregado</span>
                                </div>
                                <FilePreview file={file} onRemove={() => { setFile(null); setTitle(''); setError('') }} />
                                <button
                                    type="button"
                                    onClick={() => document.getElementById('file-input').click()}
                                    className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-primary-500 hover:underline"
                                >
                                    Alterar Arquivo Selecionado
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Progress indicator */}
                    {uploading && (
                        <div className="p-8 bg-white dark:bg-surface-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm animate-fade-in">
                            <div className="flex justify-between items-end mb-4">
                                <div>
                                    <p className="text-[10px] font-black text-primary-500 uppercase tracking-[0.2em]">Upload em curso</p>
                                    <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none mt-1">Sincronizando com a Nuvem</h4>
                                </div>
                                <span className="text-xl font-black text-primary-500">{progress}%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-surface-950 h-3 rounded-full overflow-hidden">
                                <div className="bg-primary-500 h-full rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(17,17,212,0.4)]" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right side: Metadata Forms */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white dark:bg-surface-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
                        {/* Title input */}
                        <div>
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 block">Nome de Identificação</label>
                            <input
                                type="text"
                                className="input h-14 px-6 rounded-2xl text-sm font-bold placeholder:font-normal"
                                placeholder="Ex: NOTA FISCAL SERV-042"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        {/* Expiration date */}
                        <div>
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 block">Validade do Documento</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    className="input h-14 px-6 rounded-2xl text-sm font-bold"
                                    value={expiresAt}
                                    onChange={e => setExpiresAt(e.target.value)}
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <TrendingUp size={18} />
                                </div>
                            </div>
                        </div>

                        {/* Category selection grid */}
                        <div>
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 block">Classificação Inteligente</label>
                            <div className="grid grid-cols-2 gap-3">
                                {dbCategories.map(cat => (
                                    <button
                                        key={cat.slug}
                                        type="button"
                                        onClick={() => setCategory(cat.slug)}
                                        className={`p-4 rounded-2xl border-2 text-left transition-all duration-300 flex flex-col gap-2 relative overflow-hidden group
                                            ${category === cat.slug
                                                ? 'border-primary-500 bg-primary-500/5 shadow-lg shadow-primary-500/5'
                                                : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}
                                        `}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors
                                            ${category === cat.slug ? 'bg-primary-500 text-white' : 'bg-slate-50 dark:bg-surface-950 text-slate-400 group-hover:text-primary-500'}
                                        `}>
                                            <Tag size={16} strokeWidth={2.5} />
                                        </div>
                                        <span className={`text-[11px] font-black uppercase tracking-tight
                                            ${category === cat.slug ? 'text-primary-500' : 'text-slate-600 dark:text-slate-400'}
                                        `}>
                                            {cat.name}
                                        </span>
                                        {category === cat.slug && (
                                            <div className="absolute -top-1 -right-1">
                                                <div className="w-4 h-4 bg-primary-500 rotate-45 transform translate-x-2 -translate-y-2"></div>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Error and actions */}
                        {error && (
                            <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/20 text-rose-500 animate-shake">
                                <AlertCircle size={20} />
                                <p className="text-xs font-bold leading-tight uppercase tracking-tight">{error}</p>
                            </div>
                        )}

                        <div className="pt-4 space-y-4">
                            <button
                                type="submit"
                                disabled={uploading || !file}
                                className="btn-primary w-full h-16 rounded-2xl justify-center text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-primary-500/20 group hover:-translate-y-1 transition-all"
                            >
                                {uploading ? (
                                    <><div className="w-5 h-5 spinner mr-3" /> Transmitindo...</>
                                ) : (
                                    <><Upload size={20} className="mr-3" /> Efetuar Captura</>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/documents')}
                                className="w-full text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                Descartar e Voltar
                            </button>
                        </div>
                    </div>

                    {/* AI Info Card */}
                    <div className="p-6 bg-slate-900 border border-slate-800 rounded-[1.5rem] shadow-inner">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-primary-500/20 rounded-xl">
                                <Info size={20} className="text-primary-400" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-white uppercase tracking-widest">Motor OCR v3.1 Ativado</p>
                                <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase leading-relaxed tracking-tight">
                                    A extração de metadados iniciará imediatamente após a conclusão do upload seguro.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}
