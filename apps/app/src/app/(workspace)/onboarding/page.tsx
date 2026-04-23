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
    description: 'Recibe y responde conversaciones desde una bandeja sencilla.',
    storageKey: integrationStorageKeys.whatsapp,
  },
  {
    key: 'googleDrive',
    name: 'Google Drive',
    description: 'Prepara el espacio para trabajar con archivos del negocio.',
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
    () => connectedIntegrations.whatsapp && connectedIntegrations.googleDrive,
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
          <h2>Conecta tus herramientas y empieza a responder.</h2>
          <p>
            Este onboarding es mock por ahora: no conectamos cuentas reales,
            solo dejamos preparada la experiencia para WhatsApp y Google Drive.
          </p>
        </div>
        <div className="onboarding-hero__steps">
          <span>1. Conecta WhatsApp</span>
          <span>2. Conecta Google Drive</span>
          <span>3. Entra al inbox</span>
        </div>
      </div>

      <div className="integration-grid">
        {integrations.map((integration) => {
          const isConnected = connectedIntegrations[integration.key];

          return (
            <article key={integration.key} className="integration-card">
              <div className="integration-card__icon" aria-hidden="true">
                {integration.key === 'whatsapp' ? 'WA' : 'GD'}
              </div>
              <div className="integration-card__content">
                <div>
                  <span
                    className={`integration-status ${
                      isConnected ? 'integration-status--connected' : ''
                    }`}
                  >
                    {isConnected ? 'Conectado' : 'No conectado'}
                  </span>
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
          {isReady ? 'Entrar al inbox' : 'Conecta tus herramientas para continuar'}
        </button>
        <Link className="button button--ghost" href="/dashboard">
          Ir al panel interno
        </Link>
      </div>
    </section>
  );
}
