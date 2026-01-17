import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';

// Extender la interfaz Request para incluir el usuario
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        console.log('[AuthMiddleware] No token provided');
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) {
            console.log('[AuthMiddleware] Token verify error:', err.message);
            // Si el token expiró, devolver 401 para trigger de refresh en frontend
            return res.status(401).json({ error: 'Token inválido o expirado' });
        }
        req.user = user;
        next();
    });
};

export const requireRole = (role: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'No autenticado' });
        }

        // Comparación de roles (Array)
        // Se asume que req.user.roles viene populado del token o del auth middleware
        const userRoles = req.user.roles || [];
        if (!userRoles.includes(role) && !userRoles.includes('Super Admin')) {
            return res.status(403).json({ error: 'Permisos insuficientes' });
        }

        next();
    };
};

// Middleware para verificar permisos específicos
export const requirePermission = (permissionCode: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'No autenticado' });
        }

        const userRoles: string[] = req.user.roles || [];
        const userPermisos: string[] = req.user.permisos || [];

        // Super Admin siempre tiene acceso
        if (userRoles.includes('Super Admin')) {
            return next();
        }

        // Verificar si tiene el permiso específico
        if (userPermisos.includes(permissionCode)) {
            return next();
        }

        console.log(`[AuthMiddleware] Permiso denegado: ${permissionCode} para usuario ${req.user.email}`);
        return res.status(403).json({
            error: 'Permiso insuficiente',
            required: permissionCode
        });
    };
};
