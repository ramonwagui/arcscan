import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

// Instância padrão do axios
const api = axios.create({
    baseURL: API_URL,
    timeout: 60000, // 60s para OCR
})

// Interceptor de request: adiciona Authorization header
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('docsearch_token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Interceptor de response: trata erros globais
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('docsearch_token')
            localStorage.removeItem('docsearch_user')
            window.location.href = '/login'
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
