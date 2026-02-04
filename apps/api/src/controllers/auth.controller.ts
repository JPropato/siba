import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AuthService } from '../services/auth.service.js';

// Schema de validación para Login
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await AuthService.validateUser(email, password);
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const accessToken = AuthService.generateAccessToken(user);
    const refreshToken = AuthService.generateRefreshToken(user);

    // Enviar Refresh Token en Cookie HTTP-Only
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Relaxed for local dev
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });

    res.json({
      user,
      accessToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('refreshToken');
  res.json({ message: 'Logout exitoso' });
};

export const refresh = async (req: Request, res: Response) => {
  console.log('[Auth] Refresh request received');
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    console.log('[Auth] No refresh token cookie');
    return res.status(401).json({ error: 'No refresh token provided' });
  }

  const payload = AuthService.verifyRefreshToken(refreshToken);
  if (!payload) {
    console.log('[Auth] Invalid refresh token');
    return res.status(403).json({ error: 'Invalid refresh token' });
  }

  const user = await AuthService.getUserById(payload.id);
  if (!user) {
    return res.status(403).json({ error: 'User not found' });
  }

  const newAccessToken = AuthService.generateAccessToken(user);
  // Opcional: Rotar refresh token también

  // No devolver la contraseña (ya viene filtrada de AuthService)
  res.json({
    accessToken: newAccessToken,
    user,
  });
};

export const me = async (req: Request, res: Response) => {
  // El middleware de auth inyectará el usuario en req.user
  const user = req.user;
  res.json({ user });
};
