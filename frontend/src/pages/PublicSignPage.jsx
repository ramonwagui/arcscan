import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
    Shield,
    CheckCircle,
    AlertCircle,
    FileSignature,
    MapPin,
    Cpu
} from 'lucide-react'
import { signaturesApi } from '../lib/api'
import { formatFileSize } from '../lib/utils'

export default function PublicSignPage() {
    const { token } = useParams()
    const [payload, setPayload] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    // Status can be 'idle', 'signing', 'success'
    const [status, setStatus] = useState('idle')

    useEffect(() => {
        const fetchPayload = async () => {
            try {
                const data = await signaturesApi.getPublicPayload(token)
                setPayload(data)
            } catch (err) {
                console.error(err)
                setError(err.response?.data?.error || 'Link inválido ou expirado.')
            } finally {
                setLoading(false)
            }
        }
        fetchPayload()
    }, [token])

    const handleSimulateBrySdkSigning = async () => {
        setStatus('signing')
        setTimeout(async () => {
            try {
                await signaturesApi.finalize(token, {
                    ip: '192.168.0.12',
                    location: 'São Paulo, BR',
                    device: navigator.userAgent,
                    certificateMethod: 'A3 Token'
                })
                setStatus('success')
            } catch (err) {
                setError('Falha ao concluir assinatura com o servidor.')
                setStatus('idle')
            }
        }, 2000)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 spinner border-t-primary-500" />
                    <p className="text-slate-400 text-sm font-bold tracking-widest uppercase">
                        Carregando ambiente seguro...
                    </p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
                <div className="bg-slate-800 p-10 rounded-[2.5rem] border border-slate-700 max-w-md text-center shadow-2xl">
                    <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="text-rose-500" size={32} />
                    </div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight mb-2">Acesso Negado</h2>
                    <p className="text-slate-400 text-sm font-bold leading-relaxed">{error}</p>
                </div>
            </div>
        )
    }

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 animate-fade-in">
                <div className="bg-slate-800 p-12 rounded-[2.5rem] border border-emerald-500/30 max-w-lg text-center shadow-[0_0_80px_rgba(16,185,129,0.15)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 blur-xl">
                        <Shield size={200} className="text-emerald-500" />
                    </div>

                    <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce relative z-10">
                        <CheckCircle className="text-emerald-500" size={40} />
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-4 relative z-10">
                        Assinatura Concluída
                    </h2>
                    <p className="text-slate-300 text-sm font-bold leading-relaxed relative z-10">
                        O carimbo de tempo e a criptografia ICP-Brasil foram aplicados com sucesso.
                        Este documento tem agora validade jurídica integral.
                    </p>
                    <p className="text-slate-500 text-xs font-black uppercase tracking-widest mt-8 relative z-10">
                        Você pode fechar esta aba.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col md:flex-row text-white">

            {/* Esquerda: Visualizador do Documento */}
            <div className="flex-1 border-r border-slate-800 flex flex-col relative h-[50vh] md:h-screen">
                <div className="p-6 border-b border-slate-800 bg-slate-900/80 backdrop-blur z-20 absolute top-0 left-0 right-0 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center border border-primary-500/50 text-primary-400">
                            <Shield size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cofre Arcscan</p>
                            <h1 className="text-sm font-bold truncate max-w-sm">{payload?.document?.title}</h1>
                        </div>
                    </div>

                    <div className="hidden md:flex gap-4">
                        <span className="text-xs bg-slate-800 px-3 py-1.5 rounded-lg text-slate-400 font-mono border border-slate-700">
                            {formatFileSize(payload?.document?.file_size || 0)}
                        </span>
                    </div>
                </div>

                <div className="flex-1 bg-slate-950 pt-[90px] relative">
                    {/* Watermark in viewer */}
                    <div className="absolute inset-0 z-10 pointer-events-none opacity-5 overflow-hidden flex flex-wrap justify-center content-center rotate-[-45deg] scale-150">
                        {Array(80).fill(0).map((_, i) => (
                            <div key={i} className="text-sm font-black m-8 text-white uppercase tracking-[0.5em] whitespace-nowrap">
                                CONFIDENCIAL • {payload?.signers?.[0]}
                            </div>
                        ))}
                    </div>
                    {payload?.url && (
                        <iframe
                            src={`${payload.url}#toolbar=0&navpanes=0`}
                            className="w-full h-full border-0 relative z-20 bg-white"
                            title={payload?.document?.title}
                        />
                    )}
                </div>
            </div>

            {/* Direita: Painel de Ação de Assinatura */}
            <div className="w-full md:w-[450px] bg-slate-900 h-screen md:sticky top-0 overflow-y-auto flex flex-col">
                <div className="p-10 flex-1 flex flex-col justify-center">
                    <div className="mb-10 space-y-4">
                        <div className="w-16 h-16 bg-primary-500/20 rounded-[1.5rem] flex items-center justify-center mb-6">
                            <FileSignature className="text-primary-500" size={32} />
                        </div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tight leading-none">
                            Assinatura<br />Digital
                        </h2>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed">
                            Solicitado para análise e concordância de <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded">{payload?.signers?.[0]}</span>.
                        </p>
                    </div>

                    <div className="bg-slate-800/50 rounded-[2rem] border border-slate-700/50 p-6 space-y-6 mb-10">
                        <div className="flex gap-4">
                            <div className="mt-1">
                                <MapPin size={16} className="text-slate-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Rastreio Ativo</p>
                                <p className="text-xs font-bold text-slate-300 leading-relaxed">
                                    Ao assinar, seu IP atual e geolocalização serão anexados ao hash criptográfico para garantir a cadeia de custódia.
                                </p>
                            </div>
                        </div>
                    </div>

                    {status === 'idle' ? (
                        <div className="space-y-4">
                            <button
                                onClick={handleSimulateBrySdkSigning}
                                className="w-full h-16 rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-xl font-bold flex items-center justify-center gap-3 hover:bg-slate-50 hover:scale-[1.02] transition-all"
                            >
                                <Cpu size={20} className="text-primary-600" />
                                INICIAR ASSINATURA GOV.BR
                            </button>

                            <button
                                onClick={handleSimulateBrySdkSigning}
                                className="w-full h-16 rounded-2xl bg-primary-600 text-white border-none shadow-[0_0_40px_rgba(79,70,229,0.3)] font-bold flex items-center justify-center gap-3 hover:bg-primary-500 hover:scale-[1.02] transition-all"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
                                LER CERTIFICADO DO COMPUTADOR (A3)
                            </button>
                        </div>
                    ) : (
                        <div className="w-full h-32 rounded-[2rem] border-2 border-dashed border-primary-500/50 flex flex-col items-center justify-center gap-4 bg-primary-500/10">
                            <div className="flex gap-2">
                                <div className="w-2.5 h-2.5 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <div className="w-2.5 h-2.5 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <div className="w-2.5 h-2.5 bg-primary-500 rounded-full animate-bounce" />
                            </div>
                            <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest">
                                Validando Tokens com o ITI...
                            </p>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-800 text-center">
                    <p className="text-[10px] font-bold text-slate-500 leading-relaxed">
                        Protegido por infraestrutura Arcscan e conformidade ICP-Brasil.
                    </p>
                </div>
            </div>
        </div>
    )
}
