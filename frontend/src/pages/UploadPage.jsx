import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, X, CheckCircle, AlertCircle, Info, Tag, TrendingUp, Layers } from 'lucide-react'
import { documentsApi, categoriesApi } from '../lib/api'
import toast from 'react-hot-toast'

const ACCEPTED = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
const MAX_SIZE = 10 * 1024 * 1024

function FilePreview({ file, onRemove }) {
    const isImage = file.type.startsWith('image/')
    const url = isImage ? URL.createObjectURL(file) : null

    return (
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm animate-fade-in group">
            <div className="relative">
                {url ? (
                    <img src={url} alt="" className="w-16 h-16 rounded-xl object-cover border border-slate-100 shadow-sm" />
                ) : (
                    <div className="w-16 h-16 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center">
                        <FileText size={24} className="text-primary-500" />
                    </div>
                )}
                <div className="absolute -top-2 -right-2">
                    <button
                        type="button"
                        onClick={onRemove}
                        className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg hover:bg-rose-600 transition-colors border-2 border-white"
                    >
                        <X size={12} strokeWidth={3} />
                    </button>
                </div>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-900 truncate uppercase tracking-tight">{file.name}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{(file.size / 1024).toFixed(1)} KB • {file.type.split('/')[1].toUpperCase()}</p>
            </div>
        </div>
    )
}

export default function UploadPage() {
    const navigate = useNavigate()
    const [files, setFiles] = useState([])
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
            return `O arquivo "${f.name}" tem formato não suportado.`
        }
        if (f.size > MAX_SIZE) {
            return `O arquivo "${f.name}" é muito grande (Máx: 10MB).`
        }
        return null
    }

    const handleFiles = (incomingFiles) => {
        const validFiles = []
        let hasErrors = false

        Array.from(incomingFiles).forEach(f => {
            const err = validateFile(f)
            if (err) {
                toast.error(err)
                hasErrors = true
            } else {
                validFiles.push(f)
            }
        })

        if (validFiles.length > 0) {
            setFiles(prev => {
                const updated = [...prev, ...validFiles]
                // Se só tem 1 arquivo no final e o title está vazio, autocompleta
                if (updated.length === 1 && !title) {
                    setTitle(updated[0].name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '))
                }
                return updated
            })
            setError('')
        }
    }

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    const onDrop = useCallback((e) => {
        e.preventDefault()
        setDragOver(false)
        if (e.dataTransfer.files?.length > 0) {
            handleFiles(e.dataTransfer.files)
        }
    }, [title])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (files.length === 0) { toast.error('Selecione pelo menos um arquivo'); return }
        if (files.length === 1 && !title.trim()) { toast.error('O título é obrigatório'); return }

        setUploading(true)
        setProgress(0)
        setError('')

        let successCount = 0
        let totalFiles = files.length

        for (let i = 0; i < totalFiles; i++) {
            const file = files[i]
            const formData = new FormData()
            formData.append('file', file)

            // Definição do título (personalizado se for único, original se múltiplo)
            const fileTitle = totalFiles === 1 ? title.trim() : file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
            formData.append('title', fileTitle)
            formData.append('category', category)
            if (expiresAt) formData.append('expiresAt', expiresAt)

            try {
                await documentsApi.upload(formData, (pct) => {
                    const overallPct = Math.round(((i * 100) + pct) / totalFiles)
                    setProgress(overallPct)
                })
                successCount++
            } catch (err) {
                toast.error(`Falha ao enviar: ${file.name}`)
                console.error(err)
            }
        }

        setUploading(false)

        if (successCount === totalFiles) {
            toast.success(`${successCount} documento(s) enviado(s) com sucesso!`)
            navigate('/documents')
        } else if (successCount > 0) {
            toast.success(`Parcial: ${successCount} de ${totalFiles} documentos enviados.`)
            setFiles(files.slice(successCount))
            setProgress(0)
        } else {
            setError('Nenhum documento pôde ser enviado. Verifique a conexão e o servidor.')
        }
    }

    return (
        <div className="max-w-4xl mx-auto animate-slide-up pb-20">
            <div className="text-center mb-12">
                <div className="w-20 h-20 bg-primary-500 rounded-[2rem] flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-primary-500/20 animate-bounce-slow">
                    <Layers size={32} strokeWidth={2.5} />
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">
                    Lote de <span className="text-primary-500">Captura</span>
                </h1>
                <p className="text-slate-500 font-bold text-sm mt-4 uppercase tracking-[0.2em]">
                    Upload Múltiplo Simultâneo
                </p>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-7 space-y-8">
                    <div
                        className={`relative group rounded-[2.5rem] border-4 border-dashed transition-all duration-500 flex flex-col items-center justify-center p-8 text-center min-h-[300px]
                            ${dragOver ? 'border-primary-500 bg-primary-50/50 scale-[1.02]' : 'border-slate-200 bg-white'}
                            ${files.length > 0 ? 'border-emerald-500/30' : ''}
                        `}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={onDrop}
                    >
                        <input
                            id="file-input"
                            type="file"
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={e => { if (e.target.files?.length > 0) handleFiles(e.target.files) }}
                        />

                        {files.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full cursor-pointer w-full" onClick={() => document.getElementById('file-input').click()}>
                                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary-500 group-hover:text-white transition-all duration-300 shadow-sm">
                                    <Upload size={28} strokeWidth={2.5} className="text-slate-400 group-hover:text-white" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Arraste seus Arquivos</h3>
                                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-8">Ou clique para selecionar vários</p>

                                <div className="flex flex-wrap justify-center gap-3">
                                    {['PDF', 'JPG', 'PNG'].map(type => (
                                        <span key={type} className="px-4 py-2 rounded-xl bg-slate-50 text-[10px] font-black text-slate-400 border border-slate-100 uppercase tracking-widest group-hover:border-primary-500/20 transition-all">
                                            {type} format
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="w-full flex flex-col h-full animate-fade-in">
                                <div className="flex items-center justify-between mb-4 px-2">
                                    <div className="flex items-center gap-2 text-emerald-500">
                                        <CheckCircle size={18} fill="currentColor" className="text-white" />
                                        <span className="text-xs font-black uppercase tracking-widest">{files.length} Lote(s) em Fila</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => document.getElementById('file-input').click()}
                                        className="text-[10px] font-black uppercase tracking-widest text-primary-500 hover:text-primary-600 bg-primary-50 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        + Adicionar Mais
                                    </button>
                                </div>

                                <div className="w-full max-h-[220px] overflow-y-auto pr-2 space-y-3 custom-scrollbar text-left">
                                    {files.map((f, index) => (
                                        <FilePreview key={`${f.name}-${index}`} file={f} onRemove={() => removeFile(index)} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {uploading && (
                        <div className="p-8 bg-white rounded-[2rem] border border-slate-200 shadow-sm animate-fade-in">
                            <div className="flex justify-between items-end mb-4">
                                <div>
                                    <p className="text-[10px] font-black text-primary-500 uppercase tracking-[0.2em]">Upload em lote em curso</p>
                                    <h4 className="text-lg font-black text-slate-900 tracking-tight leading-none mt-1">Sincronizando Múltiplos</h4>
                                </div>
                                <span className="text-xl font-black text-primary-500">{progress}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                                <div className="bg-primary-500 h-full rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(123,143,242,0.3)]" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-8">
                        {files.length <= 1 ? (
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Nome de Identificação</label>
                                <input
                                    type="text"
                                    className="input h-14 px-6 rounded-2xl text-sm font-bold placeholder:font-normal"
                                    placeholder="Ex: NOTA FISCAL SERV-042"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    required={files.length === 1}
                                    disabled={files.length === 0}
                                />
                            </div>
                        ) : (
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                                <div className="p-1.5 bg-slate-200/50 rounded-lg text-slate-400">
                                    <Layers size={16} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-600 uppercase tracking-widest">Renomeação Automática</p>
                                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase leading-relaxed tracking-tight">Em submissões múltiplas, o nome original de cada arquivo será utilizado provisoriamente como título de identificação e logo mais processado pela I.A.</p>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Validade Padrão do Lote (Opcional)</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    className="input h-14 px-6 rounded-2xl text-sm font-bold"
                                    value={expiresAt}
                                    onChange={e => setExpiresAt(e.target.value)}
                                    disabled={files.length === 0}
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <TrendingUp size={18} />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Classificação Inteligente Padrão</label>
                            <div className="grid grid-cols-2 gap-3">
                                {dbCategories.map(cat => (
                                    <button
                                        key={cat.slug}
                                        type="button"
                                        onClick={() => setCategory(cat.slug)}
                                        disabled={files.length === 0}
                                        className={`p-4 rounded-2xl border-2 text-left transition-all duration-300 flex flex-col gap-2 relative overflow-hidden group
                                            ${category === cat.slug
                                                ? 'border-primary-500 bg-primary-500/5 shadow-lg shadow-primary-500/5'
                                                : 'border-slate-100 hover:border-slate-200'}
                                            ${files.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}
                                        `}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors
                                            ${category === cat.slug ? 'bg-primary-500 text-white' : 'bg-slate-50 text-slate-400 group-hover:text-primary-500'}
                                        `}>
                                            <Tag size={16} strokeWidth={2.5} />
                                        </div>
                                        <span className={`text-[11px] font-black uppercase tracking-tight
                                            ${category === cat.slug ? 'text-primary-500' : 'text-slate-600'}
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

                        {error && (
                            <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-500 animate-shake">
                                <AlertCircle size={20} />
                                <p className="text-xs font-bold leading-tight uppercase tracking-tight">{error}</p>
                            </div>
                        )}

                        <div className="pt-4 space-y-4">
                            <button
                                type="submit"
                                disabled={uploading || files.length === 0}
                                className="btn-primary w-full h-16 rounded-2xl justify-center text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-primary-500/20 group hover:-translate-y-1 transition-all disabled:hover:translate-y-0"
                            >
                                {uploading ? (
                                    <><div className="w-5 h-5 spinner mr-3" /> Transmitindo Lote...</>
                                ) : (
                                    <><Upload size={20} className="mr-3" /> Submeter {(files.length || '')} {(files.length > 1 ? 'Arquivos' : 'Arquivo')}</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}
