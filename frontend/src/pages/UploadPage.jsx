import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { documentsApi } from '../lib/api'
import { CATEGORIES } from '../lib/utils'
import toast from 'react-hot-toast'

const ACCEPTED = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
const MAX_SIZE = 10 * 1024 * 1024

function FilePreview({ file, onRemove }) {
    const isImage = file.type.startsWith('image/')
    const url = isImage ? URL.createObjectURL(file) : null

    return (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-700/50 border border-slate-700/60">
            {url ? (
                <img src={url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
            ) : (
                <div className="w-12 h-12 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">📄</span>
                </div>
            )}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button onClick={onRemove} className="text-slate-500 hover:text-red-400 transition-colors p-1">
                <X size={16} />
            </button>
        </div>
    )
}

export default function UploadPage() {
    const navigate = useNavigate()
    const [file, setFile] = useState(null)
    const [title, setTitle] = useState('')
    const [category, setCategory] = useState('outros')
    const [dragOver, setDragOver] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [error, setError] = useState('')

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
        // Auto-preencher título com nome do arquivo (sem extensão)
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

        try {
            await documentsApi.upload(formData, (pct) => setProgress(pct))
            toast.success('Documento enviado! OCR iniciado em segundo plano.')
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
        <div className="max-w-2xl mx-auto animate-slide-up">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Upload size={22} className="text-primary-400" />
                    Enviar Documento
                </h1>
                <p className="text-slate-400 text-sm mt-0.5">
                    PDF, JPG ou PNG — até 10MB. OCR automático após upload.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Drop zone */}
                <div
                    className={`drop-zone cursor-pointer transition-all ${dragOver ? 'active' : ''} ${file ? 'border-green-500/50 bg-green-500/5' : ''}`}
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
                        <div className="flex flex-col items-center gap-3 py-4">
                            <div className="w-14 h-14 rounded-2xl bg-primary-600/20 border border-primary-500/30 flex items-center justify-center">
                                <Upload size={24} className="text-primary-400" />
                            </div>
                            <div>
                                <p className="text-slate-300 font-semibold">
                                    Arraste o arquivo aqui ou <span className="text-primary-400">clique para selecionar</span>
                                </p>
                                <p className="text-slate-500 text-sm mt-1 text-center">PDF, JPG ou PNG — máximo 10MB</p>
                            </div>
                            <div className="flex items-center gap-4 mt-2">
                                {['PDF', 'JPG', 'PNG'].map(type => (
                                    <span key={type} className="px-2.5 py-1 rounded-lg bg-surface-700 text-xs font-mono text-slate-400 border border-slate-700">
                                        .{type.toLowerCase()}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="py-2">
                            <div className="flex items-center gap-2 mb-3">
                                <CheckCircle size={16} className="text-green-400" />
                                <span className="text-sm font-medium text-green-400">Arquivo selecionado</span>
                            </div>
                            <FilePreview file={file} onRemove={() => { setFile(null); setTitle('') }} />
                        </div>
                    )}
                </div>

                {/* Title */}
                <div>
                    <label className="text-sm font-medium text-slate-300 mb-1.5 block">
                        Título do documento <span className="text-red-400">*</span>
                    </label>
                    <input
                        id="doc-title"
                        type="text"
                        className="input"
                        placeholder="Ex: Contrato de Prestação de Serviços 2024"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        required
                    />
                </div>

                {/* Category */}
                <div>
                    <label className="text-sm font-medium text-slate-300 mb-1.5 block">Categoria</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.value}
                                type="button"
                                onClick={() => setCategory(cat.value)}
                                className={`p-3 rounded-xl border text-left transition-all duration-200 ${category === cat.value
                                        ? `${cat.bg} ${cat.border} border ${cat.color}`
                                        : 'bg-surface-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                    }`}
                            >
                                <div className="text-lg mb-1">{cat.icon}</div>
                                <div className="text-xs font-medium">{cat.label}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* OCR info */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-primary-600/10 border border-primary-500/20">
                    <Info size={16} className="text-primary-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-primary-300">OCR automático</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Após o upload, o sistema extrai automaticamente o texto do documento usando OCR. O processamento ocorre em segundo plano e pode levar alguns segundos.
                        </p>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                        <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                        <p className="text-sm text-red-400">{error}</p>
                    </div>
                )}

                {/* Progress */}
                {uploading && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                            <span className="flex items-center gap-2">
                                <div className="w-3.5 h-3.5 spinner" />
                                Enviando documento...
                            </span>
                            <span>{progress}%</span>
                        </div>
                        <div className="h-1.5 bg-surface-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary-600 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Submit */}
                <div className="flex gap-3">
                    <button
                        id="upload-submit"
                        type="submit"
                        disabled={uploading || !file}
                        className="btn-primary flex-1 justify-center py-3"
                    >
                        {uploading ? (
                            <><div className="w-4 h-4 spinner" /> Enviando...</>
                        ) : (
                            <><Upload size={16} /> Enviar Documento</>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/documents')}
                        className="btn-secondary"
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    )
}
