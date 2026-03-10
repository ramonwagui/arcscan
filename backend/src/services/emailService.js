const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

/**
 * Envia um convite de assinatura
 */
async function sendSignatureInvite({ email, signerName, documentTitle, signingLink }) {
    if (!resend) {
        console.warn('⚠️  RESEND_API_KEY não configurada. E-mail não enviado.');
        return { success: false, error: 'Email service not configured' };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'Arcscan <onboarding@resend.dev>', // No modo gratuito/teste, o 'from' é fixo se não verificado
            to: [email],
            subject: `Assinatura Solicitada: ${documentTitle}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #334155;">
                    <h2 style="color: #6366f1;">Olá, ${signerName}!</h2>
                    <p>Você foi convidado para assinar digitalmente o documento <strong>"${documentTitle}"</strong> através da plataforma Arcscan.</p>
                    
                    <div style="margin: 32px 0;">
                        <a href="${signingLink}" 
                           style="background-color: #6366f1; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block;">
                           Revisar e Assinar Documento
                        </a>
                    </div>
                    
                    <p style="font-size: 14px; color: #64748b;">
                        Este link é seguro e único para você. Caso tenha dúvidas, entre em contato com o remetente.
                    </p>
                    
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0;">
                    
                    <p style="font-size: 12px; color: #94a3b8; text-align: center;">
                        Powered by Arcscan Compliance Protocol
                    </p>
                </div>
            `
        });

        if (error) {
            console.error('Resend Error:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (err) {
        console.error('Email Send Exception:', err);
        return { success: false, error: err.message };
    }
}

module.exports = {
    sendSignatureInvite
};
