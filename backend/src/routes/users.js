const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminAuthMiddleware = require('../middleware/adminAuth');
const supabase = require('../config/supabase');

// Middleware de autenticação básico
router.use(authMiddleware);

// GET /api/users/me - Retorna os dados do usuário atual (com role)
router.get('/me', (req, res) => {
    res.json(req.user);
});

// Apenas superadmins acessam as rotas de gerenciamento de usuários abaixo
router.use(adminAuthMiddleware);

// GET /api/users - Lista todos os perfis
router.get('/', async (req, res, next) => {
    try {
        if (!supabase) {
            return res.json([{ id: 'mock', email: 'mock@test.com', role: 'superadmin', created_at: new Date() }]);
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        next(err);
    }
});

// PATCH /api/users/:id/role - Atualiza cargo (role) do usuário
router.patch('/:id/role', async (req, res, next) => {
    try {
        const { role } = req.body;

        if (!['superadmin', 'user'].includes(role)) {
            return res.status(400).json({ error: 'Role inválida' });
        }

        if (!supabase) return res.json({ id: req.params.id, role });

        const { data, error } = await supabase
            .from('profiles')
            .update({ role })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        next(err);
    }
});

// DELETE /api/users/:id - Deleta o usuário através da API Admin do Supabase
// (Isso requer a chave service_role configurada no ambiente)
router.delete('/:id', async (req, res, next) => {
    try {
        if (!supabase) return res.json({ message: 'User deleted' });

        // Aqui, precisamos deletar o usuário diretamente do sistema de Auth do Supabase.
        // A chave já está sendo usada como SUPABASE_SERVICE_KEY, que tem permissões de Admin
        const { error } = await supabase.auth.admin.deleteUser(req.params.id);

        if (error) throw error;
        res.json({ message: 'Usuário removido com sucesso' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
