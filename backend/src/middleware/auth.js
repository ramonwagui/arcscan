const supabase = require('../config/supabase');

/**
 * Middleware que verifica o token JWT do Supabase.
 * O frontend deve enviar: Authorization: Bearer <token>
 */
async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Token de autenticação não fornecido' });
        }

        const token = authHeader.split(' ')[1];

        if (!supabase) {
            // Mock mode: aceitar qualquer token não vazio para desenvolvimento
            req.user = {
                id: 'mock-user-id',
                email: 'demo@docsearch.local',
                name: 'Usuário Demo',
                role: 'superadmin' // Modo mock = admin total
            };
            return next();
        }

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Token inválido ou expirado' });
        }

        // Buscar o perfil do usuário (para ter o cargo/role)
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        req.user = {
            ...user,
            role: profile ? profile.role : 'user'
        };

        next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        res.status(500).json({ error: 'Erro na autenticação' });
    }
}

module.exports = authMiddleware;
