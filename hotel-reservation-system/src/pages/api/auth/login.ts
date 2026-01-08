import type { NextApiRequest, NextApiResponse } from 'next';

import bcrypt from 'bcryptjs';

import prisma from '../../../utils/prismaClient';
import { signToken } from '../../../utils/jwt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { email, password } = (req.body ?? {}) as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, email: true, name: true, role: true, passwordHash: true },
  });

  if (!user) {
    res.status(401).json({ error: 'invalid credentials' });
    return;
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: 'invalid credentials' });
    return;
  }

  const token = signToken({ sub: user.id, role: user.role });

  res.status(200).json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
}
