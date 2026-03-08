import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
    ArrowLeft, Download, FileText, Calendar, Tag, HardDrive,
    Eye, Cpu, Copy, CheckCircle, AlertCircle, ExternalLink, Sparkles,
    Shield, History, User
} from 'lucide-react'
import { documentsApi, categoriesApi } from '../lib/api'
import { getCategoryInfo, formatDate, formatFileSize, getFileIcon } from '../lib/utils'
import toast from 'react-hot-toast'

function DetailRow({ icon: Icon, label, value, mono = false }) {
    return (
        <div className="flex items-start gap-3 py-2.5 border-b border-slate-800/60 last:border-0">
            <Icon size={14} className="text-slate-500 mt-0.5 flex-shrink-0" />
            <span className="text-xs text-slate-500 w-24 flex-shrink-0">{label}</span>
            <span className={`text-sm text-slate-300 ${mono ? 'font-mono text-xs' : ''} break-all`}>{value}</span>
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
    const [activeTab, setActiveTab] = useState('preview') // preview | text | chat | history
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
                // Tentar obter URL do arquivo
                try {
                    const { url } = await documentsApi.getSignedUrl(id)
                    setFileUrl(url)
                } catch {
                    // Mock mode ou erro: URL não disponível
                }
                // Carregar logs de auditoria
                try {
                    const logs = await documentsApi.getAudit(id)
                    setAuditLogs(logs)
                } catch {
                    console.log('Audit logs not supported')
                }
                // Carregar categorias
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
            <div className="max-w-4xl mx-auto space-y-4">
                <div className="skeleton h-8 w-48" />
                <div className="skeleton h-96 rounded-2xl" />
            </div>
        )
    }

    if (!doc) return null
    const cat = getCategoryInfo(doc.category, dbCategories)

    return (
        <div className="max-w-4xl mx-auto space-y-5 animate-slide-up">
            {/* Back + header */}
            <div className="flex items-start gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="btn-ghost p-2 mt-0.5"
                >
                    <ArrowLeft size={18} />
                </button>
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`badge ${cat.bg} ${cat.color} ${cat.border} border`}>
                            {cat.icon} {cat.label}
                        </span>
                        {doc.status === 'processing' && (
                            <span className="badge bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse-slow">
                                <Cpu size={10} /> OCR em andamento
                            </span>
                        )}
                        {doc.status === 'completed' && (
                            <span className="badge bg-green-500/10 text-green-400 border border-green-500/30">
                                <CheckCircle size={10} /> OCR concluído
                            </span>
                        )}
                    </div>
                    <h1 className="text-xl font-bold text-white leading-snug">{doc.title}</h1>

                    {doc.ai_category_suggestion && doc.ai_category_suggestion !== doc.category && (
                        <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-primary-600/10 border border-primary-500/20 text-[10px] text-primary-300">
                            <Sparkles size={12} />
                            A IA sugere que este documento é da categoria <b>{getCategoryInfo(doc.ai_category_suggestion, dbCategories).label}</b>.
                            <button
                                onClick={async () => {
                                    try {
                                        const updated = await documentsApi.updateStatus(doc.id, doc.approval_status, doc.approval_notes, doc.ai_category_suggestion);
                                        // Nota: updateStatus no backend precisa aceitar categoria opcional. Vou ajustar.
                                        setDoc(prev => ({ ...prev, category: doc.ai_category_suggestion }));
                                        toast.success('Categoria atualizada pela sugestão da IA');
                                    } catch { toast.error('Erro ao atualizar categoria'); }
                                }}
                                className="ml-auto underline font-bold"
                            >
                                Alterar agora
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Main content */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Tabs */}
                    <div className="flex gap-1 p-1 bg-surface-800 rounded-xl w-fit overflow-x-auto">
                        {['preview', 'text', 'ai_fields', 'chat', 'history'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${activeTab === tab
                                    ? 'bg-primary-600 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-slate-200'
                                    }`}
                            >
                                {tab === 'preview' ? '👁️ Preview' : tab === 'text' ? '📝 Texto' : tab === 'ai_fields' ? '✨ Campos IA' : tab === 'chat' ? '🤖 Chat' : '🛡️ Logs'}
                            </button>
                        ))}
                    </div>

                    {/* Preview tab with Watermark (Phase 4) */}
                    {activeTab === 'preview' && (
                        <div className="card p-0 overflow-hidden relative group">
                            {fileUrl ? (
                                <>
                                    {/* Marca d'água dinâmica (Phase 4) - Mais visível */}
                                    <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden opacity-[0.08] select-none flex flex-wrap justify-around content-around rotate-[-30deg]">
                                        {Array(80).fill(0).map((_, i) => (
                                            <span key={i} className="text-xs font-bold m-4 whitespace-nowrap text-white">
                                                ARCSCAN - {localStorage.getItem('docsearch_user') ? JSON.parse(localStorage.getItem('docsearch_user')).email : 'CONFIDENCIAL'}
                                            </span>
                                        ))}
                                    </div>

                                    {doc.file_type === 'application/pdf' ? (
                                        <iframe src={fileUrl} className="w-full h-[600px] rounded-2xl relative z-0" title={doc.title} />
                                    ) : (
                                        <div className="flex items-center justify-center p-6 bg-surface-900/50">
                                            <img src={fileUrl} alt={doc.title} className="max-w-full max-h-[560px] rounded-xl object-contain" />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-surface-700 flex items-center justify-center mb-4 border border-slate-700">
                                        <span className="text-3xl">{getFileIcon(doc.file_type)}</span>
                                    </div>
                                    <p className="text-slate-400 font-medium">Visualização não disponível</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* AI Fields tab (Phase 1) */}
                    {activeTab === 'ai_fields' && (
                        <div className="card space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                    <Sparkles size={16} className="text-primary-400" />
                                    Dados Extraídos pela IA
                                </h3>
                                <button
                                    onClick={async () => {
                                        setExtracting(true);
                                        try {
                                            const fields = await documentsApi.extractFields(doc.id);
                                            setAiFields(fields);
                                            toast.success('Informações extraídas com sucesso!');
                                        } catch { toast.error('Erro na extração de campos'); }
                                        finally { setExtracting(false); }
                                    }}
                                    disabled={extracting || !doc.ocr_text}
                                    className="btn-primary text-xs py-1.5 px-3"
                                >
                                    {extracting ? <div className="w-3 h-3 spinner" /> : <Cpu size={12} />}
                                    {extracting ? 'Extraindo...' : 'Extrair Campos'}
                                </button>
                            </div>

                            {aiFields ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 animate-fade-in">
                                    {Object.entries(aiFields).map(([key, val]) => (
                                        <div key={key} className="p-3 rounded-xl bg-surface-900/50 border border-slate-700/50">
                                            <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">{key.replace(/_/g, ' ')}</p>
                                            <p className="text-sm text-slate-200">
                                                {typeof val === 'object' && val !== null
                                                    ? JSON.stringify(val).replace(/["{}]/g, '').replace(/,/g, ', ')
                                                    : (val || '—')}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl">
                                    <Cpu size={32} className="mx-auto mb-3 opacity-20" />
                                    <p className="text-sm">Clique em "Extrair Campos" para que a IA analise<br />os dados essenciais deste documento.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* OCR Text tab */}
                    {activeTab === 'text' && (
                        <div className="card">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                                    <Cpu size={14} className="text-primary-400" />
                                    Texto extraído por OCR
                                </h3>
                                {doc.ocr_text && (
                                    <button onClick={copyText} className="btn-ghost text-xs px-2.5 py-1.5">
                                        {copied ? <CheckCircle size={13} className="text-green-400" /> : <Copy size={13} />}
                                        {copied ? 'Copiado!' : 'Copiar'}
                                    </button>
                                )}
                            </div>

                            {doc.status === 'processing' ? (
                                <div className="flex items-center gap-3 py-8 justify-center text-slate-500">
                                    <div className="w-5 h-5 spinner" />
                                    <span className="text-sm">OCR em processamento...</span>
                                </div>
                            ) : doc.ocr_text ? (
                                <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed bg-surface-900/50 rounded-xl p-4 max-h-96 overflow-y-auto">
                                    {doc.ocr_text}
                                </pre>
                            ) : (
                                <div className="flex items-center gap-2 py-6 justify-center text-slate-500">
                                    <AlertCircle size={16} />
                                    <span className="text-sm">Texto não disponível</span>
                                </div>
                            )}

                            {doc.ocr_text && (
                                <p className="text-xs text-slate-600 mt-3">
                                    {doc.ocr_text.length.toLocaleString()} caracteres extraídos
                                </p>
                            )}
                        </div>
                    )}

                    {/* Chat AI tab */}
                    {activeTab === 'chat' && (
                        <div className="card min-h-[500px] flex flex-col p-0 overflow-hidden">
                            <div className="p-4 border-b border-slate-700/60 flex items-center gap-3 bg-surface-800/20">
                                <div className="w-8 h-8 rounded-lg bg-primary-600/20 flex items-center justify-center">
                                    <Cpu size={16} className="text-primary-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-white">Assistente DocSearch</h3>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">IA Generativa • Analisando {doc.title}</p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px]">
                                {messages.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-8 min-h-[300px]">
                                        <Sparkles size={32} className="text-primary-500/30 mb-4" />
                                        <p className="text-slate-400 font-medium">Como posso ajudar com este documento?</p>
                                        <p className="text-slate-500 text-xs mt-1">Pergunte sobre valores, datas, nomes ou peça um resumo.</p>
                                        <div className="grid grid-cols-1 gap-2 mt-6 w-full max-w-sm">
                                            {[
                                                'Quais os principais valores citados?',
                                                'Quem são as partes envolvidas?',
                                                'Faça um resumo deste documento.'
                                            ].map(suggest => (
                                                <button
                                                    key={suggest}
                                                    type="button"
                                                    onClick={() => { setQuestion(suggest) }}
                                                    className="text-xs text-slate-400 hover:text-primary-400 p-2 rounded-lg bg-surface-900/50 border border-slate-700/50 text-left transition-colors"
                                                >
                                                    "{suggest}"
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {messages.map((m, i) => (
                                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                                        <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${m.role === 'user'
                                            ? 'bg-primary-600 text-white rounded-tr-none'
                                            : 'bg-surface-900 border border-slate-700 text-slate-300 rounded-tl-none'
                                            }`}>
                                            {m.content}
                                        </div>
                                    </div>
                                ))}

                                {chatLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-surface-900 border border-slate-700 p-3 rounded-2xl rounded-tl-none">
                                            <div className="flex gap-1.5">
                                                <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" />
                                                <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    if (!question.trim() || chatLoading) return;

                                    const userMsg = question.trim();
                                    const currentQuestion = userMsg;
                                    setQuestion('');
                                    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
                                    setChatLoading(true);

                                    try {
                                        const { answer } = await documentsApi.chat(doc.id, currentQuestion);
                                        setMessages(prev => [...prev, { role: 'ai', content: answer }]);
                                    } catch (err) {
                                        toast.error('Erro na resposta da IA');
                                    } finally {
                                        setChatLoading(false);
                                    }
                                }}
                                className="p-4 border-t border-slate-700/60 bg-surface-800/50"
                            >
                                <div className="relative">
                                    <input
                                        type="text"
                                        className="input pr-12 text-sm"
                                        placeholder="Pergunte algo sobre o documento..."
                                        value={question}
                                        onChange={e => setQuestion(e.target.value)}
                                        disabled={chatLoading}
                                    />
                                    <button
                                        type="submit"
                                        disabled={chatLoading || !question.trim()}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white disabled:opacity-30 disabled:bg-slate-700 transition-all active:scale-90"
                                    >
                                        <ArrowLeft size={14} className="rotate-180" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Audit History tab */}
                    {activeTab === 'history' && (
                        <div className="card">
                            <h3 className="text-sm font-semibold text-white mb-6 flex items-center gap-2">
                                <Shield size={16} className="text-primary-400" />
                                Trilha de Auditoria e Compliance
                            </h3>

                            <div className="relative space-y-0 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-surface-700">
                                {auditLogs.length === 0 ? (
                                    <p className="text-slate-500 text-sm ml-8 italic">Nenhum registro encontrado.</p>
                                ) : auditLogs.map((log, idx) => (
                                    <div key={log.id} className="relative pl-10 pb-8 last:pb-0 group">
                                        {/* Dot */}
                                        <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-surface-800 border-2 border-surface-700 flex items-center justify-center z-10 group-hover:border-primary-500 transition-colors">
                                            <div className="w-2 h-2 rounded-full bg-primary-500" />
                                        </div>

                                        <div className="flex flex-col">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-400">
                                                    {log.action.replace(/_/g, ' ')}
                                                </span>
                                                <span className="text-[10px] text-slate-500 font-mono">
                                                    {formatDate(log.timestamp)}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 text-xs text-slate-300">
                                                <User size={12} className="text-slate-500" />
                                                <span className="text-slate-400">Usuário:</span>
                                                <span className="font-medium">{log.user_name || log.userName || log.user_id || (log.userId === 'mock-user-id' ? 'Você (Admin)' : log.userId) || 'Desconhecido'}</span>
                                            </div>

                                            {log.details && Object.keys(log.details).length > 0 && (
                                                <div className="mt-2 p-2 rounded-lg bg-surface-900/50 border border-slate-700/50 text-[11px] text-slate-400">
                                                    {log.action === 'STATUS_CHANGE' && (
                                                        <span>Status alterado para <b>{log.details.newStatus}</b>. {log.details.notes}</span>
                                                    )}
                                                    {log.action === 'UPLOAD' && (
                                                        <span>Arquivo <b>{log.details.filename}</b> enviado.</span>
                                                    )}
                                                    {log.action === 'IA_CHAT' && (
                                                        <span>Consultou IA: "{log.details.question}..."</span>
                                                    )}
                                                    {log.action === 'FILE_VIEW' && (
                                                        <span>Visualizou o arquivo original.</span>
                                                    )}
                                                    {log.action === 'DELETE' && (
                                                        <span>Removeu o documento: {log.details.title}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar info */}
                <div className="space-y-4">
                    {/* Approval Section */}
                    <div className="card border-primary-500/20 bg-primary-600/5">
                        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                            <CheckCircle size={16} className="text-primary-400" />
                            Gestão de Status
                        </h3>

                        <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { id: 'pending', label: 'Pendente', color: 'bg-slate-700 text-slate-300' },
                                    { id: 'reviewing', label: 'Em Revisão', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
                                    { id: 'approved', label: 'Aprovado', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
                                    { id: 'rejected', label: 'Rejeitado', color: 'bg-red-500/20 text-red-400 border-red-500/30' }
                                ].map(s => (
                                    <button
                                        key={s.id}
                                        disabled={loading}
                                        onClick={async () => {
                                            try {
                                                const updated = await documentsApi.updateStatus(doc.id, s.id, doc.approval_notes);
                                                setDoc(updated);
                                                toast.success(`Status alterado para ${s.label}`);
                                            } catch {
                                                toast.error('Erro ao atualizar status');
                                            }
                                        }}
                                        className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider transition-all border ${doc.approval_status === s.id
                                            ? `${s.color} ring-1 ring-white/20`
                                            : 'bg-surface-800 text-slate-500 border-slate-700 hover:border-slate-500'
                                            }`}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>

                            <div className="pt-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Observações internas</label>
                                <textarea
                                    className="w-full bg-surface-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-300 focus:border-primary-500 outline-none min-h-[60px]"
                                    placeholder="Adicione notas sobre a aprovação..."
                                    defaultValue={doc.approval_notes || ''}
                                    onBlur={async (e) => {
                                        const val = e.target.value;
                                        if (val !== doc.approval_notes) {
                                            try {
                                                const updated = await documentsApi.updateStatus(doc.id, doc.approval_status, val);
                                                setDoc(updated);
                                                toast.success('Notas atualizadas');
                                            } catch {
                                                toast.error('Erro ao salvar notas');
                                            }
                                        }
                                    }}
                                />
                            </div>

                            {doc.reviewed_at && (
                                <p className="text-[9px] text-slate-600 italic">
                                    Última revisão: {new Date(doc.reviewed_at).toLocaleString()}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                            <FileText size={14} className="text-primary-400" />
                            Informações
                        </h3>
                        <div>
                            <DetailRow icon={Tag} label="Categoria" value={cat.label} />
                            <DetailRow icon={HardDrive} label="Tamanho" value={formatFileSize(doc.file_size)} />
                            <DetailRow icon={FileText} label="Tipo" value={doc.file_type?.split('/')[1]?.toUpperCase() || '—'} />
                            <DetailRow icon={Calendar} label="Vencimento" value={formatDate(doc.expires_at) || '—'} />
                            <DetailRow icon={Calendar} label="Upload" value={formatDate(doc.created_at)} />
                            <DetailRow icon={Calendar} label="Atualizado" value={formatDate(doc.updated_at)} />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="card space-y-2">
                        <h3 className="text-sm font-semibold text-slate-300 mb-3">Ações</h3>
                        {fileUrl && (
                            <a
                                href={fileUrl}
                                download={doc.filename}
                                target="_blank"
                                rel="noreferrer"
                                className="btn-secondary w-full justify-center text-sm"
                            >
                                <Download size={14} />
                                Baixar arquivo
                            </a>
                        )}
                        <Link
                            to={`/search?q=${encodeURIComponent(doc.title.split(' ')[0])}`}
                            className="btn-ghost w-full justify-center text-sm"
                        >
                            <Eye size={14} />
                            Buscar similares
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
