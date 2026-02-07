import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service.js';

const REFRESH_TOKEN_EXPIRY_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRY_DAYS || '7', 10);

// Helper para configurar la cookie de refresh token
function setRefreshTokenCookie(res: Response, token: string) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth', // Solo se envía a rutas de auth
    maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshTokenCookie(res: Response) {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth',
  });
}

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

    // Generar access token (JWT corto)
    const accessToken = AuthService.generateAccessToken(user);

    // Crear refresh token en DB (random string)
    const refreshToken = await AuthService.createRefreshToken(user.id);

    // Enviar Refresh Token en Cookie HTTP-Only
    setRefreshTokenCookie(res, refreshToken);

    res.json({
      user,
      accessToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('[Auth] Login error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      // Eliminar refresh token de la DB
      await AuthService.deleteRefreshToken(refreshToken);
    }

    clearRefreshTokenCookie(res);
    res.json({ message: 'Logout exitoso' });
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    // Limpiar cookie aunque falle la DB
    clearRefreshTokenCookie(res);
    res.json({ message: 'Logout exitoso' });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided' });
    }

    // Validar el refresh token contra la DB
    const storedToken = await AuthService.validateRefreshToken(refreshToken);
    if (!storedToken) {
      clearRefreshTokenCookie(res);
      return res.status(403).json({ error: 'Invalid or expired refresh token' });
    }

    // Obtener usuario actualizado con roles/permisos
    const user = await AuthService.getUserById(storedToken.usuarioId);
    if (!user) {
      // Usuario eliminado: limpiar tokens
      await AuthService.deleteRefreshToken(refreshToken);
      clearRefreshTokenCookie(res);
      return res.status(403).json({ error: 'User not found' });
    }

    // Generar nuevo access token
    const newAccessToken = AuthService.generateAccessToken(user);

    // Rotar el refresh token (elimina viejo, crea nuevo) para prevenir reutilización
    const newRefreshToken = await AuthService.rotateRefreshToken(refreshToken, user.id);
    setRefreshTokenCookie(res, newRefreshToken);

    res.json({
      accessToken: newAccessToken,
      user,
    });
  } catch (error) {
    console.error('[Auth] Refresh error:', error);
    clearRefreshTokenCookie(res);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const me = async (req: Request, res: Response) => {
  // El middleware de auth inyectará el usuario en req.user
  const user = req.user;
  res.json({ user });
};
