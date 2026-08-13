import type { NextFunction, Request, Response } from "express";
import { UserRole, UserStatus } from "@prisma/client";
import { getSessionByToken } from "../lib/session.js";
import { unauthorized, forbidden } from "../lib/errors.js";

const COOKIE_NAME = "fintrack_session";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  currency: string;
  timezone: string;
  avatarUrl: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

function getToken(req: Request): string | undefined {
  return req.cookies?.[COOKIE_NAME];
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = getToken(req);
  if (!token) return next(unauthorized());

  const session = await getSessionByToken(token);
  if (!session) return next(unauthorized());

  if (session.user.status === UserStatus.SUSPENDED) {
    return next(forbidden("Account suspended"));
  }

  req.user = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
    status: session.user.status,
    currency: session.user.currency,
    timezone: session.user.timezone,
    avatarUrl: session.user.avatarUrl,
  };
  next();
}

export function requireSuperAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== UserRole.SUPER_ADMIN) {
    return next(forbidden("Super admin access required"));
  }
  next();
}

export { COOKIE_NAME };
