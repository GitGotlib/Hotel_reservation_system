import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';

import { getAvailableRooms, type AvailableRoom } from '../lib/api';

export default function HomePage() {
  const [hotelId, setHotelId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [rooms, setRooms] = useState<AvailableRoom[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setRooms(null);

    try {
      const result = await getAvailableRooms({ hotelId, from, to });
      setRooms(result.rooms);
    } catch (err: any) {
      setError(err?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Hotel Reservation System</title>
      </Head>
      <main>
        <h1>Search available rooms</h1>
        <form onSubmit={onSubmit}>
          <div>
            <label>
              Hotel ID
              <input value={hotelId} onChange={(e) => setHotelId(e.target.value)} required />
            </label>
          </div>
          <div>
            <label>
              From
              <input value={from} onChange={(e) => setFrom(e.target.value)} type="date" required />
            </label>
          </div>
          <div>
            <label>
              To
              <input value={to} onChange={(e) => setTo(e.target.value)} type="date" required />
            </label>
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Szukaj'}
          </button>
        </form>

        <p>
          <a href="/login">Login</a> | <a href="/register">Register</a>
        </p>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        {rooms && (
          <section>
            <h2>Available rooms</h2>
            {rooms.length === 0 ? (
              <p>No rooms available.</p>
            ) : (
              <ul>
                {rooms.map((r) => (
                  <li key={r.id}>
                    Room {r.number} ({r.roomType.name}, capacity {r.roomType.capacity}, base price{' '}
                    {String(r.roomType.basePrice)}){' '}
                    <Link href={`/reserve/${r.id}`}>Reserve</Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>
    </>
  );
}
