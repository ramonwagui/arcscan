import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Search, Eye, EyeOff, FileSearch, Lock, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
    const { signIn, isMockMode } = useAuth()
    const navigate = useNavigate()
    const [email, setEmail] = useState(isMockMode ? 'demo@docsearch.local' : '')
    const [password, setPassword] = useState(isMockMode ? 'demo123' : '')
    const [showPass, setShowPass] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!email || !password) return

        setLoading(true)
        try {
            await signIn(email, password)
            toast.success('Bem-vindo ao DocSearch!')
            navigate('/dashboard')
        } catch (err) {
            toast.error(err.message || 'Erro ao entrar')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-surface-900 flex" style={{
            background: 'radial-gradient(ellipse at top left, rgba(79,70,229,0.15) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(99,102,241,0.1) 0%, transparent 50%), #0f172a'
        }}>
            {/* Left panel */}
            <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 border-r border-slate-800/60">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center glow-primary">
                        <Search size={20} className="text-white" />
                    </div>
                    <span className="text-xl font-bold text-white">DocSearch</span>
                </div>

                <div className="space-y-8">
                    <div>
                        <h2 className="text-4xl font-bold text-white leading-tight mb-4">
                            Gestão documental<br />
                            <span className="text-primary-400">inteligente</span>
                        </h2>
                        <p className="text-slate-400 text-lg leading-relaxed">
                            Digitalize, indexe e encontre qualquer documento em segundos com OCR automático e busca textual avançada.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {[
                            { icon: '🔍', title: 'Busca instantânea', desc: 'Encontre documentos por palavras-chave no conteúdo' },
                            { icon: '🤖', title: 'OCR automático', desc: 'Extração de texto de PDFs e imagens escaneadas' },
                            { icon: '🔒', title: 'Segurança total', desc: 'Acesso restrito aos seus próprios documentos' },
                        ].map(f => (
                            <div key={f.title} className="flex items-start gap-3">
                                <span className="text-2xl">{f.icon}</span>
                                <div>
                                    <p className="text-sm font-semibold text-slate-200">{f.title}</p>
                                    <p className="text-sm text-slate-500">{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="text-slate-600 text-sm">© 2024 DocSearch — Todos os direitos reservados</p>
            </div>

            {/* Right panel (form) */}
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-md animate-slide-up">
                    {/* Mobile logo */}
                    <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
                        <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
                            <Search size={18} className="text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">DocSearch</span>
                    </div>

                    <div className="card">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-white">Entrar</h2>
                            <p className="text-slate-400 text-sm mt-1">Acesse sua conta DocSearch</p>
                        </div>

                        {isMockMode && (
                            <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                                <p className="text-amber-400 text-sm font-semibold">⚡ Modo demonstração ativo</p>
                                <p className="text-amber-500/80 text-xs mt-1">Credenciais pré-preenchidas. Clique em Entrar.</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-300 mb-1.5 block">E-mail</label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        id="login-email"
                                        type="email"
                                        className="input pl-10"
                                        placeholder="seu@email.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-300 mb-1.5 block">Senha</label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        id="login-password"
                                        type={showPass ? 'text' : 'password'}
                                        className="input pl-10 pr-10"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(!showPass)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                    >
                                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                id="login-submit"
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full justify-center py-3 mt-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 spinner" />
                                        Entrando...
                                    </>
                                ) : 'Entrar'}
                            </button>
                        </form>

                        <p className="text-center text-slate-500 text-sm mt-5">
                            Não tem conta?{' '}
                            <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium">
                                Criar conta
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
