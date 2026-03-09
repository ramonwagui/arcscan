import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'

const suspended = (Component) => (props) => (
    <Suspense fallback={
        <div className="min-h-[50vh] flex items-center justify-center w-full">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-primary-500 animate-spin" />
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Carregando módulo...</p>
            </div>
        </div>
    }>
        <Component {...props} />
    </Suspense>
)

const LoginPage = suspended(lazy(() => import('./pages/LoginPage')))
const RegisterPage = suspended(lazy(() => import('./pages/RegisterPage')))
const DashboardPage = suspended(lazy(() => import('./pages/DashboardPage')))
const DocumentsPage = suspended(lazy(() => import('./pages/DocumentsPage')))
const SearchPage = suspended(lazy(() => import('./pages/SearchPage')))
const UploadPage = suspended(lazy(() => import('./pages/UploadPage')))
const DocumentDetailPage = suspended(lazy(() => import('./pages/DocumentDetailPage')))
const AdminPage = suspended(lazy(() => import('./pages/AdminPage')))

function PrivateRoute({ children }) {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 spinner" />
                    <p className="text-slate-400 text-sm">Carregando...</p>
                </div>
            </div>
        )
    }

    return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
    const { user, loading } = useAuth()
    if (loading) return null
    return !user ? children : <Navigate to="/dashboard" replace />
}

export default function App() {
    return (
        <AuthProvider>
            <Routes>
                {/* Rotas públicas */}
                <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

                {/* Rotas privadas */}
                <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="documents" element={<DocumentsPage />} />
                    <Route path="documents/:id" element={<DocumentDetailPage />} />
                    <Route path="search" element={<SearchPage />} />
                    <Route path="upload" element={<UploadPage />} />
                    <Route path="admin" element={<AdminPage />} />
                </Route>

                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </AuthProvider>
    )
}
