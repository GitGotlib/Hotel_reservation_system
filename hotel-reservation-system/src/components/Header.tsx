import Link from 'next/link';

import useAuth from '../hooks/useAuth';

export default function Header() {
  const { user, isAuthenticated, loading, logout } = useAuth();

  return (
    <header
      style={{
        background: '#111827',
        color: 'white',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div
        style={{
          maxWidth: 980,
          margin: '0 auto',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <Link
          href="/"
          style={{
            color: 'white',
            textDecoration: 'none',
            fontWeight: 700,
            letterSpacing: 0.2,
          }}
        >
          Hotel Reservation System
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!isAuthenticated ? (
            <>
              <Link
                href="/login"
                style={{
                  color: 'white',
                  textDecoration: 'none',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.18)',
                }}
              >
                Login
              </Link>
              <Link
                href="/register"
                style={{
                  color: '#111827',
                  background: 'white',
                  textDecoration: 'none',
                  padding: '8px 10px',
                  borderRadius: 8,
                  fontWeight: 600,
                }}
              >
                Register
              </Link>
            </>
          ) : (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600 }}>
                {loading ? 'Loading…' : user?.name || user?.email}
              </div>
              <button
                type="button"
                onClick={logout}
                style={{
                  marginTop: 4,
                  background: 'transparent',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.18)',
                  borderRadius: 8,
                  padding: '6px 10px',
                  cursor: 'pointer',
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
