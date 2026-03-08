import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase, isMockMode } from '../lib/supabase'

const AuthContext = createContext(null)

// Usuário mock para desenvolvimento sem Supabase
const MOCK_USER = {
    id: 'mock-user-id',
    email: 'demo@docsearch.local',
    name: 'Administrador Demo',
    organization: 'Prefeitura Municipal',
}

const MOCK_TOKEN = 'mock-dev-token-docsearch-2024'

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (isMockMode) {
            const saved = localStorage.getItem('docsearch_user')
            if (saved) {
                try {
                    setUser(JSON.parse(saved))
                    localStorage.setItem('docsearch_token', MOCK_TOKEN)
                } catch { }
            }
            setLoading(false)
            return
        }

        const fetchAndStoreProfile = async (sessionUser) => {
            try {
                const { data } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', sessionUser.id)
                    .maybeSingle()

                const role = data?.role || 'user'
                const fullUser = {
                    id: sessionUser.id,
                    email: sessionUser.email,
                    name: sessionUser.user_metadata?.name || sessionUser.email,
                    organization: sessionUser.user_metadata?.organization || '',
                    role
                }
                setUser(fullUser)
                localStorage.setItem('docsearch_user', JSON.stringify(fullUser))
            } catch (err) {
                console.error('Background role fetch failed:', err)
            }
        }

        const initializeAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (session) {
                    // Define o usuário básico imediatamente para liberar o Loading
                    const basicUser = {
                        id: session.user.id,
                        email: session.user.email,
                        name: session.user.user_metadata?.name || session.user.email,
                        organization: session.user.user_metadata?.organization || '',
                        role: 'user' // Default até carregar o real
                    }
                    setUser(basicUser)
                    localStorage.setItem('docsearch_token', session.access_token)
                    localStorage.setItem('docsearch_user', JSON.stringify(basicUser))

                    // Busca o cargo real em segundo plano
                    fetchAndStoreProfile(session.user)
                }
            } catch (err) {
                console.error('Auth initialization error:', err)
            } finally {
                setLoading(false)
            }
        }

        initializeAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
                if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                    const basicUser = {
                        id: session.user.id,
                        email: session.user.email,
                        name: session.user.user_metadata?.name || session.user.email,
                        organization: session.user.user_metadata?.organization || '',
                        role: 'user'
                    }
                    setUser(basicUser)
                    localStorage.setItem('docsearch_token', session.access_token)
                    localStorage.setItem('docsearch_user', JSON.stringify(basicUser))
                    fetchAndStoreProfile(session.user)
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null)
                localStorage.removeItem('docsearch_token')
                localStorage.removeItem('docsearch_user')
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const signIn = useCallback(async (email, password) => {
        if (isMockMode) {
            if (email === 'demo@docsearch.local' && password === 'demo123') {
                setUser(MOCK_USER)
                localStorage.setItem('docsearch_user', JSON.stringify(MOCK_USER))
                localStorage.setItem('docsearch_token', MOCK_TOKEN)
                return { user: MOCK_USER }
            }
            throw new Error('Credenciais inválidas. Use demo@docsearch.local / demo123')
        }

        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        return data
    }, [])

    const signUp = useCallback(async (email, password, name, organization) => {
        if (isMockMode) {
            const u = { ...MOCK_USER, email, name, organization }
            setUser(u)
            localStorage.setItem('docsearch_user', JSON.stringify(u))
            localStorage.setItem('docsearch_token', MOCK_TOKEN)
            return { user: u }
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name, organization } }
        })
        if (error) throw error
        return data
    }, [])

    const signOut = useCallback(async () => {
        if (!isMockMode) {
            await supabase.auth.signOut()
        }
        setUser(null)
        localStorage.removeItem('docsearch_token')
        localStorage.removeItem('docsearch_user')
    }, [])

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, isMockMode }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
