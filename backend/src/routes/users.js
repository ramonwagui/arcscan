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

        // Obtém a lista real do Auth (para ter o user_metadata com o nome)
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        if (authError) throw authError;

        // Obtém a tabela auxiliar de perfis
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('*');

        if (profileError) throw profileError;

        // Combina os dados
        const combined = authUsers.users.map(u => {
            const profile = profiles.find(p => p.id === u.id);
            return {
                ...u,
                role: profile ? profile.role : 'user'
            };
        });

        // Ordena por data de criação mais recente
        combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        res.json(combined);
    } catch (err) {
        next(err);
    }
});

// POST /api/users - Cria um novo usuário com senha e permissões
router.post('/', async (req, res, next) => {
    try {
        const { email, password, name, role } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
        }

        const userRole = ['superadmin', 'user'].includes(role) ? role : 'user';

        if (!supabase) {
            return res.status(201).json({ message: 'Criação simulada para ' + email });
        }

        // Cria o usuário via Supabase Auth Admin
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirma o email
            user_metadata: { name }
        });

        if (authError) throw authError;

        // Atualiza a role na tabela profiles (geralmente criada por trigger, mas garantimos aqui)
        if (authData.user) {
            await supabase
                .from('profiles')
                .update({ role: userRole })
                .eq('id', authData.user.id);
        }

        res.status(201).json({
            message: 'Usuário criado com sucesso',
            user: authData.user
        });
    } catch (err) {
        next(err);
    }
});

// PUT /api/users/:id - Atualiza dados do usuário (senha, nome, role)
router.put('/:id', async (req, res, next) => {
    try {
        const { name, password, role } = req.body;
        const userId = req.params.id;

        if (!supabase) {
            return res.json({ id: userId, message: 'Atualização simulada' });
        }

        const authUpdates = {};
        if (password) authUpdates.password = password;
        if (name) authUpdates.user_metadata = { name };

        // Atualiza Auth se necessário
        if (Object.keys(authUpdates).length > 0) {
            const { error: authError } = await supabase.auth.admin.updateUserById(
                userId,
                authUpdates
            );
            if (authError) throw authError;
        }

        // Atualiza Role na tabela profiles se fornecido
        if (role && ['superadmin', 'user'].includes(role)) {
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ role })
                .eq('id', userId);

            if (profileError) throw profileError;
        }

        res.json({ message: 'Usuário atualizado com sucesso' });
    } catch (err) {
        next(err);
    }
});

// PATCH /api/users/:id/role - Atualiza apenas o cargo (role) do usuário (mantido para compatibilidade)
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
