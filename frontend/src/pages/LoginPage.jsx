import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Search, Mail, Lock, Eye, EyeOff, Shield, ScanLine, ArrowRight } from 'lucide-react'
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
                <div className="max-w-[1200px] w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                    {/* Left Side: Branding & AI Value Prop */}
                    <div className="hidden lg:flex flex-col gap-10 pr-12 animate-fade-in">
                        <div className="flex items-center gap-4 text-primary-500 mb-4">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-primary-500 rounded-xl blur opacity-25 group-hover:opacity-40 transition" />
                                <div className="relative size-12 bg-primary-500 rounded-xl flex items-center justify-center text-white shadow-xl shadow-primary-500/20">
                                    <Search size={24} strokeWidth={3} />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-3xl font-black tracking-tighter text-slate-900 leading-none">Arcscan</span>
                                <span className="text-[10px] font-black tracking-[0.3em] uppercase text-primary-500/80 mt-1">Neural Engine</span>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h1 className="text-6xl font-black leading-[1.1] tracking-tighter text-slate-900">
                                Gestão documental <br />
                                <span className="text-primary-500">inteligente</span>
                            </h1>
                            <p className="text-lg text-slate-500 max-w-lg font-medium leading-relaxed">
                                Digitalize, indexe e encontre qualquer documento em segundos com OCR automático e busca textual avançada.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-5 pt-8">
                            {[
                                { icon: Search, title: 'Busca instantânea', desc: 'Encontre arquivos em milissegundos com IA' },
                                { icon: ScanLine, title: 'OCR automático', desc: 'Conversão inteligente de imagem em texto' },
                                { icon: Shield, title: 'Segurança total', desc: 'Proteção de dados e auditoria de ponta a ponta' }
                            ].map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-5 p-5 rounded-[1.5rem] bg-white border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:shadow-primary-500/5 hover:-translate-y-1 group">
                                    <div className="size-12 rounded-2xl bg-slate-50 flex items-center justify-center text-primary-500 border border-slate-100 group-hover:bg-primary-500 group-hover:text-white transition-colors duration-300">
                                        <feature.icon size={22} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">{feature.title}</h3>
                                        <p className="text-xs text-slate-500 mt-1">{feature.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Side: Login Terminal */}
                    <div className="flex justify-center animate-slide-up">
                        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-100 relative overflow-hidden group">

                            {/* Decorative blur */}
                            <div className="absolute -top-24 -right-24 size-48 bg-primary-500/10 blur-[80px] rounded-full" />

                            {/* Mobile identity */}
                            <div className="lg:hidden flex flex-col items-center justify-center gap-2 mb-10">
                                <div className="size-12 bg-primary-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary-500/20">
                                    <Search size={24} strokeWidth={3} />
                                </div>
                                <span className="text-2xl font-black text-slate-900 tracking-tighter mt-2">Arcscan</span>
                            </div>

                            <div className="mb-10 text-center lg:text-left">
                                <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tighter">Entrar</h2>
                                <p className="text-slate-400 font-medium text-sm">Acesse o portal neural Arcscan</p>
                            </div>

                            {isMockMode && (
                                <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col gap-1">
                                    <p className="text-amber-600 text-xs font-black uppercase tracking-widest">⚡ Modo Demonstração</p>
                                    <p className="text-amber-600/70 text-[10px] font-bold">Credenciais automáticas habilitadas. Basta clicar em entrar.</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Assinatura Digital (E-mail)</label>
                                    <div className="relative group/input">
                                        <Mail size={18} strokeWidth={2.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-primary-500 transition-colors" />
                                        <input
                                            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 font-bold text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400"
                                            placeholder="nome@empresa.com"
                                            type="email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Chave de Acesso (Senha)</label>
                                    <div className="relative group/input">
                                        <Lock size={18} strokeWidth={2.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-primary-500 transition-colors" />
                                        <input
                                            className="w-full pl-12 pr-12 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 font-bold text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400"
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

                                <div className="text-center">
                                    <p className="text-slate-400 font-bold text-xs">
                                        Novo por aqui?
                                        <Link className="text-primary-500 font-black hover:underline ml-2 uppercase tracking-widest" to="/register">Crie sua base</Link>
                                    </p>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="py-10 px-6 border-t border-slate-100 bg-white transition-colors">
                <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-slate-400 text-[11px] font-bold uppercase tracking-widest">
                    <p>© 2024 Arcscan — Neural Document Engine</p>
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
