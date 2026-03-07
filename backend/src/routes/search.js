const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { searchDocuments } = require('../services/documentService');

router.use(authMiddleware);

/**
 * GET /api/search?q=termo&category=contratos&dateFrom=2024-01-01&dateTo=2024-12-31
 * Busca textual por palavra-chave nos documentos do usuário
 */
router.get('/', async (req, res, next) => {
    try {
        const { q, category, dateFrom, dateTo } = req.query;

        if (!q || q.trim().length < 2) {
            return res.status(400).json({ error: 'Termo de busca deve ter pelo menos 2 caracteres' });
        }

        const results = await searchDocuments(req.user.id, q.trim(), {
            category: category || null,
            dateFrom: dateFrom || null,
            dateTo: dateTo || null,
        });

        res.json({
            query: q.trim(),
            total: results.length,
            results,
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
