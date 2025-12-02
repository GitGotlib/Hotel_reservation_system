import React from 'react';
import Head from 'next/head';
import Header from '../components/Header';

const Home = () => (
  <>
    <Head>
      <title>Hotel Reservation System</title>
    </Head>
    <Header />
    <main>
      <h1>Hotel Reservation System</h1>
      <p>Get started by building pages and API routes in `src/`.</p>
    </main>
  </>
);

export default Home;
