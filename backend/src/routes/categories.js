const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminAuthMiddleware = require('../middleware/adminAuth');
const supabase = require('../config/supabase');

// Middleware de autenticação básico para todas as rotas (qualquer logado pode ver categorias)
router.use(authMiddleware);

// GET /api/categories - Lista todas as categorias
router.get('/', async (req, res, next) => {
    try {
        if (!supabase) {
            return res.json([
                { id: '1', slug: 'contratos', name: 'Contratos', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
                { id: '2', slug: 'notas_fiscais', name: 'Notas Fiscais', color: 'bg-green-500/10 text-green-400 border-green-500/20' }
            ]);
        }

        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        next(err);
    }
});

// A partir daqui, apenas SUPERADMIN pode acessar
router.use(adminAuthMiddleware);

// POST /api/categories - Cria nova categoria
router.post('/', async (req, res, next) => {
    try {
        const { slug, name, color } = req.body;

        if (!slug || !name) {
            return res.status(400).json({ error: 'Slug e nome são obrigatórios' });
        }

        if (!supabase) return res.status(201).json({ id: 'new', slug, name, color });

        const { data, error } = await supabase
            .from('categories')
            .insert([{ slug, name, color }])
            .select()
            .single();

        if (error) {
            if (error.code === '23505') return res.status(400).json({ error: 'Já existe uma categoria com este slug' });
            throw error;
        }

        res.status(201).json(data);
    } catch (err) {
        next(err);
    }
});

// PUT /api/categories/:id - Atualiza categoria
router.put('/:id', async (req, res, next) => {
    try {
        const { name, color } = req.body;

        if (!supabase) return res.json({ id: req.params.id, name, color });

        const { data, error } = await supabase
            .from('categories')
            .update({ name, color })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        next(err);
    }
});

// DELETE /api/categories/:id - Deleta categoria
router.delete('/:id', async (req, res, next) => {
    try {
        if (!supabase) return res.json({ message: 'Mock deletado' });

        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ message: 'Categoria removida com sucesso' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
