import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Interfaces para tipado de JWT
interface UserPayload {
    id: number;
    email: string;
    roles: string[];
    permisos: string[];
}

interface RefreshPayload {
    id: number;
}

export class AuthService {
    // Hashear contraseña
    static async hashPassword(pass: string) {
        return await bcrypt.hash(pass, 10);
    }

    // Verificar credenciales del usuario
    static async validateUser(email: string, pass: string) {
        const user = await prisma.usuario.findUnique({
            where: { email },
            include: {
                roles: {
                    include: {
                        rol: {
                            include: {
                                permisos: {
                                    include: {
                                        permiso: true
                                    }
                                }
                            },
                        },
                    },
                },
            },
        });

        if (!user) return null;

        // Verificar contraseña
        const isValid = await bcrypt.compare(pass, user.claveHash);
        if (!isValid) return null;

        // Aplanar estructura
        const roles = user.roles.map(r => r.rol.nombre);
        const permisos = Array.from(new Set(
            user.roles.flatMap(r => r.rol.permisos.map(rp => rp.permiso.codigo))
        ));

        // No devolver la contraseña
        const { claveHash: _claveHash, ...userWithoutPass } = user;

        return {
            ...userWithoutPass,
            roles,
            permisos
        };
    }

    // Generar Access Token
    static generateAccessToken(user: UserPayload): string {
        return jwt.sign(
            {
                id: user.id,
                email: user.email,
                roles: user.roles,
                permisos: user.permisos,
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN } as SignOptions
        );
    }

    // Generar Refresh Token
    static generateRefreshToken(user: RefreshPayload): string {
        return jwt.sign(
            {
                id: user.id,
            },
            JWT_REFRESH_SECRET,
            { expiresIn: JWT_REFRESH_EXPIRES_IN } as SignOptions
        );
    }

    // Verificar Refresh Token
    static verifyRefreshToken(token: string): RefreshPayload | null {
        try {
            return jwt.verify(token, JWT_REFRESH_SECRET) as RefreshPayload;
        } catch (_e) {
            return null;
        }
    }

    // Obtener usuario por ID (numérico)
    static async getUserById(id: number) {
        const user = await prisma.usuario.findUnique({
            where: { id },
            include: {
                roles: {
                    include: {
                        rol: {
                            include: {
                                permisos: {
                                    include: {
                                        permiso: true
                                    }
                                }
                            },
                        },
                    },
                },
            },
        });

        if (!user) return null;

        const roles = user.roles.map(r => r.rol.nombre);
        const permisos = Array.from(new Set(
            user.roles.flatMap(r => r.rol.permisos.map(rp => rp.permiso.codigo))
        ));

        const { claveHash: _claveHash, ...userWithoutPass } = user;
        return {
            ...userWithoutPass,
            roles,
            permisos
        };
    }
}
