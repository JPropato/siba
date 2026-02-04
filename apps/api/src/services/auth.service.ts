import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
// const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Validar JWT secrets al startup
if (!JWT_SECRET) {
  throw new Error('CRITICAL SECURITY ERROR: JWT_SECRET environment variable must be set');
}

if (JWT_SECRET.length < 32) {
  throw new Error(
    `CRITICAL SECURITY ERROR: JWT_SECRET must be at least 32 characters long (current: ${JWT_SECRET.length})`
  );
}

if (!JWT_REFRESH_SECRET) {
  throw new Error('CRITICAL SECURITY ERROR: JWT_REFRESH_SECRET environment variable must be set');
}

if (JWT_REFRESH_SECRET.length < 32) {
  throw new Error(
    `CRITICAL SECURITY ERROR: JWT_REFRESH_SECRET must be at least 32 characters long (current: ${JWT_REFRESH_SECRET.length})`
  );
}

// OWASP 2026 recommendation: 12 rounds minimum
const BCRYPT_ROUNDS = 12;

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
    } catch {
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
