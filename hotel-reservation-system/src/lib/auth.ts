import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';

import prisma from '../utils/prismaClient';
import { verifyToken } from '../utils/jwt';

type JwtPayload = {
  sub?: string;
  userId?: string;
  role?: string;
  [key: string]: unknown;
};

function getBearerToken(req: NextApiRequest): string | null {
  const header = req.headers.authorization;
  if (!header) return null;

  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

export async function getAuthUser(req: NextApiRequest) {
  const token = getBearerToken(req);
  if (!token) return null;

  let decoded: JwtPayload;
  try {
    decoded = verifyToken(token) as JwtPayload;
  } catch {
    return null;
  }

  const userId = (decoded.sub || decoded.userId) as string | undefined;
  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true },
  });
}

export type AuthedRequest = NextApiRequest & {
  user: { id: string; email: string; name: string | null; role: string };
};

export function requireAuth(
  handler: (req: AuthedRequest, res: NextApiResponse) => unknown | Promise<unknown>,
): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const user = await getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    (req as any).user = user;
    return handler(req as AuthedRequest, res);
  };
}
