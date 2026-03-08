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
            const userId = 'mock-user-id'; // Em produção usaríamos listagem de usuários
            const docs = await getExpiringDocuments(userId, 30);

            if (docs.length > 0) {
                console.log(`[ALERTAS] Encontrados ${docs.length} documentos expirando para ${userId}`);
                // Aqui entraria o código do Nodemailer para enviar o e-mail
                // Por simplicidade, exibimos no console.
                docs.forEach(doc => {
                    console.log(`[NOTIFICAR] Documento "${doc.title}" vence em: ${doc.expires_at}`);
                });
            }
        } catch (err) {
            console.error('[ALERTAS ERROR]', err.message);
        }
    }
}

module.exports = new AlertService();
