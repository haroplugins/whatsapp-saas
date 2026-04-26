'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  type BusinessHours,
  readStoredBusinessHours,
  saveStoredBusinessHours,
} from '../../../lib/business-hours';

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
    title: 'Respuesta automatica',
    description: 'Responde automaticamente el primer mensaje',
  },
  {
    key: 'off_hours',
    title: 'Fuera de horario',
    description: 'Responde cuando no estas disponible',
  },
];

const weekdayOptions = [
  { label: 'Lunes', value: 1 },
  { label: 'Martes', value: 2 },
  { label: 'Miercoles', value: 3 },
  { label: 'Jueves', value: 4 },
  { label: 'Viernes', value: 5 },
  { label: 'Sabado', value: 6 },
  { label: 'Domingo', value: 0 },
];

const timezoneOptions = [
  'Europe/Madrid',
  'Atlantic/Canary',
  'Europe/Lisbon',
  'Europe/Paris',
  'Europe/London',
  'America/Mexico_City',
  'America/Bogota',
  'America/Argentina/Buenos_Aires',
  'America/Santiago',
  'America/Lima',
  'America/New_York',
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
  const [businessHours, setBusinessHours] = useState<BusinessHours>({
    timezone: 'Europe/Madrid',
    days: [1, 2, 3, 4, 5],
    start: '09:00',
    end: '18:00',
  });
  const [activeAutomationKey, setActiveAutomationKey] = useState<AutomationKey | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setAutomations(readStoredAutomations());
    setBusinessHours(readStoredBusinessHours());
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(automationsStorageKey, JSON.stringify(automations));
  }, [automations, isHydrated]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    saveStoredBusinessHours(businessHours);
  }, [businessHours, isHydrated]);

  const activeAutomationDefinition = useMemo(
    () =>
      automationDefinitions.find((automation) => automation.key === activeAutomationKey) ?? null,
    [activeAutomationKey],
  );

  function updateAutomation(automationKey: AutomationKey, updates: Partial<AutomationConfig>) {
    setAutomations((currentAutomations) => ({
      ...currentAutomations,
      [automationKey]: {
        ...currentAutomations[automationKey],
        ...updates,
      },
    }));
  }

  function updateBusinessHours(updates: Partial<BusinessHours>) {
    setBusinessHours((currentBusinessHours) => ({
      ...currentBusinessHours,
      ...updates,
    }));
  }

  function toggleBusinessHoursDay(day: number) {
    const nextDays = businessHours.days.includes(day)
      ? businessHours.days.filter((currentDay) => currentDay !== day)
      : [...businessHours.days, day].sort((firstDay, secondDay) => firstDay - secondDay);

    updateBusinessHours({ days: nextDays });
  }

  return (
    <section className="automations-page">
      <div className="dashboard-hero">
        <div>
          <span className="workspace-header__eyebrow">Automations</span>
          <h2>Automatiza respuestas simples sin complicarte.</h2>
          <p>
            Activa reglas basicas, ajusta el mensaje y deja lista una primera
            configuracion operativa directamente desde esta pantalla.
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
                  <h3 title={getAutomationTooltip(automation.key)}>{automation.title}</h3>
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

              {automation.key === 'off_hours' ? (
                <div className="business-hours-card">
                  <label className="business-hours-card__field">
                    <span>Zona horaria</span>
                    <select
                      value={businessHours.timezone}
                      onChange={(event) => updateBusinessHours({ timezone: event.target.value })}
                    >
                      {timezoneOptions.map((timezone) => (
                        <option key={timezone} value={timezone}>{timezone}</option>
                      ))}
                    </select>
                  </label>
                  <div className="business-hours-card__time-grid">
                    <label className="business-hours-card__field">
                      <span>Inicio</span>
                      <input
                        type="time"
                        value={businessHours.start}
                        onChange={(event) => updateBusinessHours({ start: event.target.value })}
                      />
                    </label>
                    <label className="business-hours-card__field">
                      <span>Fin</span>
                      <input
                        type="time"
                        value={businessHours.end}
                        onChange={(event) => updateBusinessHours({ end: event.target.value })}
                      />
                    </label>
                  </div>
                  <fieldset className="business-hours-card__days">
                    <legend>Dias laborales</legend>
                    <div className="business-hours-card__days-grid">
                      {weekdayOptions.map((day) => (
                        <label key={day.value} className="automation-day-pill">
                          <input
                            type="checkbox"
                            checked={businessHours.days.includes(day.value)}
                            onChange={() => toggleBusinessHoursDay(day.value)}
                          />
                          <span>{day.label.slice(0, 3)}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>
              ) : null}

              <div className="automation-card__footer">
                <span className="automation-card__message">{config.message}</span>
                {automation.key === 'off_hours' ? (
                  <span className="automation-card__meta">
                    {formatBusinessHoursSummary(businessHours)}
                  </span>
                ) : null}
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
                  <strong>Activar automatizacion</strong>
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

function formatBusinessHoursSummary(businessHours: BusinessHours): string {
  const formattedDays = weekdayOptions
    .filter((day) => businessHours.days.includes(day.value))
    .map((day) => day.label.slice(0, 3))
    .join(', ');

  return `${formattedDays} | ${businessHours.start} - ${businessHours.end} | ${businessHours.timezone}`;
}

function getAutomationTooltip(automationKey: AutomationKey): string {
  return automationKey === 'welcome'
    ? 'Se envia una sola vez al primer mensaje del cliente'
    : 'Responde cuando no estas disponible';
}
