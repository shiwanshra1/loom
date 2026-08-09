import type { CookieOptions, Request, Response } from 'express';
import { registerSchema, loginSchema } from './auth.validation.js';
import { registerUser, loginUser, refreshSession, logoutUser } from './auth.service.js';
import { toPublicUser } from './auth.mapper.js';
import { ApiError } from '../../utils/ApiError.js';
import { UserModel } from '../../models/User.js';
import { env } from '../../config/env.js';

const REFRESH_COOKIE = 'forgeloom_refresh';

const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: 'lax',
  path: '/api/auth',
};

export async function register(req: Request, res: Response): Promise<void> {
  const input = registerSchema.parse(req.body);
  const { user, tokens } = await registerUser(input);

  res.cookie(REFRESH_COOKIE, tokens.refreshToken, refreshCookieOptions);
  res.status(201).json({ user: toPublicUser(user), accessToken: tokens.accessToken });
}

export async function login(req: Request, res: Response): Promise<void> {
  const input = loginSchema.parse(req.body);
  const { user, tokens } = await loginUser(input);

  res.cookie(REFRESH_COOKIE, tokens.refreshToken, refreshCookieOptions);
  res.json({ user: toPublicUser(user), accessToken: tokens.accessToken });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const token: string | undefined = req.cookies?.[REFRESH_COOKIE];
  if (!token) {
    throw new ApiError(401, 'No refresh token provided');
  }

  const tokens = await refreshSession(token);
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, refreshCookieOptions);
  res.json({ accessToken: tokens.accessToken });
}

export async function logout(req: Request, res: Response): Promise<void> {
  if (req.user) {
    const user = await UserModel.findById(req.user.userId);
    if (user) {
      await logoutUser(user._id.toString(), user.refreshTokenVersion);
    }
  }

  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
  res.status(204).send();
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated');
  }

  const user = await UserModel.findById(req.user.userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.json({ user: toPublicUser(user) });
}
