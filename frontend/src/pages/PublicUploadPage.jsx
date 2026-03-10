import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
    Upload, FileText, CheckCircle, AlertCircle,
    ArrowRight, Loader2, ShieldCheck, Clock, X
} from 'lucide-react'
import { docRequestsApi } from '../lib/api'
import toast from 'react-hot-toast'

export default function PublicUploadPage() {
    const { token } = useParams()
    const [request, setRequest] = useState(null)
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [uploadSuccess, setUploadSuccess] = useState(false)
    const [files, setFiles] = useState([])
    const [senderName, setSenderName] = useState('')
    const [senderEmail, setSenderEmail] = useState('')

    useEffect(() => {
        const fetchRequestDetails = async () => {
            try {
                const data = await docRequestsApi.getPublic(token)
                setRequest(data)
            } catch (error) {
                toast.error(error.response?.data?.error || 'Link inválido ou expirado.')
            } finally {
                setLoading(false)
            }
        }
        fetchRequestDetails()
    }, [token])

    const handleFileChange = (e) => {
        const selected = Array.from(e.target.files)
        if (selected.length > 0) {
            setFiles(prev => [...prev, ...selected])
        }
    }

    const removeFile = (indexToRemove) => {
        setFiles(prev => prev.filter((_, index) => index !== indexToRemove))
    }

    const handleUpload = async () => {
        if (files.length === 0) {
            toast.error('Por favor, selecione pelo menos um arquivo.')
            return
        }
        if (!senderName || !senderEmail) {
            toast.error('Por favor, preencha seu nome e e-mail para identificação.')
            return
        }

        setUploading(true)
        try {
            for (const file of files) {
                const formData = new FormData()
                formData.append('file', file)
                formData.append('title', `${request.title} - ${file.name}`)
                formData.append('category', request.category || 'Outros')
                formData.append('sender_name', senderName)
                formData.append('sender_email', senderEmail)

                // Using dedicated public endpoint
                await docRequestsApi.publicUpload(token, formData)
            }

            setUploadSuccess(true)
            toast.success('Documentos enviados com sucesso!')
        } catch (error) {
            console.error('Upload error:', error)
            toast.error('Falha ao enviar documentos.')
        } finally {
            setUploading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        )
    }

    if (!request) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
                <h1 className="text-2xl font-bold text-white mb-2">Link Invalido</h1>
                <p className="text-slate-400 max-w-md">Este link de solicitação de documentos não existe ou já expirou por segurança.</p>
            </div>
        )
    }

    if (uploadSuccess) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="w-10 h-10 text-emerald-500" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-3">Envio Concluído!</h1>
                <p className="text-slate-400 max-w-md text-lg">
                    Obrigado! O documento foi recebido com sucesso e já está disponível para processamento interno no Arcscan.
                </p>
                <div className="mt-8 pt-8 border-t border-slate-800 w-full max-w-xs">
                    <p className="text-slate-500 text-sm italic">Você pode fechar esta aba agora.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col">
            {/* Header branding */}
            <header className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-950/50 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <ShieldCheck className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-white font-bold text-xl tracking-tight">ARCSCAN</span>
                        <div className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase leading-none">Safe Drop</div>
                    </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-slate-400 text-sm">
                    <Clock className="w-4 h-4 text-emerald-500" />
                    Link Protegido • SSL Ativo
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
                <div className="w-full max-w-2xl bg-slate-900/50 border border-white/10 rounded-3xl p-8 lg:p-12 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                    {/* Abstract background glow */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full"></div>
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full"></div>

                    <div className="relative">
                        <div className="mb-10 text-center md:text-left flex flex-col md:items-start items-center">
                            <img src="/logo-cliente.png" alt="Logo" className="h-16 w-auto object-contain mb-8" />
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-indigo-500/20">
                                <FileText className="w-3 h-3" />
                                Solicitação de Envio
                            </div>
                            <h1 className="text-4xl font-bold text-white mb-4 leading-tight">{request.title}</h1>
                            <p className="text-slate-400 text-lg leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5">
                                {request.description || "Por favor, selecione e envie os arquivos solicitados abaixo. O processo é seguro e criptografado."}
                            </p>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Seu Nome Completo</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: João da Silva"
                                        value={senderName}
                                        onChange={(e) => setSenderName(e.target.value)}
                                        className="w-full px-4 h-12 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder:text-slate-600 transition-all outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Seu E-mail</label>
                                    <input
                                        type="email"
                                        placeholder="Ex: joao@email.com"
                                        value={senderEmail}
                                        onChange={(e) => setSenderEmail(e.target.value)}
                                        className="w-full px-4 h-12 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder:text-slate-600 transition-all outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {files.length === 0 ? (
                            <label className="group relative block cursor-pointer">
                                <input type="file" className="hidden" multiple onChange={handleFileChange} />
                                <div className="aspect-[16/6] rounded-2xl border-2 border-dashed border-white/10 group-hover:border-indigo-500/50 bg-white/[0.02] flex flex-col items-center justify-center transition-all duration-300 group-active:scale-[0.98]">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500 text-slate-400">
                                        <Upload className="w-8 h-8" />
                                    </div>
                                    <div className="text-white font-semibold text-lg mb-1">Selecionar Documentos</div>
                                    <p className="text-slate-500 text-sm">Pode selecionar múltiplos arquivos (PDF, Imagens)</p>
                                </div>
                            </label>
                        ) : (
                            <div className="space-y-6">
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {files.map((file, idx) => (
                                        <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 animate-slide-up">
                                            <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400 flex-shrink-0">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-white font-medium truncate">{file.name}</div>
                                                <div className="text-slate-500 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                                            </div>
                                            <button
                                                onClick={() => removeFile(idx)}
                                                className="text-slate-500 hover:text-rose-400 transition-colors p-2"
                                                title="Remover"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <label className="block w-full text-center p-3 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 rounded-xl cursor-pointer transition-colors font-bold text-sm">
                                    + Adicionar mais arquivos
                                    <input type="file" className="hidden" multiple onChange={handleFileChange} />
                                </label>

                                <button
                                    onClick={handleUpload}
                                    disabled={uploading}
                                    className="w-full h-16 mt-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/40"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                            Enviando {files.length} arquivos...
                                        </>
                                    ) : (
                                        <>
                                            Confirmar e Enviar {files.length} {files.length === 1 ? 'arquivo' : 'arquivos'}
                                            <ArrowRight className="w-6 h-6" />
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        <div className="mt-12 flex items-center justify-center gap-8 border-t border-white/5 pt-8">
                            <div className="flex flex-col items-center gap-1 opacity-40">
                                <div className="text-[10px] text-white font-bold uppercase tracking-tighter">Powered by</div>
                                <div className="text-sm text-white font-black tracking-widest leading-none">ARCSCAN</div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
