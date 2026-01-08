import type { NextApiResponse } from 'next';

import prisma from '../../../utils/prismaClient';
import { requireAuth, type AuthedRequest } from '../../../lib/auth';

function parseDateOnly(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function diffNights(from: Date, to: Date) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((to.getTime() - from.getTime()) / msPerDay);
}

export default requireAuth(async function handler(req: AuthedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { roomId, startDate, endDate } = (req.body ?? {}) as {
    roomId?: string;
    startDate?: string; // YYYY-MM-DD
    endDate?: string; // YYYY-MM-DD
  };

  if (!roomId || !startDate || !endDate) {
    res.status(400).json({ error: 'roomId, startDate, endDate are required' });
    return;
  }

  const from = parseDateOnly(startDate);
  const to = parseDateOnly(endDate);
  if (!from || !to) {
    res.status(400).json({ error: 'startDate/endDate must be YYYY-MM-DD' });
    return;
  }
  if (to <= from) {
    res.status(400).json({ error: 'endDate must be after startDate' });
    return;
  }

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: {
      id: true,
      isActive: true,
      roomType: { select: { basePrice: true } },
    },
  });

  if (!room || !room.isActive) {
    res.status(404).json({ error: 'room not found' });
    return;
  }

  const conflict = await prisma.reservation.findFirst({
    where: {
      roomId,
      status: { in: ['PENDING', 'CONFIRMED'] },
      startDate: { lt: to },
      endDate: { gt: from },
    },
    select: { id: true },
  });

  if (conflict) {
    res.status(409).json({ error: 'room is not available for these dates' });
    return;
  }

  const nights = diffNights(from, to);
  if (nights <= 0) {
    res.status(400).json({ error: 'invalid date range' });
    return;
  }

  // Prisma Decimal is returned as a Decimal-like object at runtime.
  // We convert to string -> number to keep it minimal and predictable.
  const basePrice = Number(room.roomType.basePrice.toString());
  if (!Number.isFinite(basePrice)) {
    res.status(500).json({ error: 'Invalid room pricing configuration' });
    return;
  }
  const totalAmount = (basePrice * nights).toFixed(2);

  const reservation = await prisma.reservation.create({
    data: {
      userId: req.user.id,
      roomId,
      startDate: from,
      endDate: to,
      status: 'PENDING',
      currency: 'PLN',
      totalAmount,
    },
    select: {
      id: true,
      status: true,
      startDate: true,
      endDate: true,
      totalAmount: true,
      currency: true,
      roomId: true,
      userId: true,
      createdAt: true,
    },
  });

  res.status(201).json({ reservation });
});
