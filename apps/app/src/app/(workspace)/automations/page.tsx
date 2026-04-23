'use client';

import { useEffect, useMemo, useState } from 'react';

type AutomationKey = 'welcome' | 'off_hours';

type AutomationConfig = {
  enabled: boolean;
  message: string;
};

type AutomationsState = Record<AutomationKey, AutomationConfig>;

type AutomationDefinition = {
  key: AutomationKey;
  title: string;
  description: string;
};

const automationsStorageKey = 'automations';

const automationDefinitions: AutomationDefinition[] = [
  {
    key: 'welcome',
    title: 'Respuesta automática',
    description: 'Responde automáticamente el primer mensaje',
  },
  {
    key: 'off_hours',
    title: 'Fuera de horario',
    description: 'Responde cuando no estás disponible',
  },
];

const defaultAutomationsState: AutomationsState = {
  welcome: {
    enabled: false,
    message: 'Hola, gracias por escribir. Enseguida te respondemos.',
  },
  off_hours: {
    enabled: false,
    message: 'Ahora mismo estamos fuera de horario. Te responderemos en cuanto volvamos.',
  },
};

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<AutomationsState>(defaultAutomationsState);
  const [activeAutomationKey, setActiveAutomationKey] = useState<AutomationKey | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setAutomations(readStoredAutomations());
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(automationsStorageKey, JSON.stringify(automations));
  }, [automations, isHydrated]);

  const activeAutomationDefinition = useMemo(
    () =>
      automationDefinitions.find((automation) => automation.key === activeAutomationKey) ?? null,
    [activeAutomationKey],
  );

  function updateAutomation(
    automationKey: AutomationKey,
    updates: Partial<AutomationConfig>,
  ) {
    setAutomations((currentAutomations) => ({
      ...currentAutomations,
      [automationKey]: {
        ...currentAutomations[automationKey],
        ...updates,
      },
    }));
  }

  return (
    <section className="automations-page">
      <div className="dashboard-hero">
        <div>
          <span className="workspace-header__eyebrow">Automations</span>
          <h2>Automatiza respuestas simples sin complicarte.</h2>
          <p>
            Activa reglas básicas, ajusta el mensaje y deja lista una primera
            configuración operativa directamente desde esta pantalla.
          </p>
        </div>
      </div>

      <div className="automation-grid">
        {automationDefinitions.map((automation) => {
          const config = automations[automation.key];

          return (
            <article key={automation.key} className="automation-card">
              <div className="automation-card__header">
                <div>
                  <span
                    className={`automation-status ${
                      config.enabled ? 'automation-status--enabled' : ''
                    }`}
                  >
                    {config.enabled ? 'ON' : 'OFF'}
                  </span>
                  <h3>{automation.title}</h3>
                </div>
                <button
                  className={`toggle-switch ${
                    config.enabled ? 'toggle-switch--enabled' : ''
                  }`}
                  type="button"
                  aria-pressed={config.enabled}
                  onClick={() =>
                    updateAutomation(automation.key, { enabled: !config.enabled })
                  }
                >
                  <span />
                </button>
              </div>

              <p>{automation.description}</p>

              <div className="automation-card__footer">
                <span className="automation-card__message">
                  {config.message}
                </span>
                <button
                  className="button button--ghost"
                  type="button"
                  onClick={() => setActiveAutomationKey(automation.key)}
                >
                  Configurar
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {activeAutomationDefinition ? (
        <div
          className="automation-modal-backdrop"
          role="presentation"
          onClick={() => setActiveAutomationKey(null)}
        >
          <section
            className="automation-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="automation-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="automation-modal__header">
              <div>
                <span className="workspace-header__eyebrow">Configurar</span>
                <h3 id="automation-modal-title">{activeAutomationDefinition.title}</h3>
                <p>{activeAutomationDefinition.description}</p>
              </div>
              <button
                className="button button--ghost"
                type="button"
                onClick={() => setActiveAutomationKey(null)}
              >
                Cerrar
              </button>
            </div>

            <div className="automation-modal__body">
              <div className="automation-modal__row">
                <div>
                  <strong>Activar automatización</strong>
                  <p>Controla si esta respuesta queda disponible ahora mismo.</p>
                </div>
                <button
                  className={`toggle-switch ${
                    automations[activeAutomationDefinition.key].enabled
                      ? 'toggle-switch--enabled'
                      : ''
                  }`}
                  type="button"
                  aria-pressed={automations[activeAutomationDefinition.key].enabled}
                  onClick={() =>
                    updateAutomation(activeAutomationDefinition.key, {
                      enabled: !automations[activeAutomationDefinition.key].enabled,
                    })
                  }
                >
                  <span />
                </button>
              </div>

              <label className="automation-modal__field">
                <span>Mensaje</span>
                <textarea
                  className="automation-modal__textarea"
                  value={automations[activeAutomationDefinition.key].message}
                  onChange={(event) =>
                    updateAutomation(activeAutomationDefinition.key, {
                      message: event.target.value,
                    })
                  }
                />
              </label>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function readStoredAutomations(): AutomationsState {
  const storedValue = window.localStorage.getItem(automationsStorageKey);

  if (!storedValue) {
    return defaultAutomationsState;
  }

  try {
    const parsedValue = JSON.parse(storedValue) as Partial<AutomationsState>;

    return {
      welcome: {
        ...defaultAutomationsState.welcome,
        ...parsedValue.welcome,
      },
      off_hours: {
        ...defaultAutomationsState.off_hours,
        ...parsedValue.off_hours,
      },
    };
  } catch {
    return defaultAutomationsState;
  }
}
