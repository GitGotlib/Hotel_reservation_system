import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { createReservation } from '../../lib/api';
import { getToken } from '../../lib/auth';

export default function ReserveRoomPage() {
  const router = useRouter();
  const { roomId } = router.query as { roomId?: string };

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Simple guard: no JWT -> redirect to /login
    const token = getToken();
    if (!token) router.replace('/login');
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!roomId) {
      setError('Missing roomId');
      setLoading(false);
      return;
    }

    try {
      const result = await createReservation({
        roomId,
        startDate,
        endDate,
      });
      setSuccess(result.reservation);
    } catch (err: any) {
      if (err?.message === 'Unauthorized') {
        router.replace('/login');
        return;
      }
      setError(err?.message || 'Reservation failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Reserve</title>
      </Head>
      <main>
        <h1>Reserve room</h1>
        <p>
          Room ID: <code>{roomId ?? '...'}</code>
        </p>

        <form onSubmit={onSubmit}>
          <div>
            <label>
              Start date
              <input value={startDate} onChange={(e) => setStartDate(e.target.value)} type="date" required />
            </label>
          </div>
          <div>
            <label>
              End date
              <input value={endDate} onChange={(e) => setEndDate(e.target.value)} type="date" required />
            </label>
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create reservation'}
          </button>
        </form>

        {error && <p style={{ color: 'red' }}>{error}</p>}
        {success && (
          <pre>
            {JSON.stringify(success, null, 2)}
          </pre>
        )}

        <p>
          <Link href="/">Back</Link>
        </p>
      </main>
    </>
  );
}
