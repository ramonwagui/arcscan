import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import DocumentsPage from './pages/DocumentsPage'
import SearchPage from './pages/SearchPage'
import UploadPage from './pages/UploadPage'
import DocumentDetailPage from './pages/DocumentDetailPage'
import AdminPage from './pages/AdminPage'

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
