import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRY_DAYS || '7', 10);

// Validar JWT secret al startup
const JWT_SECRET: string = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('CRITICAL SECURITY ERROR: JWT_SECRET environment variable must be set');
  }
  if (secret.length < 32) {
    throw new Error(
      `CRITICAL SECURITY ERROR: JWT_SECRET must be at least 32 characters long (current: ${secret.length})`
    );
  }
  return secret;
})();

// OWASP 2026 recommendation: 12 rounds minimum
const BCRYPT_ROUNDS = 12;

// Interfaces para tipado de JWT
interface UserPayload {
  id: number;
  email: string;
  roles: string[];
  permisos: string[];
}

export class AuthService {
  // Hashear contraseña
  static async hashPassword(pass: string) {
    return await bcrypt.hash(pass, BCRYPT_ROUNDS);
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
                    permiso: true,
                  },
                },
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
    const roles = user.roles.map((r) => r.rol.nombre);
    const permisos = Array.from(
      new Set(user.roles.flatMap((r) => r.rol.permisos.map((rp) => rp.permiso.codigo)))
    );

    // No devolver la contraseña
    const { claveHash: _, ...userWithoutPass } = user;

    return {
      ...userWithoutPass,
      roles,
      permisos,
    };
  }

  // Generar Access Token (JWT de vida corta)
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

  // Crear Refresh Token (random string, persistido en DB)
  static async createRefreshToken(userId: number): Promise<string> {
    const token = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await prisma.refreshToken.create({
      data: {
        token,
        usuarioId: userId,
        expiresAt,
      },
    });

    return token;
  }

  // Validar Refresh Token contra la DB
  static async validateRefreshToken(token: string) {
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!storedToken) {
      return null;
    }

    // Verificar expiración
    if (storedToken.expiresAt < new Date()) {
      // Limpiar token expirado
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      return null;
    }

    return storedToken;
  }

  // Rotar Refresh Token: elimina el viejo y crea uno nuevo (previene reutilización)
  static async rotateRefreshToken(oldToken: string, userId: number): Promise<string> {
    // Eliminar el token viejo
    await prisma.refreshToken.deleteMany({ where: { token: oldToken } });

    // Crear nuevo token
    return AuthService.createRefreshToken(userId);
  }

  // Eliminar un refresh token específico (logout)
  static async deleteRefreshToken(token: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { token } });
  }

  // Eliminar todos los refresh tokens de un usuario (logout de todos los dispositivos)
  static async deleteAllRefreshTokens(userId: number): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { usuarioId: userId } });
  }

  // Limpiar tokens expirados (mantenimiento, se puede llamar periódicamente)
  static async cleanupExpiredTokens(): Promise<number> {
    const result = await prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
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
                    permiso: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) return null;

    const roles = user.roles.map((r) => r.rol.nombre);
    const permisos = Array.from(
      new Set(user.roles.flatMap((r) => r.rol.permisos.map((rp) => rp.permiso.codigo)))
    );

    const { claveHash: _, ...userWithoutPass } = user;
    return {
      ...userWithoutPass,
      roles,
      permisos,
    };
  }
}
