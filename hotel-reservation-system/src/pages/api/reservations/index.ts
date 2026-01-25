import type { NextApiResponse } from 'next';

import type { Prisma } from '@prisma/client';

import prisma from '../../../utils/prismaClient';
import { requireAuth, type AuthedRequest } from '../../../lib/serverAuth';

function parseDateOnly(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function diffNights(from: Date, to: Date) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((to.getTime() - from.getTime()) / msPerDay);
}

function isRetryableTransactionError(err: unknown): boolean {
  const anyErr = err as any;
  // Prisma uses P2034 for "Transaction failed due to a write conflict or a deadlock".
  // In that case retrying is safe and expected.
  return anyErr?.code === 'P2034';
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

  const MAX_ATTEMPTS = 3;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const reservation = await prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          const room = await tx.room.findUnique({
            where: { id: roomId },
            select: {
              id: true,
              isActive: true,
              roomType: { select: { basePrice: true } },
            },
          });

          if (!room || !room.isActive) {
            // Throw to rollback and unify error handling.
            const err: any = new Error('room not found');
            err.httpStatus = 404;
            throw err;
          }

          const conflict = await tx.reservation.findFirst({
            where: {
              roomId,
              status: { in: ['PENDING', 'CONFIRMED'] },
              startDate: { lt: to },
              endDate: { gt: from },
            },
            select: { id: true },
          });

          if (conflict) {
            const err: any = new Error('room is not available for these dates');
            err.httpStatus = 409;
            throw err;
          }

          const nights = diffNights(from, to);
          if (nights <= 0) {
            const err: any = new Error('invalid date range');
            err.httpStatus = 400;
            throw err;
          }

          // Prisma Decimal is returned as a Decimal-like object at runtime.
          // Convert to string -> number to keep it minimal and predictable.
          const basePrice = Number(room.roomType.basePrice.toString());
          if (!Number.isFinite(basePrice)) {
            const err: any = new Error('Invalid room pricing configuration');
            err.httpStatus = 500;
            throw err;
          }
          const totalAmount = (basePrice * nights).toFixed(2);

          return tx.reservation.create({
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
        },
        { isolationLevel: 'Serializable' },
      );

      res.status(201).json({ reservation });
      return;
    } catch (err: any) {
      const httpStatus = err?.httpStatus as number | undefined;
      if (httpStatus) {
        res.status(httpStatus).json({ error: err.message });
        return;
      }

      if (isRetryableTransactionError(err) && attempt < MAX_ATTEMPTS) {
        // Small backoff to reduce immediate contention.
        await new Promise((r) => setTimeout(r, 25 * attempt));
        continue;
      }

      // Unknown error
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
  }
});
