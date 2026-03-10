import axios from 'axios'

// Detecta se estamos rodando em produção ou desenvolvimento
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

// Em produção, as rotas já começam com /api, então o baseURL deve ser vazio
// Em local, usamos o endereço completo do backend
const API_URL = isLocal
    ? (import.meta.env.VITE_API_URL || 'http://localhost:3001')
    : ''

const api = axios.create({
    baseURL: API_URL,
    timeout: 60000, // 60s para OCR
})

// Instância pública para não redirecionar em caso de erro 401/403 de links expirados
export const publicApi = axios.create({
    baseURL: API_URL,
    timeout: 60000,
})

// Interceptor de request: adiciona Authorization header
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('docsearch_token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

import { supabase } from './supabase'

// Interceptor de response: trata erros globais
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('docsearch_token')
            localStorage.removeItem('docsearch_user')
            if (supabase) {
                await supabase.auth.signOut().catch(() => { })
            }
            if (window.location.pathname !== '/login') {
                window.location.href = '/login'
            }
        }
        return Promise.reject(error)
    }
)

// ──────────────────────────────────────────
// Documents
// ──────────────────────────────────────────

export const documentsApi = {
    list: (params = {}) =>
        api.get('/api/documents', { params }).then(r => r.data),

    get: (id) =>
        api.get(`/api/documents/${id}`).then(r => r.data),

    getStats: () =>
        api.get('/api/documents/stats').then(r => r.data),

    getSignedUrl: (id) =>
        api.get(`/api/documents/${id}/url`).then(r => r.data),

    getExpiring: (days = 30) =>
        api.get(`/api/documents/expiring`, { params: { days } }).then(r => r.data),

    upload: (formData, onProgress) =>
        api.post('/api/documents/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (e) => {
                if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total))
            },
        }).then(r => r.data),

    delete: (id) =>
        api.delete(`/api/documents/${id}`).then(r => r.data),

    chat: (id, message) =>
        api.post(`/api/documents/${id}/chat`, { message }).then(r => r.data),

    updateStatus: (id, status, notes) =>
        api.patch(`/api/documents/${id}/status`, { status, notes }).then(r => r.data),

    getAudit: (id) =>
        api.get(`/api/documents/${id}/audit`).then(r => r.data),

    extractFields: (id) =>
        api.post(`/api/documents/${id}/extract-fields`).then(r => r.data),
}

// ──────────────────────────────────────────
// Signatures
// ──────────────────────────────────────────

export const signaturesApi = {
    request: (documentId, emails) =>
        api.post('/api/signatures/request', { documentId, emails }).then(r => r.data),

    getPublicPayload: (token) =>
        publicApi.get(`/api/signatures/public/${token}`).then(r => r.data),

    finalize: (token, auditData) =>
        publicApi.post(`/api/signatures/public/${token}/complete`, { auditData }).then(r => r.data)
}

// ──────────────────────────────────────────
// Document Requests (Solicitação de Envio)
// ──────────────────────────────────────────

export const docRequestsApi = {
    list: () =>
        api.get('/api/doc-requests').then(r => r.data),

    create: (data) =>
        api.post('/api/doc-requests', data).then(r => r.data),

    getPublic: (token) =>
        publicApi.get(`/api/doc-requests/public/${token}`).then(r => r.data),

    publicUpload: (token, formData, onProgress) =>
        publicApi.post(`/api/doc-requests/public/${token}/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (e) => {
                if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total))
            },
        }).then(r => r.data)
}

// ──────────────────────────────────────────
// Search
// ──────────────────────────────────────────

export const searchApi = {
    search: (q, filters = {}) =>
        api.get('/api/search', { params: { q, ...filters } }).then(r => r.data),
}

// ──────────────────────────────────────────
// Categories
// ──────────────────────────────────────────

export const categoriesApi = {
    list: () =>
        api.get('/api/categories').then(r => r.data),

    create: (data) =>
        api.post('/api/categories', data).then(r => r.data),

    update: (id, data) =>
        api.put(`/api/categories/${id}`, data).then(r => r.data),

    delete: (id) =>
        api.delete(`/api/categories/${id}`).then(r => r.data),
}

// ──────────────────────────────────────────
// Users
// ──────────────────────────────────────────

export const usersApi = {
    me: () =>
        api.get('/api/users/me').then(r => r.data),

    list: () =>
        api.get('/api/users').then(r => r.data),

    create: (data) =>
        api.post('/api/users', data).then(r => r.data),

    update: (id, data) =>
        api.put(`/api/users/${id}`, data).then(r => r.data),

    updateRole: (id, role) =>
        api.patch(`/api/users/${id}/role`, { role }).then(r => r.data),

    delete: (id) =>
        api.delete(`/api/users/${id}`).then(r => r.data),
}

export default api
