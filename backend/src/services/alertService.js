const supabase = require('../config/supabase');
const { getExpiringDocuments } = require('./documentService');

/**
 * Serviço de alertas e notificações (SMTP/E-mail)
 */
class AlertService {
    async checkAndSendAlerts() {
        console.log('[ALERTAS] Verificando documentos a vencer...');

        // Em um sistema real, percorreríamos todos os usuários. 
        // Aqui simulamos a verificação para o usuário mock.
        try {
            if (!supabase) {
                const userId = 'mock-user-id'; // Apenas para debug local sem banco
                const docs = await getExpiringDocuments(userId, 30);

                if (docs.length > 0) {
                    console.log(`[ALERTAS] Encontrados ${docs.length} documentos expirando para ${userId}`);
                    docs.forEach(doc => {
                        console.log(`[NOTIFICAR] Documento "${doc.title}" vence em: ${doc.expires_at}`);
                    });
                }
            } else {
                console.log('[ALERTAS] Serviço em standby. Requer configuração de Cron para usuários reais.');
            }
        } catch (err) {
            console.error('[ALERTAS ERROR]', err.message);
        }
    }
}

module.exports = new AlertService();
