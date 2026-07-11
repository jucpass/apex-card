import type { NextFunction, Request, Response } from 'express';
import { prisma, UserRole, UserStatus } from '@apex/database';

type SupabaseAuthUser = {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
  };
};

type AuthenticatedSupabaseUser = {
  id: string;
  email: string;
  fullName: string;
};

type AuthenticatedAppUser = {
  id: string;
  supabaseAuthId: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
};

const ADMIN_ROLES = new Set<UserRole>([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

const getBearerToken = (authorizationHeader?: string) => {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
};

const getSupabaseAuthUserUrl = () => {
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/+$/, '');

  if (!supabaseUrl || !process.env.SUPABASE_PUBLISHABLE_KEY) {
    return null;
  }

  return `${supabaseUrl}/auth/v1/user`;
};

const getFullName = (user: SupabaseAuthUser) =>
  user.user_metadata?.full_name ||
  user.user_metadata?.name ||
  user.email?.split('@')[0] ||
  'Apex Admin';

const getFirstSuperAdminEmail = () => process.env.FIRST_SUPER_ADMIN_EMAIL?.trim().toLowerCase();

const findOrCreateAppUser = async (supabaseUser: AuthenticatedSupabaseUser) => {
  const userBySupabaseId = await prisma.user.findUnique({
    where: { supabaseAuthId: supabaseUser.id },
    select: {
      id: true,
      supabaseAuthId: true,
      email: true,
      fullName: true,
      role: true,
      status: true,
    },
  });

  if (userBySupabaseId) {
    return userBySupabaseId;
  }

  const userByEmail = await prisma.user.findUnique({
    where: { email: supabaseUser.email },
    select: {
      id: true,
      supabaseAuthId: true,
      email: true,
      fullName: true,
      role: true,
      status: true,
    },
  });

  if (userByEmail) {
    if (userByEmail.supabaseAuthId && userByEmail.supabaseAuthId !== supabaseUser.id) {
      return null;
    }

    return prisma.user.update({
      where: { id: userByEmail.id },
      data: { supabaseAuthId: supabaseUser.id },
      select: {
        id: true,
        supabaseAuthId: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
      },
    });
  }

  if (supabaseUser.email.toLowerCase() !== getFirstSuperAdminEmail()) {
    return null;
  }

  return prisma.user.create({
    data: {
      supabaseAuthId: supabaseUser.id,
      email: supabaseUser.email,
      fullName: supabaseUser.fullName,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
    select: {
      id: true,
      supabaseAuthId: true,
      email: true,
      fullName: true,
      role: true,
      status: true,
    },
  });
};

export const requireSupabaseAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = getBearerToken(req.header('authorization'));

  if (!token) {
    return res.status(401).json({ status: 'error', message: 'Authentication required' });
  }

  const userUrl = getSupabaseAuthUserUrl();

  if (!userUrl || !process.env.SUPABASE_PUBLISHABLE_KEY) {
    // eslint-disable-next-line no-console
    console.error('Supabase Auth is not configured for the API.');
    return res.status(500).json({ status: 'error', message: 'Authentication is not configured' });
  }

  try {
    const response = await fetch(userUrl, {
      headers: {
        apikey: process.env.SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return res.status(401).json({ status: 'error', message: 'Invalid or expired access token' });
    }

    const user = (await response.json()) as SupabaseAuthUser;

    if (!user.id || !user.email) {
      return res.status(401).json({ status: 'error', message: 'Invalid or expired access token' });
    }

    res.locals.supabaseUser = {
      id: user.id,
      email: user.email,
      fullName: getFullName(user),
    } satisfies AuthenticatedSupabaseUser;

    return next();
  } catch {
    return res.status(503).json({ status: 'error', message: 'Authentication service unavailable' });
  }
};

export const requireAdminUser = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  const supabaseUser = res.locals.supabaseUser as AuthenticatedSupabaseUser | undefined;

  if (!supabaseUser) {
    return res.status(401).json({ status: 'error', message: 'Authentication required' });
  }

  try {
    const appUser = await findOrCreateAppUser(supabaseUser);

    if (!appUser?.supabaseAuthId) {
      return res.status(403).json({ status: 'error', message: 'Administrator access required' });
    }

    if (appUser.status !== UserStatus.ACTIVE) {
      return res.status(403).json({ status: 'error', message: 'Account is not active' });
    }

    if (!ADMIN_ROLES.has(appUser.role)) {
      return res.status(403).json({ status: 'error', message: 'Administrator access required' });
    }

    const authenticatedAppUser: AuthenticatedAppUser = {
      ...appUser,
      supabaseAuthId: appUser.supabaseAuthId,
    };

    res.locals.appUser = authenticatedAppUser;
    return next();
  } catch {
    return res.status(500).json({ status: 'error', message: 'Authorization check failed' });
  }
};
