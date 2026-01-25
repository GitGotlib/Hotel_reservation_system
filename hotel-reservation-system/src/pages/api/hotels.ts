import type { NextApiRequest, NextApiResponse } from 'next';

import prisma from '../../utils/prismaClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const hotels = await prisma.hotel.findMany({
    select: { id: true, name: true, address: true },
    orderBy: [{ name: 'asc' }, { address: 'asc' }],
  });

  res.status(200).json({ hotels });
}
