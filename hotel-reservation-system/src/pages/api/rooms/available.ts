import type { NextApiRequest, NextApiResponse } from 'next';

import prisma from '../../../utils/prismaClient';

function parseDateOnly(value: string): Date | null {
  // Expect YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { hotelId, from, to } = req.query as {
    hotelId?: string;
    from?: string;
    to?: string;
  };

  if (!hotelId || !from || !to) {
    res.status(400).json({ error: 'hotelId, from, to are required' });
    return;
  }

  const fromDate = parseDateOnly(from);
  const toDate = parseDateOnly(to);
  if (!fromDate || !toDate) {
    res.status(400).json({ error: 'from/to must be YYYY-MM-DD' });
    return;
  }
  if (toDate <= fromDate) {
    res.status(400).json({ error: 'to must be after from' });
    return;
  }

  // Overlap logic (end is exclusive): existing.start < to AND existing.end > from
  // We ignore CANCELLED reservations.
  const rooms = await prisma.room.findMany({
    where: {
      hotelId,
      isActive: true,
      reservations: {
        none: {
          status: { in: ['PENDING', 'CONFIRMED'] },
          startDate: { lt: toDate },
          endDate: { gt: fromDate },
        },
      },
    },
    select: {
      id: true,
      number: true,
      floor: true,
      roomType: {
        select: {
          id: true,
          name: true,
          capacity: true,
          basePrice: true,
        },
      },
    },
    orderBy: [{ floor: 'asc' }, { number: 'asc' }],
  });

  res.status(200).json({
    hotelId,
    from,
    to,
    rooms,
  });
}
