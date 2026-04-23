'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type IntegrationKey = 'whatsapp' | 'googleDrive';

type Integration = {
  key: IntegrationKey;
  name: string;
  description: string;
  storageKey: string;
};

const integrationStorageKeys: Record<IntegrationKey, string> = {
  whatsapp: 'onboarding.whatsappConnected',
  googleDrive: 'onboarding.googleDriveConnected',
};

const integrations: Integration[] = [
  {
    key: 'whatsapp',
    name: 'WhatsApp',
    description: 'Activa la bandeja principal para empezar a responder clientes.',
    storageKey: integrationStorageKeys.whatsapp,
  },
  {
    key: 'googleDrive',
    name: 'Google Drive',
    description: 'Opcional: prepara archivos y contexto para el equipo.',
    storageKey: integrationStorageKeys.googleDrive,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [connectedIntegrations, setConnectedIntegrations] = useState<
    Record<IntegrationKey, boolean>
  >({
    whatsapp: false,
    googleDrive: false,
  });

  useEffect(() => {
    setConnectedIntegrations({
      whatsapp: window.localStorage.getItem(integrationStorageKeys.whatsapp) === 'true',
      googleDrive:
        window.localStorage.getItem(integrationStorageKeys.googleDrive) === 'true',
    });
    setIsHydrated(true);
  }, []);

  const isReady = useMemo(
    () => connectedIntegrations.whatsapp,
    [connectedIntegrations],
  );

  function connectIntegration(integration: Integration) {
    window.localStorage.setItem(integration.storageKey, 'true');
    setConnectedIntegrations((currentState) => ({
      ...currentState,
      [integration.key]: true,
    }));
  }

  return (
    <section className="onboarding-page">
      <div className="onboarding-hero">
        <div>
          <span className="workspace-header__eyebrow">Primeros pasos</span>
          <h2>Conecta WhatsApp y empieza a responder clientes.</h2>
          <p>
            En este primer paso dejamos listo el flujo principal: conectar
            WhatsApp, abrir el inbox y empezar a gestionar conversaciones.
            Google Drive puede quedar preparado como apoyo.
          </p>
        </div>
        <div className="onboarding-hero__steps">
          <span>1. Conecta WhatsApp</span>
          <span>2. Suma Google Drive si lo necesitas</span>
          <span>3. Entra al inbox y responde</span>
        </div>
      </div>

      <div className="integration-grid">
        {integrations.map((integration) => {
          const isConnected = connectedIntegrations[integration.key];

          return (
            <article
              key={integration.key}
              className={`integration-card ${
                integration.key === 'whatsapp' ? 'integration-card--primary' : ''
              }`}
            >
              <div className="integration-card__icon" aria-hidden="true">
                {integration.key === 'whatsapp' ? 'WA' : 'GD'}
              </div>
              <div className="integration-card__content">
                <div>
                  <div className="integration-card__meta">
                    <span
                      className={`integration-status ${
                        isConnected ? 'integration-status--connected' : ''
                      }`}
                    >
                      {isConnected ? 'Conectado' : 'No conectado'}
                    </span>
                    <span className="integration-priority">
                      {integration.key === 'whatsapp' ? 'Principal' : 'Opcional'}
                    </span>
                  </div>
                  <h3>{integration.name}</h3>
                  <p>{integration.description}</p>
                </div>
                <button
                  className={`button ${
                    isConnected ? 'button--ghost' : 'button--primary'
                  }`}
                  type="button"
                  disabled={!isHydrated || isConnected}
                  onClick={() => connectIntegration(integration)}
                >
                  {isConnected ? 'Conectado' : 'Conectar'}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="onboarding-actions">
        <button
          className="button button--primary onboarding-actions__primary"
          type="button"
          disabled={!isHydrated || !isReady}
          onClick={() => router.push('/inbox')}
        >
          {isReady ? 'Entrar al inbox' : 'Conecta WhatsApp para empezar'}
        </button>
        <Link className="onboarding-actions__secondary" href="/dashboard">
          Ir al panel interno
        </Link>
      </div>
    </section>
  );
}
