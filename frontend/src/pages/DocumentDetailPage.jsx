import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
    ArrowLeft, Download, FileText, Calendar, Tag, HardDrive,
    Eye, Cpu, Copy, CheckCircle, AlertCircle, ExternalLink, Sparkles,
    Shield, History, User, TrendingUp, Info
} from 'lucide-react'
import { documentsApi, categoriesApi } from '../lib/api'
import { getCategoryInfo, formatDate, formatFileSize, getFileIcon } from '../lib/utils'
import toast from 'react-hot-toast'

function DetailRow({ icon: Icon, label, value, mono = false }) {
    return (
        <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0 group">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-50 text-slate-400 group-hover:text-primary-500 transition-colors">
                    <Icon size={14} strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
            </div>
            <span className={`text-xs font-bold text-slate-700 ${mono ? 'font-mono' : ''} text-right break-all ml-4`}>{value}</span>
        </div>
    )
}

export default function DocumentDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [doc, setDoc] = useState(null)
    const [loading, setLoading] = useState(true)
    const [fileUrl, setFileUrl] = useState(null)
    const [copied, setCopied] = useState(false)
    const [activeTab, setActiveTab] = useState('preview') // preview | text | ai_fields | chat | history
    const [question, setQuestion] = useState('')
    const [chatLoading, setChatLoading] = useState(false)
    const [messages, setMessages] = useState([]) // { role: 'user'|'ai', content: string }
    const [auditLogs, setAuditLogs] = useState([])
    const [dbCategories, setDbCategories] = useState([])
    const [aiFields, setAiFields] = useState(null)
    const [extracting, setExtracting] = useState(false)

    useEffect(() => {
        const load = async () => {
            try {
                const data = await documentsApi.get(id)
                setDoc(data)
                try {
                    const { url } = await documentsApi.getSignedUrl(id)
                    setFileUrl(url)
                } catch { }
                try {
                    const logs = await documentsApi.getAudit(id)
                    setAuditLogs(logs)
                } catch { }
                try {
                    const cats = await categoriesApi.list()
                    setDbCategories(cats)
                } catch { }
            } catch {
                toast.error('Documento não encontrado')
                navigate('/documents')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [id])

    const copyText = () => {
        if (doc?.ocr_text) {
            navigator.clipboard.writeText(doc.ocr_text)
            setCopied(true)
            toast.success('Texto copiado!')
            setTimeout(() => setCopied(false), 2000)
        }
    }

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
                <div className="h-10 w-64 bg-slate-200 rounded-xl" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 h-[600px] bg-slate-100 rounded-[2.5rem]" />
                    <div className="space-y-6">
                        <div className="h-48 bg-slate-100 rounded-[2rem]" />
                        <div className="h-64 bg-slate-100 rounded-[2rem]" />
                    </div>
                </div>
            </div>
        )
    }

    if (!doc) return null
    const cat = getCategoryInfo(doc.category, dbCategories)

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 animate-slide-up pb-20 px-2 lg:px-6">
            {/* Extended Header with Breadcrumbs and Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-8">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-primary-500 hover:border-primary-500/30 transition-all shadow-sm group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${cat.bg} ${cat.color} border border-white shadow-sm`}>
                                {cat.icon} {cat.label}
                            </span>
                            {doc.status === 'processing' ? (
                                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500 text-white animate-pulse">
                                    <Cpu size={10} strokeWidth={3} /> Sincronizando OCR
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                                    <CheckCircle size={10} strokeWidth={3} /> Análise Concluída
                                </span>
                            )}
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none truncate max-w-2xl">
                            {doc.title}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3 lg:self-end">
                    {fileUrl && (
                        <a
                            href={fileUrl}
                            download={doc.filename}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-secondary py-3 px-6 h-12"
                        >
                            <Download size={18} />
                            <span>Extrair Original</span>
                        </a>
                    )}
                    <button className="btn-primary py-3 px-6 h-12 shadow-lg shadow-primary-500/20">
                        <ExternalLink size={18} />
                        <span>Compartilhar</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Main Content Area */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Glass-style Navigation Tabs */}
                    <div className="flex items-center gap-1 p-1.5 bg-slate-100 rounded-[1.5rem] w-fit border border-slate-200 shadow-inner">
                        {[
                            { id: 'preview', label: 'Visualização', icon: Eye },
                            { id: 'ai_fields', label: 'Camos IA', icon: Sparkles },
                            { id: 'text', label: 'Transcrição', icon: FileText },
                            { id: 'chat', label: 'Consultoria', icon: Cpu },
                            { id: 'history', label: 'Auditoria', icon: Shield }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 whitespace-nowrap
                                    ${activeTab === tab.id
                                        ? 'bg-white text-primary-500 shadow-md ring-1 ring-black/5'
                                        : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <tab.icon size={14} strokeWidth={activeTab === tab.id ? 3 : 2} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content Panel */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/20 overflow-hidden relative">
                        {/* Preview Tab */}
                        {activeTab === 'preview' && (
                            <div className="relative animate-fade-in min-h-[700px]">
                                {fileUrl ? (
                                    <>
                                        {/* Dynamic Watermark - More Stylized */}
                                        <div className="absolute inset-0 z-20 pointer-events-none opacity-[0.03] overflow-hidden select-none rotate-[-45deg] flex flex-wrap justify-center content-center pointer-events-none">
                                            {Array(120).fill(0).map((_, i) => (
                                                <div key={i} className="text-[10px] font-black m-6 text-slate-900 uppercase tracking-[0.5em] whitespace-nowrap">
                                                    ARCSCAN • {localStorage.getItem('docsearch_user') ? JSON.parse(localStorage.getItem('docsearch_user')).email : 'CONFIDENCIAL'}
                                                </div>
                                            ))}
                                        </div>

                                        {doc.file_type === 'application/pdf' ? (
                                            <iframe src={`${fileUrl}#toolbar=0`} className="w-full h-[700px] border-0 relative z-10" title={doc.title} />
                                        ) : (
                                            <div className="flex items-center justify-center p-12 bg-slate-50 min-h-[700px]">
                                                <img src={fileUrl} alt={doc.title} className="max-w-full max-h-[600px] rounded-2xl object-contain shadow-2xl border border-white" />
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-40 text-center">
                                        <div className="w-24 h-24 rounded-[2rem] bg-slate-50 flex items-center justify-center mb-6 border border-slate-100 shadow-inner">
                                            <AlertCircle size={40} strokeWidth={1} className="text-slate-300" />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-400 uppercase tracking-tight">Fonte offline</h3>
                                        <p className="text-xs font-bold text-slate-500 mt-2 uppercase tracking-widest leading-relaxed">O arquivo original não pôde ser<br />carregado no visualizador seguro.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* AI Fields Tab */}
                        {activeTab === 'ai_fields' && (
                            <div className="p-10 animate-fade-in space-y-10">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Estrutura de Dados</h3>
                                        <p className="text-slate-500 font-bold text-[10px] mt-1 uppercase tracking-widest">Informações mapeadas pelo motor de IA</p>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            setExtracting(true);
                                            try {
                                                const fields = await documentsApi.extractFields(doc.id);
                                                setAiFields(fields);
                                                toast.success('Mapeamento concluído!');
                                            } catch { toast.error('Falha no mapeamento IA'); }
                                            finally { setExtracting(false); }
                                        }}
                                        disabled={extracting || !doc.ocr_text}
                                        className="btn-primary h-12 px-8 rounded-xl shadow-lg shadow-primary-500/20"
                                    >
                                        {extracting ? <div className="w-4 h-4 spinner mr-2" /> : <Sparkles size={16} className="mr-2" />}
                                        <span className="text-xs font-black uppercase tracking-widest">Re-analisar Documento</span>
                                    </button>
                                </div>

                                {aiFields ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
                                        {Object.entries(aiFields).map(([key, val]) => (
                                            <div key={key} className="p-6 rounded-[1.5rem] bg-slate-50 border border-slate-100 hover:border-primary-500/20 transition-all group">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-2 h-2 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(123,143,242,0.4)]" />
                                                    <p className="text-[10px] uppercase font-black text-slate-400 group-hover:text-primary-500 transition-colors tracking-[0.15em]">{key.replace(/_/g, ' ')}</p>
                                                </div>
                                                <div className="text-sm font-black text-slate-700 bg-white p-4 rounded-xl border border-slate-100 shadow-sm leading-relaxed">
                                                    {typeof val === 'object' && val !== null
                                                        ? JSON.stringify(val, null, 2)
                                                        : (val || 'PENDENTE')}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-24 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                                        <div className="w-20 h-20 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Cpu size={36} className="text-primary-500" />
                                        </div>
                                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">Pronto para Mapeamento</h4>
                                        <p className="text-xs font-bold text-slate-500 mt-3 max-w-sm mx-auto uppercase tracking-widest leading-relaxed">
                                            Inicie o processo de extração para identificar campos específicos como valores, datas e IDs.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Text Content Tab */}
                        {activeTab === 'text' && (
                            <div className="p-10 animate-fade-in h-[700px] flex flex-col">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Transcrição OCR</h3>
                                        <p className="text-slate-500 font-bold text-[10px] mt-1 uppercase tracking-widest">Conteúdo textual bruto identificado no arquivo</p>
                                    </div>
                                    <button onClick={copyText} className="btn-secondary h-10 px-5">
                                        {copied ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                        <span className="text-[10px] font-black uppercase tracking-widest">{copied ? 'Copiado' : 'Copiar Texto'}</span>
                                    </button>
                                </div>

                                <div className="flex-1 bg-slate-50 rounded-[2rem] p-8 border border-slate-100 shadow-inner overflow-y-auto font-mono text-sm leading-relaxed text-slate-600">
                                    {doc.ocr_text || 'Iniciando processamento de texto...'}
                                </div>
                            </div>
                        )}

                        {/* Chat AI Tab */}
                        {activeTab === 'chat' && (
                            <div className="h-[700px] flex flex-col animate-fade-in">
                                <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                                    {messages.length === 0 && (
                                        <div className="h-full flex flex-col items-center justify-center text-center">
                                            <div className="w-24 h-24 bg-primary-500 rounded-[2.5rem] flex items-center justify-center text-white mb-8 shadow-2xl shadow-primary-500/30">
                                                <Cpu size={40} />
                                            </div>
                                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">IA Generativa</h3>
                                            <p className="text-xs font-bold text-slate-500 mt-4 max-w-sm mx-auto uppercase tracking-widest leading-relaxed">
                                                Você pode fazer perguntas complexas sobre o conteúdo, pedir resumos ou tradução.
                                            </p>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12 w-full max-w-2xl px-6">
                                                {[
                                                    'Qual o valor total líquido?',
                                                    'Quais as partes envolvidas?',
                                                    'Resuma as obrigações contratuais',
                                                    'Extraia todas as datas importantes'
                                                ].map(suggest => (
                                                    <button
                                                        key={suggest}
                                                        onClick={() => setQuestion(suggest)}
                                                        className="p-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-black text-slate-600 text-left uppercase tracking-widest hover:border-primary-500 hover:text-primary-500 transition-all shadow-sm group"
                                                    >
                                                        <span className="text-primary-500 mr-2">/</span> {suggest}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {messages.map((m, i) => (
                                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                                            <div className={`max-w-[80%] p-6 rounded-[2rem] text-sm shadow-sm ${m.role === 'user'
                                                ? 'bg-primary-500 text-white font-bold rounded-tr-none'
                                                : 'bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-none font-medium leading-relaxed'
                                                }`}>
                                                {m.content}
                                            </div>
                                        </div>
                                    ))}

                                    {chatLoading && (
                                        <div className="flex justify-start animate-pulse">
                                            <div className="bg-slate-100 p-6 rounded-[2rem] rounded-tl-none border border-slate-200">
                                                <div className="flex gap-2">
                                                    <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" />
                                                    <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                    <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-8 bg-slate-50 border-t border-slate-100">
                                    <form
                                        onSubmit={async (e) => {
                                            e.preventDefault();
                                            if (!question.trim() || chatLoading) return;
                                            const userMsg = question.trim();
                                            setQuestion('');
                                            setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
                                            setChatLoading(true);
                                            try {
                                                const { answer } = await documentsApi.chat(doc.id, userMsg);
                                                setMessages(prev => [...prev, { role: 'ai', content: answer }]);
                                            } catch { toast.error('Falha no motor IA'); }
                                            finally { setChatLoading(false); }
                                        }}
                                        className="relative group"
                                    >
                                        <input
                                            type="text"
                                            className="input h-16 pl-8 pr-20 rounded-[1.5rem] bg-white border-2 border-slate-200 group-focus-within:border-primary-500 transition-all font-bold text-sm"
                                            placeholder="Interaja com os dados do arquivo..."
                                            value={question}
                                            onChange={e => setQuestion(e.target.value)}
                                            disabled={chatLoading}
                                        />
                                        <button
                                            type="submit"
                                            disabled={chatLoading || !question.trim()}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-xl bg-primary-500 text-white flex items-center justify-center shadow-lg shadow-primary-500/20 disabled:grayscale transition-all active:scale-90"
                                        >
                                            <ArrowLeft size={20} strokeWidth={3} className="rotate-180" />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Audit Tab */}
                        {activeTab === 'history' && (
                            <div className="p-10 animate-fade-in space-y-10">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Logs de Compliance</h3>
                                    <p className="text-slate-500 font-bold text-[10px] mt-1 uppercase tracking-widest">Trilha de auditoria completa e imutável</p>
                                </div>

                                <div className="space-y-6">
                                    {auditLogs.length === 0 ? (
                                        <p className="text-slate-400 font-bold text-xs p-10 bg-slate-50 rounded-2xl text-center uppercase tracking-widest border border-slate-100">Nenhum evento registrado</p>
                                    ) : auditLogs.map((log) => (
                                        <div key={log.id} className="p-6 bg-slate-50 rounded-2xl border-l-[6px] border-l-primary-500 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-primary-500">
                                                    <History size={18} strokeWidth={2.5} />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{log.action.replace(/_/g, ' ')}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <User size={12} className="text-slate-400" />
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{log.user_name || 'Sistema'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">{formatDate(log.timestamp)}</span>
                                                <p className="text-[10px] font-bold text-primary-500 bg-primary-500/10 px-2 py-0.5 rounded mt-1 inline-block uppercase">Registro Verificado</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar - Meta & Actions */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Status Management */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <CheckCircle size={14} className="text-primary-500" />
                            Controle de Status
                        </h4>

                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { id: 'pending', label: 'Pendente', bg: 'bg-slate-100', active: 'bg-primary-500 text-white border-primary-500' },
                                { id: 'reviewing', label: 'Revisão', bg: 'bg-amber-50', active: 'bg-amber-500 text-white border-amber-500' },
                                { id: 'approved', label: 'Aprovar', bg: 'bg-emerald-50', active: 'bg-emerald-500 text-white border-emerald-500' },
                                { id: 'rejected', label: 'Rejeitar', bg: 'bg-rose-50', active: 'bg-rose-500 text-white border-rose-500' }
                            ].map(s => (
                                <button
                                    key={s.id}
                                    onClick={async () => {
                                        try {
                                            const updated = await documentsApi.updateStatus(doc.id, s.id, doc.approval_notes);
                                            setDoc(updated);
                                            toast.success(`Definido como ${s.label}`);
                                        } catch { toast.error('Falha na atualização'); }
                                    }}
                                    className={`p-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all
                                        ${doc.approval_status === s.id ? s.active : `${s.bg} border-transparent text-slate-500 hover:border-slate-200`}
                                    `}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>

                        <div className="mt-8">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Notas Internas</label>
                            <textarea
                                className="w-full bg-slate-50 border border-slate-100 rounded-[1.25rem] p-4 text-xs font-bold text-slate-700 outline-none focus:border-primary-500 transition-all min-h-[120px]"
                                placeholder="Notas de conformidade..."
                                defaultValue={doc.approval_notes || ''}
                                onBlur={async (e) => {
                                    if (e.target.value !== doc.approval_notes) {
                                        try {
                                            const updated = await documentsApi.updateStatus(doc.id, doc.approval_status, e.target.value);
                                            setDoc(updated);
                                            toast.success('Notas salvas');
                                        } catch { toast.error('Erro ao salvar'); }
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* Metadata Details */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <Info size={14} className="text-primary-500" />
                            Propriedades
                        </h4>
                        <div className="space-y-1">
                            <DetailRow icon={HardDrive} label="Armazenamento" value={formatFileSize(doc.file_size)} />
                            <DetailRow icon={FileText} label="Tipo de Arquivo" value={doc.file_type?.split('/')[1]?.toUpperCase() || 'DESCONHECIDO'} />
                            <DetailRow icon={Calendar} label="Emissão Original" value={formatDate(doc.created_at)} />
                            <DetailRow icon={TrendingUp} label="Validade" value={formatDate(doc.expires_at) || 'LONGA DURAÇÃO'} mono />
                            <DetailRow icon={History} label="Atualização" value={formatDate(doc.updated_at)} />
                        </div>
                    </div>

                    {/* Security Info */}
                    <div className="bg-primary-50 p-8 rounded-[2.5rem] border border-primary-100 space-y-4">
                        <div className="flex items-center gap-3">
                            <Shield className="text-primary-500" size={24} />
                            <h4 className="text-sm font-black text-slate-700 uppercase tracking-widest">Protocolo Seguro</h4>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight">
                            Este documento está criptografado em repouso. Toda visualização é registrada com marca d'água forense.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
