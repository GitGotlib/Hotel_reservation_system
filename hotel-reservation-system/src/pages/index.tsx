import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { getAvailableRooms, getHotels, type AvailableRoom, type HotelListItem } from '../lib/api';

export default function HomePage() {
  const [hotelId, setHotelId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [rooms, setRooms] = useState<AvailableRoom[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [hotels, setHotels] = useState<HotelListItem[] | null>(null);
  const [hotelsLoading, setHotelsLoading] = useState(false);
  const [hotelsError, setHotelsError] = useState<string | null>(null);

  // Fetch hotels once on first render (client-side)
  useEffect(() => {
    let cancelled = false;
    setHotelsLoading(true);
    getHotels()
      .then((res) => {
        if (cancelled) return;
        setHotels(res.hotels);
      })
      .catch((err: any) => {
        if (cancelled) return;
        setHotelsError(err?.message || 'Failed to load hotels');
      })
      .finally(() => {
        if (cancelled) return;
        setHotelsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
        <h1 style={{ margin: '0 0 12px' }}>Search available rooms</h1>
        <p style={{ margin: '0 0 16px', color: '#374151' }}>
          Choose a hotel (UUID), set dates, then reserve a room.
        </p>

        <form
          onSubmit={onSubmit}
          style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          }}
        >
          <div>
            <label>
              Hotel ID
              <input
                value={hotelId}
                onChange={(e) => setHotelId(e.target.value)}
                required
                placeholder="UUID"
                style={{
                  display: 'block',
                  width: '100%',
                  marginTop: 6,
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #d1d5db',
                }}
              />
            </label>
          </div>
          <div>
            <label>
              From
              <input
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                type="date"
                required
                style={{
                  display: 'block',
                  width: '100%',
                  marginTop: 6,
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #d1d5db',
                }}
              />
            </label>
          </div>
          <div>
            <label>
              To
              <input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                type="date"
                required
                style={{
                  display: 'block',
                  width: '100%',
                  marginTop: 6,
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #d1d5db',
                }}
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 10,
              background: '#111827',
              color: 'white',
              border: 0,
              borderRadius: 10,
              padding: '10px 12px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {loading ? 'Searching...' : 'Szukaj'}
          </button>
        </form>

        <section style={{ marginTop: 18 }}>
          <h2 style={{ margin: '0 0 8px' }}>Lista hoteli</h2>
          <p style={{ margin: '0 0 12px', color: '#374151' }}>
            Skopiuj UUID i wklej do pola „Hotel ID”.
          </p>

          {hotelsLoading && <p>Loading hotels…</p>}
          {hotelsError && <p style={{ color: 'red' }}>{hotelsError}</p>}

          {hotels && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
              {hotels.map((h) => (
                <div
                  key={h.id}
                  style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: 12,
                    padding: 14,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{h.name}</div>
                  {h.address && <div style={{ color: '#374151', marginTop: 4 }}>{h.address}</div>}
                  <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <code style={{ fontSize: 12, padding: '4px 6px', background: '#f3f4f6', borderRadius: 8 }}>
                      {h.id}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        setHotelId(h.id);
                        if (typeof navigator !== 'undefined' && navigator.clipboard) {
                          navigator.clipboard.writeText(h.id).catch(() => undefined);
                        }
                      }}
                      style={{
                        border: '1px solid #d1d5db',
                        background: 'white',
                        borderRadius: 10,
                        padding: '6px 10px',
                        cursor: 'pointer',
                      }}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

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
