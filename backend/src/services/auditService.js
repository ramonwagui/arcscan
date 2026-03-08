const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');

/**
 * Serviço de Auditoria (Compliance)
 * Registra todas as ações sensíveis realizadas no sistema
 */
class AuditService {
    constructor() {
        this.mockLogs = [
            {
                id: 'audit-1',
                timestamp: '2024-01-15T10:30:00Z',
                user_id: 'mock-user-id',
                user_name: 'Usuário Demo',
                action: 'UPLOAD',
                resource_id: 'mock-doc-1',
                details: { filename: 'contrato_servicos_2024.pdf' },
                ip: '127.0.0.1'
            }
        ];
    }

    /**
     * Registra uma ação
     * @param {string} userId - ID do usuário
     * @param {string} action - 'UPLOAD', 'DOWNLOAD', 'VIEW', 'DELETE', 'STATUS_CHANGE', 'CHAT'
     * @param {string} resourceId - ID do documento/recurso
     * @param {object} details - Informações extras
     * @param {string} userName - Nome ou email do usuário para exibição
     */
    /**
     * Registra uma ação com IP real
     */
    async log(userId, action, resourceId, details = {}, userName = null, ip = '127.0.0.1') {
        const entry = {
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            user_id: userId,
            user_name: userName || userId,
            action,
            resource_id: resourceId,
            details,
            ip: ip.replace('::ffff:', '') // Limpeza básica de IPv6 para IPv4
        };

        if (!supabase) {
            this.mockLogs.unshift(entry);
            console.log(`[AUDIT-MOCK] ${action} por ${userName || userId} [IP: ${entry.ip}]`);
            return entry;
        }

        try {
            const { data, error } = await supabase
                .from('audit_logs')
                .insert([entry])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('[AUDIT-ERROR] Falha ao salvar log:', err.message);
            return entry;
        }
    }

    async getLogs(resourceId = null) {
        if (!supabase) {
            if (resourceId) {
                return this.mockLogs.filter(l => l.resource_id === resourceId);
            }
            return this.mockLogs;
        }

        let query = supabase
            .from('audit_logs')
            .select('*')
            .order('timestamp', { ascending: false });

        if (resourceId) {
            query = query.eq('resource_id', resourceId);
        }

        const { data, error } = await query;
        if (error) {
            console.error('[AUDIT-ERROR] Falha ao buscar logs:', error.message);
            return [];
        }
        return data || [];
    }
}

module.exports = new AuditService();
