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

        const fetchProfile = async (sessionUser) => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', sessionUser.id)
                    .maybeSingle()
                return data?.role || 'user'
            } catch (err) {
                console.error('Error fetching role:', err)
                return 'user'
            }
        }

        const initializeAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (session) {
                    const role = await fetchProfile(session.user)
                    const u = {
                        id: session.user.id,
                        email: session.user.email,
                        name: session.user.user_metadata?.name || session.user.email,
                        organization: session.user.user_metadata?.organization || '',
                        role
                    }
                    setUser(u)
                    localStorage.setItem('docsearch_token', session.access_token)
                    localStorage.setItem('docsearch_user', JSON.stringify(u))
                }
            } catch (err) {
                console.error('Auth initialization error:', err)
            } finally {
                setLoading(false)
            }
        }

        initializeAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session) {
                // Se for LOGIN ou INITIAL_SESSION, atualizamos o perfil
                if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                    const role = await fetchProfile(session.user)
                    const u = {
                        id: session.user.id,
                        email: session.user.email,
                        name: session.user.user_metadata?.name || session.user.email,
                        organization: session.user.user_metadata?.organization || '',
                        role
                    }
                    setUser(u)
                    localStorage.setItem('docsearch_token', session.access_token)
                    localStorage.setItem('docsearch_user', JSON.stringify(u))
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
