import { useState, useEffect } from 'react';

export default function useAuth() {
  const [user, setUser] = useState(null as any);

  useEffect(() => {
    // placeholder: check token in localStorage, call /api/auth/me, etc.
  }, []);

  return { user, setUser };
}
