const express = require('express');
const authMiddleware = require('../middleware/auth');
const crypto = require('crypto');
const supabase = require('../config/supabase');
const emailService = require('../services/emailService');
const upload = require('../middleware/upload');
const { extractText } = require('../services/ocrService');
const { uploadFile, generateThumbnail } = require('../services/storageService');
const { createDocument, updateDocument } = require('../services/documentService');
const aiService = require('../services/aiService');
const auditService = require('../services/auditService');
const notificationService = require('../services/notificationService');

const router = express.Router();

// Helper to generate secure tokens
const generateSecureToken = () => crypto.randomBytes(32).toString('hex');

/**
 * @route GET /api/doc-requests
 * @desc Get all collection requests created by user
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { data: requests, error } = await supabase
            .from('document_requests')
            .select('*')
            .eq('created_by', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Populate attached documents info
        const populatedRequests = await Promise.all(requests.map(async request => {
            let documents = [];
            // In the new schema, we might want a separate table for request_files
            // But for now, if files were stored as UUID[] in the DB:
            if (request.files && request.files.length > 0) {
                const { data: docs } = await supabase
                    .from('documents')
                    .select('id, title, filename, created_at')
                    .in('id', request.files);

                documents = docs || [];
            }
            return {
                ...request,
                createdBy: request.created_by,
                createdAt: request.created_at,
                expiresAt: request.expires_at,
                completedAt: request.completed_at,
                documents
            };
        }));

        res.json(populatedRequests);
    } catch (error) {
        console.error('Error fetching doc-requests:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route POST /api/doc-requests
 * @desc Create a new collection request
 */
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, description, category, emails } = req.body;

        if (!title || !emails || !Array.isArray(emails)) {
            return res.status(400).json({ error: 'Title and recipient emails are required' });
        }

        const token = generateSecureToken();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 15); // 15 days validity

        const { data: request, error } = await supabase
            .from('document_requests')
            .insert([{
                title,
                description,
                category: category || 'outros',
                emails,
                token,
                status: 'pending',
                created_by: req.user.id,
                expires_at: expiresAt.toISOString(),
                files: []
            }])
            .select()
            .single();

        if (error) throw error;

        const uploadLink = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/upload/${token}`;

        for (const email of emails) {
            await emailService.sendSignatureInvite({
                email,
                signerName: email.split('@')[0],
                documentTitle: `Solicitação de Documento: ${title}`,
                signingLink: uploadLink
            });
        }

        res.status(201).json({
            message: 'Collection request created successfully',
            token,
            link: uploadLink,
            request
        });

    } catch (error) {
        console.error('Doc Request Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route GET /api/doc-requests/public/:token
 * @desc Public fetch of request details
 */
router.get('/public/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const { data: request, error } = await supabase
            .from('document_requests')
            .select('*')
            .eq('token', token)
            .single();

        if (error || !request) {
            return res.status(404).json({ error: 'Pedido de envio inválido ou expirado.' });
        }

        if (new Date() > new Date(request.expires_at)) {
            return res.status(403).json({ error: 'Este link de envio expirou.' });
        }

        res.json({
            title: request.title,
            description: request.description,
            category: request.category,
            status: request.status
        });
    } catch (error) {
        console.error('Public Fetch Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route POST /api/doc-requests/public/:token/upload
 * @desc Public endpoint for uploading files to a specific collection request
 */
router.post('/public/:token/upload', upload.single('file'), async (req, res) => {
    let docId = null;
    let filePath = null;

    try {
        const { token } = req.params;

        const { data: request, error: reqError } = await supabase
            .from('document_requests')
            .select('*')
            .eq('token', token)
            .single();

        if (reqError || !request) {
            return res.status(404).json({ error: 'Pedido de envio inválido ou expirado.' });
        }

        if (new Date() > new Date(request.expires_at)) {
            return res.status(403).json({ error: 'Este link de envio expirou.' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado' });
        }

        const { title, category, sender_name, sender_email } = req.body;

        // 1. Fazer upload do arquivo
        console.log(`[PUBLIC UPLOAD] Iniciando upload de: ${req.file.originalname} para solicitação ${token}`);
        const { path: storagePath } = await uploadFile(
            req.file.buffer,
            req.file.mimetype,
            request.created_by,
            req.file.originalname
        );
        filePath = storagePath;

        // 2. Gerar Thumbnail
        let thumbPath = null;
        try {
            const thumbBuffer = await generateThumbnail(req.file.buffer, req.file.mimetype);
            if (thumbBuffer) {
                const { path: tp } = await uploadFile(thumbBuffer, 'image/webp', request.created_by, `thumb_${req.file.originalname}.webp`);
                thumbPath = tp;
            }
        } catch (err) {
            console.error('[THUMBNAIL] Falha silênciosa:', err.message);
        }

        // 3. Criar registro inicial no banco
        const doc = await createDocument({
            user_id: request.created_by,
            title: title || `${request.title} - ${req.file.originalname}`,
            filename: req.file.originalname,
            file_path: storagePath,
            thumbnail_path: thumbPath,
            file_size: req.file.size,
            file_type: req.file.mimetype,
            category: category || request.category || 'outros',
            expires_at: null,
            status: 'processing',
            ocr_text: null,
        });
        docId = doc.id;

        // Update request state in DB
        const updatedFiles = [...(request.files || []), docId];
        const newHistory = [...(request.history || [])];
        const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || 'Desconhecido';

        newHistory.push({
            docId,
            senderName: sender_name || 'Remetente Externo',
            senderEmail: sender_email || 'N/A',
            ipAddress: clientIp,
            uploadedAt: new Date().toISOString()
        });

        await supabase
            .from('document_requests')
            .update({
                files: updatedFiles,
                status: 'completed',
                completed_at: new Date().toISOString(),
                history: newHistory
            })
            .eq('id', request.id);

        // Add to compliance Audit Log
        await auditService.log(
            request.created_by,
            'UPLOAD',
            docId,
            {
                filename: doc.filename,
                source: 'External Request Link',
                senderEmail: sender_email || 'N/A'
            },
            sender_name || 'Remetente Externo',
            clientIp
        );

        // Notify creator about the new public upload
        notificationService.notifyUpload(request.created_by, doc.filename, docId).catch(() => { });

        res.status(201).json({
            message: 'Documento recebido com sucesso. Processamento em andamento.',
            documentId: docId,
        });

        // 4. OCR em background
        (async () => {
            try {
                const text = await extractText(req.file.buffer, req.file.mimetype, req.file.originalname);
                const classification = await aiService.classifyDocument(text);
                const embedding = await aiService.generateEmbedding(text);

                await updateDocument(docId, request.created_by, {
                    ocr_text: text,
                    ai_category_suggestion: classification?.category || 'outros',
                    embedding: embedding,
                    status: 'completed',
                });

                // Notify creator that OCR is finished for this public upload
                notificationService.notifyOCR(request.created_by, doc.title, docId).catch(() => { });

                console.log(`[PUBLIC OCR/IA] Documento ${docId} processado.`);
            } catch (ocrErr) {
                console.error(`[PUBLIC OCR] Erro no documento ${docId}:`, ocrErr.message);
                await updateDocument(docId, request.created_by, { status: 'failed' }).catch(() => { });
            }
        })();

    } catch (err) {
        console.error('[PUBLIC UPLOAD ERROR]', err);
        res.status(500).json({ error: 'Erro interno ao processar o upload público' });
    }
});

module.exports = router;
