'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  defaultTenantEntitlements,
  fetchTenantEntitlements,
  type TenantEntitlements,
} from '../../lib/entitlements';

type WorkspaceLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

const navigation = [
  { href: '/onboarding', label: 'Inicio', description: 'Primeros pasos' },
  { href: '/dashboard', label: 'Dashboard', description: 'Resumen general' },
  { href: '/inbox', label: 'Inbox', description: 'Conversaciones' },
  { href: '/automations', label: 'Automations', description: 'Reglas activas' },
  { href: '/business', label: 'Negocio', description: 'Perfil y contexto' },
  {
    href: '/agenda',
    label: 'Agenda',
    description: 'Servicios, citas y bloqueos',
  },
  { href: '/ai', label: 'IA', description: 'Autopilot' },
];

export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const [entitlements, setEntitlements] = useState<TenantEntitlements>(
    defaultTenantEntitlements,
  );

  useEffect(() => {
    let isMounted = true;
    fetchTenantEntitlements()
      .then((nextEntitlements) => {
        if (isMounted) setEntitlements(nextEntitlements);
      })
      .catch(() => {
        if (isMounted) setEntitlements(defaultTenantEntitlements);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="workspace-shell">
      <aside className="workspace-sidebar">
        <div className="workspace-brand">
          <span className="workspace-brand__mark">WS</span>
          <div>
            <strong>Workspace</strong>
            <p>Control room</p>
          </div>
        </div>

        <nav className="workspace-nav" aria-label="Primary">
          {navigation.map((item) => (
            <Link
              key={item.href}
              className="workspace-nav__link"
              href={item.href}
            >
              <strong>
                {item.label}
                {item.href === '/ai' && !entitlements.features.canUseAi ? (
                  <span className="workspace-nav__badge">PRO</span>
                ) : null}
                {item.href === '/agenda' &&
                !entitlements.features.canUseAgenda ? (
                  <span className="workspace-nav__badge">PRO</span>
                ) : null}
              </strong>
              <span>{item.description}</span>
            </Link>
          ))}
        </nav>

        <div className="workspace-sidebar__card">
          <span className="workspace-sidebar__eyebrow">MVP</span>
          <p>
            La shell ya está lista para conectar auth y datos reales en el
            siguiente bloque.
          </p>
        </div>
      </aside>

      <div className="workspace-main">
        <header className="workspace-header">
          <div>
            <span className="workspace-header__eyebrow">Private app</span>
            <h1>Panel interno</h1>
          </div>
          <Link className="button button--ghost" href="/login">
            Sign out
          </Link>
        </header>

        <main className="workspace-content">{children}</main>
      </div>
    </div>
  );
}
