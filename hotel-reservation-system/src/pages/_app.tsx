import type { AppProps } from 'next/app';

import Header from '../components/Header';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div style={{ minHeight: '100vh', background: '#f6f7fb', color: '#111827' }}>
      <Header />
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '24px 16px 48px' }}>
        <Component {...pageProps} />
      </div>
    </div>
  );
}
