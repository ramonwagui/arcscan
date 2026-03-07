const { v4: uuidv4 } = require('uuid');

/**
 * Serviço de Auditoria (Compliance)
 * Registra todas as ações sensíveis realizadas no sistema
 */
class AuditService {
    constructor() {
        this.logs = [
            {
                id: 'audit-1',
                timestamp: '2024-01-15T10:30:00Z',
                userId: 'mock-user-id',
                action: 'UPLOAD',
                resourceId: 'mock-doc-1',
                details: { filename: 'contrato_servicos_2024.pdf' },
                ip: '127.0.0.1'
            },
            {
                id: 'audit-2',
                timestamp: '2024-01-15T10:40:00Z',
                userId: 'mock-user-id',
                action: 'STATUS_CHANGE',
                resourceId: 'mock-doc-1',
                details: { newStatus: 'approved', notes: 'Aprovado pelo financeiro' },
                ip: '127.0.0.1'
            }
        ]; // No mock, guardamos em memória
    }

    /**
     * Registra uma ação
     * @param {string} userId - ID do usuário
     * @param {string} action - 'UPLOAD', 'DOWNLOAD', 'VIEW', 'DELETE', 'STATUS_CHANGE', 'CHAT'
     * @param {string} resourceId - ID do documento/recurso
     * @param {object} details - Informações extras (ex: status antigo vs novo)
     */
    async log(userId, action, resourceId, details = {}) {
        const entry = {
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            userId,
            action,
            resourceId,
            details,
            ip: '127.0.0.1' // Em produção, pegaríamos o IP real
        };

        this.logs.unshift(entry);
        console.log(`[AUDIT] ${action} por ${userId} no recurso ${resourceId}`);

        // Em produção aqui salvaria na tabela 'audit_logs' do Supabase
        return entry;
    }

    async getLogs(resourceId = null) {
        if (resourceId) {
            return this.logs.filter(l => l.resourceId === resourceId);
        }
        return this.logs;
    }
}

module.exports = new AuditService();
