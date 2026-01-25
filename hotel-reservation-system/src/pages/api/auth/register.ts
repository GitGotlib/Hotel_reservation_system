import type { NextApiRequest, NextApiResponse } from 'next';

import bcrypt from 'bcryptjs';

import prisma from '../../../utils/prismaClient';
import { signToken } from '../../../utils/jwt';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { email, password, name } = (req.body ?? {}) as {
    email?: string;
    password?: string;
    name?: string;
  };

  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }
  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'invalid email' });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'password must be at least 8 characters' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name: name?.trim() || null,
      },
      select: { id: true, email: true, name: true, role: true },
    });

    const token = signToken({ sub: user.id, role: user.role });

    res.status(201).json({
      token,
      user,
    });
  } catch (e: any) {
    // Prisma unique constraint (email)
    if (e?.code === 'P2002') {
      res.status(409).json({ error: 'email already exists' });
      return;
    }

    console.error('register error:', e);

    res.status(500).json({ error: 'Internal Server Error' });
  }
}
