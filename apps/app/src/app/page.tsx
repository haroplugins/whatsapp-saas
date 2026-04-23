'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getAccessToken } from '../lib/api';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(getAccessToken() ? '/onboarding' : '/login');
  }, [router]);

  return (
    <main className="entry-page">
      <section className="entry-card">
        <span className="workspace-header__eyebrow">Cargando</span>
        <h1>Preparando tu workspace...</h1>
        <p>Te llevamos al mejor punto para continuar.</p>
      </section>
    </main>
  );
}
