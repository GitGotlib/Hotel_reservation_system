import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';

import { login } from '../lib/api';
import { setToken } from '../lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await login({ email, password });
      setToken(result.token);
      await router.push('/');
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Login</title>
      </Head>
      <main>
        <h1>Login</h1>
        <form onSubmit={onSubmit}>
          <div>
            <label>
              Email
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            </label>
          </div>
          <div>
            <label>
              Password
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
            </label>
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <p>
          No account? <a href="/register">Register</a>
        </p>
      </main>
    </>
  );
}
