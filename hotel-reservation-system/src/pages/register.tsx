import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';

import { register } from '../lib/api';
import { setToken } from '../lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await register({ email, password, name });
      // Register endpoint returns token too – we store it to keep UX minimal.
      setToken(result.token);
      await router.push('/');
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Register</title>
      </Head>
      <main>
        <h1>Register</h1>
        <form onSubmit={onSubmit}>
          <div>
            <label>
              Name
              <input value={name} onChange={(e) => setName(e.target.value)} type="text" />
            </label>
          </div>
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
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <p>
          Already have an account? <a href="/login">Login</a>
        </p>
      </main>
    </>
  );
}
