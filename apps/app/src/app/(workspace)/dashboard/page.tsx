'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../../lib/api';
import {
  fetchTenantEntitlements,
  getTenantPlanBadgeClass,
  getTenantPlanDescription,
  type TenantEntitlements,
} from '../../../lib/entitlements';

type ConversationsSummary = {
  total: number;
  totalBusiness: number;
  totalPersonal: number;
};

type MessagesSummary = {
  total: number;
  sentByUser: number;
  sentByClient: number;
  sentByAi: number;
};

type AutomationsSummary = {
  total: number;
  active: number;
  inactive: number;
};

type DashboardData = {
  conversations: ConversationsSummary;
  messages: MessagesSummary;
  automations: AutomationsSummary;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [entitlements, setEntitlements] = useState<TenantEntitlements | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlanLoading, setIsPlanLoading] = useState(true);
  const [planError, setPlanError] = useState(false);

  const planValue = isPlanLoading
    ? 'Cargando plan...'
    : planError
      ? 'No se ha podido cargar el plan.'
      : entitlements?.plan ?? 'Plan no disponible';
  const planSummary = entitlements
    ? getTenantPlanDescription(entitlements.plan)
    : isPlanLoading
      ? 'Estamos consultando la información de tu espacio de trabajo.'
      : 'No se ha podido mostrar la información del plan actual.';

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setIsLoading(true);
      setError(null);

      try {
        const [conversations, messages, automations] = await Promise.all([
          apiFetch<ConversationsSummary>('/dashboard/conversations'),
          apiFetch<MessagesSummary>('/dashboard/messages'),
          apiFetch<AutomationsSummary>('/dashboard/automations'),
        ]);

        if (!isMounted) {
          return;
        }

        setData({
          conversations,
          messages,
          automations,
        });
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : 'No se pudo cargar el panel.',
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

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
    <section className="dashboard-page">
      <div className="dashboard-hero">
        <div>
          <span className="workspace-header__eyebrow">Panel</span>
          <h2>Vista real del equipo</h2>
          <p>
            Consulta la actividad real de tu espacio de trabajo en un solo
            lugar.
          </p>
          <p className="config-conflict-note">
            Algunas métricas pueden incluir datos de prueba mientras el entorno
            está en validación.
          </p>
        </div>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="dashboard-grid">
        <article className="metric-card">
          <span className="metric-card__label">Conversaciones</span>
          <strong className="metric-card__value">
            {isLoading ? '...' : data?.conversations.total ?? 0}
          </strong>
          <p className="metric-card__summary">
            Volumen total de conversaciones y reparto entre negocio y personal.
          </p>
          <div className="metric-card__details">
            <div>
              <span>Negocio</span>
              <strong className={isLoading ? 'metric-card__skeleton' : ''}>
                {isLoading ? ' ' : data?.conversations.totalBusiness ?? 0}
              </strong>
            </div>
            <div>
              <span>Personal</span>
              <strong className={isLoading ? 'metric-card__skeleton' : ''}>
                {isLoading ? ' ' : data?.conversations.totalPersonal ?? 0}
              </strong>
            </div>
          </div>
        </article>

        <article className="metric-card">
          <span className="metric-card__label">Mensajes</span>
          <strong className="metric-card__value">
            {isLoading ? '...' : data?.messages.total ?? 0}
          </strong>
          <p className="metric-card__summary">
            Actividad del chat diferenciando mensajes del equipo y del cliente.
          </p>
          <div className="metric-card__details">
            <div>
              <span>Equipo</span>
              <strong className={isLoading ? 'metric-card__skeleton' : ''}>
                {isLoading ? ' ' : data?.messages.sentByUser ?? 0}
              </strong>
            </div>
            <div>
              <span>Cliente</span>
              <strong className={isLoading ? 'metric-card__skeleton' : ''}>
                {isLoading ? ' ' : data?.messages.sentByClient ?? 0}
              </strong>
            </div>
            <div>
              <span>Asistente</span>
              <strong className={isLoading ? 'metric-card__skeleton' : ''}>
                {isLoading ? ' ' : data?.messages.sentByAi ?? 0}
              </strong>
            </div>
          </div>
        </article>

        <article className="metric-card">
          <span className="metric-card__label">Automatizaciones</span>
          <strong className="metric-card__value">
            {isLoading ? '...' : data?.automations.total ?? 0}
          </strong>
          <p className="metric-card__summary">
            Estado general de reglas activas e inactivas listas para operar.
          </p>
          <div className="metric-card__details">
            <div>
              <span>Activas</span>
              <strong className={isLoading ? 'metric-card__skeleton' : ''}>
                {isLoading ? ' ' : data?.automations.active ?? 0}
              </strong>
            </div>
            <div>
              <span>Inactivas</span>
              <strong className={isLoading ? 'metric-card__skeleton' : ''}>
                {isLoading ? ' ' : data?.automations.inactive ?? 0}
              </strong>
            </div>
          </div>
        </article>

        <article className="metric-card metric-card--plan">
          <span className="metric-card__label">Plan actual</span>
          <strong
            className={
              entitlements
                ? `${getTenantPlanBadgeClass(entitlements.plan)} dashboard-plan-badge`
                : 'plan-badge dashboard-plan-badge'
            }
          >
            {planValue}
          </strong>
          <p className="metric-card__summary">{planSummary}</p>
        </article>
      </div>
    </section>
  );
}
