'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  defaultTenantEntitlements,
  fetchTenantEntitlements,
  getTenantPlanBadgeClass,
  type TenantEntitlements,
} from '../../lib/entitlements';

type WorkspaceLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

const navigation = [
  { href: '/onboarding', label: 'Inicio', description: 'Primeros pasos' },
  { href: '/dashboard', label: 'Panel', description: 'Resumen general' },
  { href: '/inbox', label: 'Bandeja', description: 'Conversaciones' },
  {
    href: '/automations',
    label: 'Automatizaciones',
    description: 'Reglas activas',
  },
  { href: '/business', label: 'Negocio', description: 'Perfil y contexto' },
  {
    href: '/agenda',
    label: 'Agenda',
    description: 'Servicios, citas y bloqueos',
  },
  { href: '/ai', label: 'IA', description: 'Asistente' },
];

export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const [entitlements, setEntitlements] = useState<TenantEntitlements | null>(
    null,
  );
  const [isPlanLoading, setIsPlanLoading] = useState(true);
  const [planError, setPlanError] = useState(false);

  const effectiveEntitlements = entitlements ?? defaultTenantEntitlements;
  const planLabel = isPlanLoading
    ? 'Cargando plan...'
    : planError
      ? 'No se ha podido cargar el plan.'
      : entitlements?.plan ?? 'Plan no disponible';

  useEffect(() => {
    let isMounted = true;
    setIsPlanLoading(true);
    setPlanError(false);
    fetchTenantEntitlements()
      .then((nextEntitlements) => {
        if (isMounted) setEntitlements(nextEntitlements);
      })
      .catch(() => {
        if (isMounted) {
          setEntitlements(null);
          setPlanError(true);
        }
      })
      .finally(() => {
        if (isMounted) setIsPlanLoading(false);
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
            <strong>Espacio de trabajo</strong>
            <p>Panel de control</p>
          </div>
        </div>

        <nav className="workspace-nav" aria-label="Navegación principal">
          {navigation.map((item) => (
            <Link
              key={item.href}
              className="workspace-nav__link"
              href={item.href}
            >
              <strong>
                {item.label}
                {item.href === '/ai' && !effectiveEntitlements.features.canUseAi ? (
                  <span className="workspace-nav__badge">PRO</span>
                ) : null}
                {item.href === '/agenda' &&
                !effectiveEntitlements.features.canUseAgenda ? (
                  <span className="workspace-nav__badge">PRO</span>
                ) : null}
              </strong>
              <span>{item.description}</span>
            </Link>
          ))}
        </nav>

        <div className="workspace-plan-card" aria-live="polite">
          <span className="workspace-sidebar__eyebrow">Plan actual</span>
          <strong
            className={
              entitlements ? getTenantPlanBadgeClass(entitlements.plan) : 'plan-badge'
            }
          >
            {planLabel}
          </strong>
        </div>

        <div className="workspace-sidebar__card">
          <span className="workspace-sidebar__eyebrow">MVP</span>
          <p>
            Tu espacio de trabajo reúne las herramientas principales para gestionar
            conversaciones, agenda y automatizaciones.
          </p>
        </div>
      </aside>

      <div className="workspace-main">
        <header className="workspace-header">
          <div>
            <span className="workspace-header__eyebrow">Aplicación privada</span>
            <h1>Panel interno</h1>
          </div>
          <Link className="button button--ghost" href="/login">
            Cerrar sesión
          </Link>
        </header>

        <main className="workspace-content">{children}</main>
      </div>
    </div>
  );
}
