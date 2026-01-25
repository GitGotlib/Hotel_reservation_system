import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';

import { clearToken, getToken } from '../lib/auth';
import { getMe, type MeUser } from '../lib/api';

export default function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    getMe()
      .then((res) => {
        if (cancelled) return;
        setUser(res.user);
      })
      .catch(() => {
        // Token invalid/expired -> clear local state; UX: user sees Login/Register again.
        if (cancelled) return;
        clearToken();
        setUser(null);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const isAuthenticated = useMemo(() => !!user, [user]);

  function logout() {
    clearToken();
    setUser(null);
    router.push('/login');
  }

  return { user, loading, isAuthenticated, logout, setUser };
}
