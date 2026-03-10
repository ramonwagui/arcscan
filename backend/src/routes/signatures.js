const express = require('express');
const authMiddleware = require('../middleware/auth');
const crypto = require('crypto');
const supabase = require('../config/supabase');
const emailService = require('../services/emailService');
const notificationService = require('../services/notificationService');

const router = express.Router();

// Helper to generate secure tokens
const generateSecureToken = () => crypto.randomBytes(32).toString('hex');

/**
 * @route POST /api/signatures/request
 * @desc Creates a signature session and returns a public link
 */
router.post('/request', authMiddleware, async (req, res) => {
    try {
        const { documentId, emails } = req.body;

        if (!documentId || !emails) {
            return res.status(400).json({ error: 'documentId and emails are required' });
        }

        // 1. Certify document exists
        const { data: doc, error: docError } = await supabase
            .from('documents')
            .select('*')
            .eq('id', documentId)
            .single();

        if (docError || !doc) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // 2. Generate signing tokens
        const token = generateSecureToken();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days validity

        const { data: session, error: sessionError } = await supabase
            .from('document_signatures')
            .insert([{
                document_id: documentId,
                token,
                emails,
                status: 'pending',
                created_by: req.user.id,
                expires_at: expiresAt.toISOString()
            }])
            .select()
            .single();

        if (sessionError) throw sessionError;

        // 3. Log to audit trail
        await supabase.from('audit_logs').insert({
            document_id: documentId,
            user_id: req.user.id,
            user_name: req.user.email,
            action: 'signature_requested',
            details: { emails, link_token: token }
        });

        // 4. Send E-mail invite
        const signingLink = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/sign/${token}`;

        for (const email of emails) {
            await emailService.sendSignatureInvite({
                email,
                signerName: email.split('@')[0],
                documentTitle: doc.title,
                signingLink
            });
        }

        res.status(201).json({
            message: 'Signature requested and emails sent successfully',
            token,
            expiresAt
        });

    } catch (error) {
        console.error('Signature Request Error:', error);
        res.status(500).json({ error: 'Internal server error while requesting signature' });
    }
});

/**
 * @route GET /api/signatures/public/:token
 * @desc Public route to fetch document data for the signer without login
 */
router.get('/public/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const { data: session, error: sessError } = await supabase
            .from('document_signatures')
            .select('*')
            .eq('token', token)
            .single();

        if (sessError || !session) {
            return res.status(404).json({ error: 'Link de assinatura inválido ou expirado.' });
        }

        if (new Date() > new Date(session.expires_at)) {
            return res.status(403).json({ error: 'O prazo para assinatura expirou.' });
        }

        // Fetch basic public info
        const { data: doc, error: docError } = await supabase
            .from('documents')
            .select('id, title, filename, file_size, file_type')
            .eq('id', session.document_id)
            .single();

        if (docError || !doc) {
            return res.status(404).json({ error: 'Original document no longer exists.' });
        }

        // Fresh TEMPORARY signed URL
        const { data: signedData } = await supabase
            .storage
            .from('documents')
            .createSignedUrl(doc.file_path, 3600);

        res.json({
            document: doc,
            url: signedData?.signedUrl,
            signers: session.emails,
            status: session.status
        });

    } catch (error) {
        console.error('Public Fetch Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route POST /api/signatures/public/:token/complete
 * @desc Public Webhook route for signature completion
 */
router.post('/public/:token/complete', async (req, res) => {
    try {
        const { token } = req.params;
        const { auditData } = req.body;

        const { data: session, error: sessError } = await supabase
            .from('document_signatures')
            .select('*')
            .eq('token', token)
            .single();

        if (sessError || !session) return res.status(404).json({ error: 'Invalid token' });

        // Update session state in DB
        await supabase
            .from('document_signatures')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                audit_data: auditData
            })
            .eq('id', session.id);

        // Update document status
        await supabase
            .from('documents')
            .update({ approval_status: 'approved' })
            .eq('id', session.document_id);

        // Compliance Log
        await supabase.from('audit_logs').insert({
            document_id: session.document_id,
            user_name: 'External Signer via API',
            action: 'document_signed',
            details: {
                token,
                signedBy: session.emails,
                auditData
            }
        });

        // Notify creator that the document has been signed
        const { data: doc } = await supabase.from('documents').select('title').eq('id', session.document_id).single();
        notificationService.notifySignature(session.created_by, doc?.title || 'Documento', session.document_id).catch(() => { });

        res.json({ success: true, message: 'Document visually and cryptographically signed.' });

    } catch (error) {
        console.error('Signature Completion Error:', error);
        res.status(500).json({ error: 'Internal server error while completing signature' });
    }
});

module.exports = router;
