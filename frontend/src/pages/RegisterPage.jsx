import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Search, Eye, EyeOff, Lock, Mail, User, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RegisterPage() {
    const { signUp } = useAuth()
    const navigate = useNavigate()
    const [form, setForm] = useState({ name: '', email: '', organization: '', password: '', confirm: '' })
    const [showPass, setShowPass] = useState(false)
    const [loading, setLoading] = useState(false)

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (form.password !== form.confirm) {
            toast.error('As senhas não coincidem')
            return
        }
        if (form.password.length < 6) {
            toast.error('Senha deve ter pelo menos 6 caracteres')
            return
        }

        setLoading(true)
        try {
            await signUp(form.email, form.password, form.name, form.organization)
            toast.success('Conta criada! Bem-vindo ao DocSearch!')
            navigate('/dashboard')
        } catch (err) {
            toast.error(err.message || 'Erro ao criar conta')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-surface-900 flex items-center justify-center p-6" style={{
            background: 'radial-gradient(ellipse at top right, rgba(79,70,229,0.15) 0%, transparent 50%), #0f172a'
        }}>
            <div className="w-full max-w-md animate-slide-up">
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
                        <Search size={18} className="text-white" />
                    </div>
                    <span className="text-xl font-bold text-white">DocSearch</span>
                </div>

                <div className="card">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-white">Criar conta</h2>
                        <p className="text-slate-400 text-sm mt-1">Comece a usar o DocSearch gratuitamente</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-slate-300 mb-1.5 block">Nome completo</label>
                                <div className="relative">
                                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input id="reg-name" type="text" className="input pl-10" placeholder="Seu nome" value={form.name} onChange={set('name')} required />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-300 mb-1.5 block">Organização</label>
                                <div className="relative">
                                    <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input id="reg-org" type="text" className="input pl-10" placeholder="Prefeitura, empresa..." value={form.organization} onChange={set('organization')} />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-300 mb-1.5 block">E-mail</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input id="reg-email" type="email" className="input pl-10" placeholder="seu@email.com" value={form.email} onChange={set('email')} required />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-slate-300 mb-1.5 block">Senha</label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        id="reg-password"
                                        type={showPass ? 'text' : 'password'}
                                        className="input pl-10 pr-10"
                                        placeholder="••••••••"
                                        value={form.password}
                                        onChange={set('password')}
                                        required
                                    />
                                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-300 mb-1.5 block">Confirmar senha</label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        id="reg-confirm"
                                        type={showPass ? 'text' : 'password'}
                                        className="input pl-10"
                                        placeholder="••••••••"
                                        value={form.confirm}
                                        onChange={set('confirm')}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <button id="reg-submit" type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2">
                            {loading ? <><div className="w-4 h-4 spinner" />Criando conta...</> : 'Criar conta'}
                        </button>
                    </form>

                    <p className="text-center text-slate-500 text-sm mt-5">
                        Já tem conta?{' '}
                        <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Entrar</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
