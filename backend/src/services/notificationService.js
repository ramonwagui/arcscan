const supabase = require('../config/supabase');

class NotificationService {
    /**
     * Cria e envia uma notificação para um usuário
     */
    async notify({ userId, message, type = 'info', link = null }) {
        if (!supabase) {
            console.log(`[NOTIF-MOCK] Para ${userId}: ${message} (${type})`);
            return null;
        }

        try {
            const { data, error } = await supabase
                .from('notifications')
                .insert([{
                    user_id: userId,
                    message,
                    type,
                    link,
                    read: false,
                    created_at: new Date().toISOString()
                }]);

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('[NOTIF-ERROR]', err.message);
            return null;
        }
    }

    // Atalhos úteis
    async notifyUpload(userId, filename, docId) {
        return this.notify({
            userId,
            message: `Novo documento recebido: ${filename}`,
            type: 'upload',
            link: `/documents/${docId}`
        });
    }

    async notifyOCR(userId, docTitle, docId) {
        return this.notify({
            userId,
            message: `Processamento IA concluído: ${docTitle}`,
            type: 'ocr',
            link: `/documents/${docId}`
        });
    }

    async notifySignature(userId, docTitle, docId) {
        return this.notify({
            userId,
            message: `Documento assinado: ${docTitle}`,
            type: 'signature',
            link: `/documents/${docId}`
        });
    }
}

module.exports = new NotificationService();
