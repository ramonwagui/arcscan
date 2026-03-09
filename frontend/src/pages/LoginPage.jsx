import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
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
            toast.success('Bem-vindo ao Arcscan!')
            navigate('/dashboard')
        } catch (err) {
            toast.error(err.message || 'Erro ao entrar')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-surface-50 flex flex-col font-sans transition-colors duration-500">
            <main className="flex-grow flex items-center justify-center p-4 md:p-8 lg:p-12">
                <div className="flex justify-center animate-slide-up w-full">
                    <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-100 relative overflow-hidden group">

                        <div className="absolute -top-24 -right-24 size-48 bg-primary-500/10 blur-[80px] rounded-full" />

                        <div className="flex flex-col items-center justify-center gap-3 mb-10">
                            <img src="/logo.png" alt="NC Convênios" className="h-24 w-auto object-contain" />
                            <p className="text-[10px] font-black text-primary-500 uppercase tracking-[0.3em] opacity-80">Neural Engine Documents Scan</p>
                        </div>

                        <div className="mb-10 text-center">
                            <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tighter">Entrar</h2>
                            <p className="text-slate-400 font-medium text-sm">Acesse o portal neural Arcscan</p>
                        </div>

                        {isMockMode && (
                            <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col gap-1 text-center">
                                <p className="text-amber-600 text-xs font-black uppercase tracking-widest">⚡ Modo Demonstração</p>
                                <p className="text-amber-600/70 text-[10px] font-bold">Credenciais automáticas habilitadas. Basta clicar em entrar.</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2 text-center">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Assinatura Digital (E-mail)</label>
                                <div className="relative group/input">
                                    <Mail size={18} strokeWidth={2.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-primary-500 transition-colors" />
                                    <input
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 font-bold text-sm text-center focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400"
                                        placeholder="nome@empresa.com"
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 text-center">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Chave de Acesso (Senha)</label>
                                <div className="relative group/input">
                                    <Lock size={18} strokeWidth={2.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-primary-500 transition-colors" />
                                    <input
                                        className="w-full pl-12 pr-12 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 font-bold text-sm text-center focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400"
                                        placeholder="••••••••"
                                        type={showPass ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(!showPass)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-500 transition-colors"
                                    >
                                        {showPass ? <EyeOff size={18} strokeWidth={2.5} /> : <Eye size={18} strokeWidth={2.5} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pb-2">
                                <label className="flex items-center gap-2 cursor-pointer group/check">
                                    <input type="checkbox" className="size-4 rounded border-slate-200 text-primary-500 focus:ring-primary-500/20 bg-slate-50 transition-all" />
                                    <span className="text-xs font-bold text-slate-500 group-hover/check:text-slate-900">Lembrar acesso</span>
                                </label>
                                <a className="text-xs font-black text-primary-500 hover:text-primary-600 transition-colors uppercase tracking-widest" href="#">Redefinir</a>
                            </div>

                            <button
                                className="w-full bg-primary-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-primary-500/10 hover:shadow-primary-500/20 hover:bg-primary-600 active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs disabled:opacity-50"
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processando
                                    </>
                                ) : (
                                    <>
                                        Acessar Sistema
                                        <ArrowRight size={16} strokeWidth={3} />
                                    </>
                                )}
                            </button>

                            <div className="relative my-10">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                                <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.3em] text-slate-400 bg-white px-4">Conexão Segura</div>
                            </div>
                        </form>
                    </div>
                </div>
            </main>

            <footer className="py-10 px-6 border-t border-slate-100 bg-white transition-colors">
                <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-slate-400 text-[11px] font-bold uppercase tracking-widest">
                    <p>© {new Date().getFullYear()} Arcscan — Neural Engine Documents Scan</p>
                    <div className="flex gap-8">
                        <a className="hover:text-primary-500 transition-colors" href="#">Diretrizes</a>
                        <a className="hover:text-primary-500 transition-colors" href="#">Privacidade</a>
                        <a className="hover:text-primary-500 transition-colors" href="#">Terminal de Suporte</a>
                    </div>
                </div>
            </footer>
        </div>
    )
}
