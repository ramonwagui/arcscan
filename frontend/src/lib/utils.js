export const CATEGORIES = [
    { value: 'contratos', label: 'Contratos', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-500/30', icon: '📋' },
    { value: 'notas_fiscais', label: 'Notas Fiscais', color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-500/30', icon: '🧾' },
    { value: 'oficios', label: 'Ofícios', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-500/30', icon: '📨' },
    { value: 'convenios', label: 'Convênios', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-500/30', icon: '🤝' },
    { value: 'projetos', label: 'Projetos', color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-500/30', icon: '🏗️' },
    { value: 'prontuarios', label: 'Prontuários', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-500/30', icon: '🏥' },
    { value: 'outros', label: 'Outros', color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-500/30', icon: '📁' },
]

export const getCategoryInfo = (value, customList = null) => {
    const list = customList || CATEGORIES;
    const cat = list.find(c => (c.value === value || c.slug === value));

    if (cat) {
        if (cat.slug && cat.color && !cat.bg) {
            const classes = (cat.color || '').split(' ');
            return {
                ...cat,
                label: cat.name || cat.label || 'Sem Nome',
                bg: classes.find(c => c.startsWith('bg-')) || 'bg-slate-700/10',
                color: classes.find(c => c.startsWith('text-')) || 'text-slate-400',
                border: classes.find(c => c.startsWith('border-')) || 'border-slate-700/30',
                icon: cat.icon || '📁'
            };
        }
        return cat;
    }

    // Fallback seguro em caso de valor nulo ou indefinido
    const safeValue = value || 'outros';
    const label = (typeof safeValue === 'string' && safeValue.length > 0)
        ? safeValue.charAt(0).toUpperCase() + safeValue.slice(1).replace(/_/g, ' ')
        : 'Outros';

    return {
        value: safeValue,
        label: label,
        color: 'text-slate-400',
        bg: 'bg-slate-400/10',
        border: 'border-slate-500/30',
        icon: '📁'
    };
}

export const formatFileSize = (bytes) => {
    if (!bytes) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return 'Data inválida'
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export const getFileIcon = (mimetype) => {
    if (mimetype === 'application/pdf') return '📄'
    if (mimetype?.startsWith('image/')) return '🖼️'
    return '📎'
}

export const highlightText = (text, query) => {
    if (!query || !text) return text
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return text.replace(regex, '<mark class="highlight">$1</mark>')
}
