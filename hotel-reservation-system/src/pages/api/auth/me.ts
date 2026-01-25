import type { NextApiResponse } from 'next';

import { requireAuth, type AuthedRequest } from '../../../lib/serverAuth';

export default requireAuth(async function handler(req: AuthedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // user is loaded from DB in requireAuth/getAuthUser
  res.status(200).json({
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
    },
  });
});
