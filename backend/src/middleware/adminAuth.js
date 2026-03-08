/**
 * Middleware que verifica se o usuário é superadmin.
 * Depende do authMiddleware ter rodado antes.
 */
function adminAuthMiddleware(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    if (req.user.role !== 'superadmin') {
        return res.status(403).json({ error: 'Acesso restrito apenas para administradores' });
    }

    next();
}

module.exports = adminAuthMiddleware;
