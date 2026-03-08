const express = require('express');
const auditService = require('../services/auditService');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');
const { extractText } = require('../services/ocrService');
const { uploadFile, deleteFile, getSignedUrl, generateThumbnail } = require('../services/storageService');
const {
    createDocument,
    updateDocument,
    deleteDocument,
    getDocumentById,
    listDocuments,
    getDashboardStats,
    getExpiringDocuments,
} = require('../services/documentService');
const aiService = require('../services/aiService');

const VALID_CATEGORIES = ['contratos', 'notas_fiscais', 'oficios', 'convenios', 'projetos', 'prontuarios', 'outros'];

// Todas as rotas requerem autenticação
router.use(authMiddleware);

/**
 * GET /api/documents/stats
 * Estatísticas do dashboard
 */
router.get('/stats', async (req, res, next) => {
    try {
        const stats = await getDashboardStats(req.user.id);
        res.json(stats);
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/documents/expiring
 * Retorna documentos próximos do vencimento
 */
router.get('/expiring', async (req, res, next) => {
    try {
        const days = req.query.days || 30;
        const docs = await getExpiringDocuments(req.user.id, days);
        res.json(docs);
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/documents
 * Lista documentos do usuário com filtros opcionais
 */
router.get('/', async (req, res, next) => {
    try {
        const { category, dateFrom, dateTo, limit = 50, offset = 0 } = req.query;

        if (category && !VALID_CATEGORIES.includes(category)) {
            return res.status(400).json({ error: 'Categoria inválida' });
        }

        const result = await listDocuments(req.user.id, {
            category,
            dateFrom,
            dateTo,
            limit: parseInt(limit),
            offset: parseInt(offset),
        });

        res.json(result);
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/documents/:id
 * Detalhe de um documento
 */
router.get('/:id', async (req, res, next) => {
    try {
        const doc = await getDocumentById(req.params.id, req.user.id);
        if (!doc) return res.status(404).json({ error: 'Documento não encontrado' });
        res.json(doc);
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/documents/:id/url
 * Gera URL assinada para visualização
 */
router.get('/:id/url', async (req, res, next) => {
    try {
        const doc = await getDocumentById(req.params.id, req.user.id);
        if (!doc) return res.status(404).json({ error: 'Documento não encontrado' });

        const url = await getSignedUrl(doc.file_path);

        await auditService.log(req.user.id, 'FILE_VIEW', req.params.id, {}, req.user.email, req.ip);

        res.json({ url });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/documents/:id/chat
 * Chat com o documento via IA (RAG)
 */
router.post('/:id/chat', async (req, res, next) => {
    try {
        const { message } = req.body;
        if (!message || message.trim().length < 2) {
            return res.status(400).json({ error: 'Pergunta muito curta' });
        }

        const doc = await getDocumentById(req.params.id, req.user.id);
        if (!doc) return res.status(404).json({ error: 'Documento não encontrado' });

        const answer = await aiService.askDocument(doc.title, doc.ocr_text || '', message.trim());

        await auditService.log(req.user.id, 'IA_CHAT', req.params.id, { question: message.substring(0, 50) }, req.user.email, req.ip);

        res.json({ answer });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/documents/:id/extract-fields
 * Usa IA para extrair campos-chave baseado na categoria
 */
router.post('/:id/extract-fields', async (req, res, next) => {
    try {
        const doc = await getDocumentById(req.params.id, req.user.id);
        if (!doc) return res.status(404).json({ error: 'Documento não encontrado' });
        if (!doc.ocr_text) return res.status(400).json({ error: 'OCR ainda não processado' });

        const fields = await aiService.extractFields(doc.category, doc.ocr_text);

        await auditService.log(req.user.id, 'IA_EXTRACT_FIELDS', req.params.id, { category: doc.category }, req.user.email, req.ip);

        res.json(fields);
    } catch (err) {
        next(err);
    }
});

/**
 * PATCH /api/documents/:id/status
 * Atualiza o status de aprovação, notas e categoria opcionalmente
 */
router.patch('/:id/status', async (req, res, next) => {
    try {
        const { status, notes, category } = req.body;

        const VALID_STATUSES = ['pending', 'reviewing', 'approved', 'rejected'];
        if (!VALID_STATUSES.includes(status)) {
            return res.status(400).json({ error: 'Status inválido' });
        }

        const updates = {
            approval_status: status,
            approval_notes: notes || null,
            reviewed_at: new Date().toISOString()
        };

        if (category && VALID_CATEGORIES.includes(category)) {
            updates.category = category;
        }

        const updatedDoc = await updateDocument(req.params.id, req.user.id, updates);

        await auditService.log(req.user.id, 'STATUS_CHANGE', req.params.id, {
            newStatus: status,
            notes: notes ? 'Com notas' : 'Sem notas',
            categoryUpdated: !!category
        }, req.user.email, req.ip);

        res.json(updatedDoc);
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/documents/:id/audit
 * Busca a trilha de auditoria de um documento
 */
router.get('/:id/audit', async (req, res, next) => {
    try {
        const logs = await auditService.getLogs(req.params.id);
        res.json(logs);
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/documents/upload
 * Upload de arquivo + OCR automático
 */
router.post('/upload', upload.single('file'), async (req, res, next) => {
    let docId = null;
    let filePath = null;

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado' });
        }

        const { title, category = 'outros', expiresAt } = req.body;

        if (!title || title.trim().length < 2) {
            return res.status(400).json({ error: 'Título é obrigatório (mínimo 2 caracteres)' });
        }

        if (!VALID_CATEGORIES.includes(category)) {
            return res.status(400).json({ error: 'Categoria inválida' });
        }

        // 1. Fazer upload do arquivo
        console.log(`[UPLOAD] Iniciando upload de: ${req.file.originalname}`);
        const { path: storagePath, url: fileUrl } = await uploadFile(
            req.file.buffer,
            req.file.mimetype,
            req.user.id,
            req.file.originalname
        );
        filePath = storagePath;

        // 2. Gerar Thumbnail (opcional)
        let thumbPath = null;
        try {
            const thumbBuffer = await generateThumbnail(req.file.buffer, req.file.mimetype);
            if (thumbBuffer) {
                const { path: tp } = await uploadFile(thumbBuffer, 'image/webp', req.user.id, `thumb_${req.file.originalname}.webp`);
                thumbPath = tp;
            }
        } catch (err) {
            console.error('[THUMBNAIL] Falha silênciosa:', err.message);
        }

        // 3. Criar registro inicial no banco
        const doc = await createDocument({
            user_id: req.user.id,
            title: title.trim(),
            filename: req.file.originalname,
            file_path: storagePath,
            thumbnail_path: thumbPath,
            file_size: req.file.size,
            file_type: req.file.mimetype,
            category,
            expires_at: expiresAt || null,
            status: 'processing',
            ocr_text: null,
        });
        docId = doc.id;

        await auditService.log(req.user.id, 'UPLOAD', docId, { filename: doc.filename }, req.user.email, req.ip);

        // Retornar imediatamente ao cliente
        res.status(201).json({
            message: 'Documento enviado. OCR em processamento...',
            document: doc,
        });

        // 3. OCR em background (não bloqueia a resposta)
        (async () => {
            try {
                const text = await extractText(req.file.buffer, req.file.mimetype, req.file.originalname);

                // 3. Classificação automática via IA
                const classification = await aiService.classifyDocument(text);

                // 4. Gerar Embeddings (Opcional - Busca Semântica)
                const embedding = await aiService.generateEmbedding(text);

                await updateDocument(docId, req.user.id, {
                    ocr_text: text,
                    ai_category_suggestion: classification?.category || 'outros',
                    embedding: embedding,
                    status: 'completed',
                });
                console.log(`[OCR/IA] Documento ${docId} processado e vetorizado.`);
            } catch (ocrErr) {
                console.error(`[OCR] Erro no documento ${docId}:`, ocrErr.message);
                await updateDocument(docId, req.user.id, { status: 'failed' }).catch(() => { });
            }
        })();

    } catch (err) {
        // Limpar storage se o registro falhou
        if (filePath && !docId) {
            deleteFile(filePath).catch(() => { });
        }
        next(err);
    }
});

/**
 * DELETE /api/documents/:id
 * Remove um documento
 */
router.delete('/:id', async (req, res, next) => {
    try {
        const doc = await getDocumentById(req.params.id, req.user.id);
        if (!doc) return res.status(404).json({ error: 'Documento não encontrado' });

        await deleteFile(doc.file_path);
        await deleteDocument(req.params.id, req.user.id);

        await auditService.log(req.user.id, 'DELETE', req.params.id, { title: doc.title }, req.user.email, req.ip);

        res.json({ message: 'Documento removido com sucesso' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
