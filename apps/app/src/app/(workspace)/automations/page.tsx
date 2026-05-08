'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  type BusinessHours,
  readStoredBusinessHours,
  saveStoredBusinessHours,
} from '../../../lib/business-hours';
import {
  readStoredAIConfig,
  saveStoredAIConfig,
} from '../../../lib/ai-config';
import {
  defaultTenantEntitlements,
  fetchTenantEntitlements,
  type TenantEntitlements,
} from '../../../lib/entitlements';
import {
  defaultSmartBookingSettings,
  fetchSmartBookingSettings,
  type SmartBookingMode,
  type SmartBookingMissingInfoBehavior,
  type SmartBookingSettings,
  type UpdateSmartBookingSettingsInput,
  updateSmartBookingSettings,
} from '../../../lib/smart-booking';

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
    description: 'Responde automáticamente al primer mensaje',
  },
  {
    key: 'off_hours',
    title: 'Fuera de horario',
    description: 'Responde cuando no estás disponible',
  },
];

const weekdayOptions = [
  { label: 'Lunes', value: 1 },
  { label: 'Martes', value: 2 },
  { label: 'Miércoles', value: 3 },
  { label: 'Jueves', value: 4 },
  { label: 'Viernes', value: 5 },
  { label: 'Sábado', value: 6 },
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
  const [smartBookingSettings, setSmartBookingSettings] = useState<SmartBookingSettings>(
    { ...defaultSmartBookingSettings, locked: false },
  );
  const [isSmartBookingLoading, setIsSmartBookingLoading] = useState(false);
  const [smartBookingError, setSmartBookingError] = useState<string | null>(null);
  const [entitlements, setEntitlements] = useState<TenantEntitlements>(
    defaultTenantEntitlements,
  );
  const [businessHours, setBusinessHours] = useState<BusinessHours>({
    timezone: 'Europe/Madrid',
    days: [1, 2, 3, 4, 5],
    start: '09:00',
    end: '18:00',
  });
  const [activeAutomationKey, setActiveAutomationKey] = useState<AutomationKey | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const isSmartBookingLocked =
    !entitlements.features.canUseSmartBooking || smartBookingSettings.locked;
  const canUseAutoBookingConfirm = smartBookingSettings.canUseAutoBookingConfirm;
  const smartBookingStatus = !isSmartBookingLocked
    ? smartBookingSettings.enabled
      ? 'Activada'
      : 'Desactivada'
    : 'Bloqueada';
  const smartBookingLockMessage =
    entitlements.plan === 'PRO'
      ? 'Tu plan Pro incluye Agenda manual. La agenda inteligente estará disponible en Premium.'
      : 'Disponible en Premium.';

  useEffect(() => {
    setAutomations(readStoredAutomations());
    setBusinessHours(readStoredBusinessHours());
    setIsHydrated(true);
  }, []);

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

  useEffect(() => {
    if (!isHydrated || !entitlements.features.canUseSmartBooking) {
      return;
    }

    let isMounted = true;
    setIsSmartBookingLoading(true);
    setSmartBookingError(null);

    fetchSmartBookingSettings()
      .then((settings) => {
        if (isMounted) setSmartBookingSettings(settings);
      })
      .catch((error: Error) => {
        if (isMounted) {
          setSmartBookingError(error.message);
          setSmartBookingSettings({
            ...defaultSmartBookingSettings,
            locked: false,
            canUseAutoBookingConfirm: entitlements.features.canUseAutoBookingConfirm,
          });
        }
      })
      .finally(() => {
        if (isMounted) setIsSmartBookingLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    entitlements.features.canUseAutoBookingConfirm,
    entitlements.features.canUseSmartBooking,
    isHydrated,
  ]);

  const activeAutomationDefinition = useMemo(
    () =>
      automationDefinitions.find((automation) => automation.key === activeAutomationKey) ?? null,
    [activeAutomationKey],
  );

  function updateAutomation(automationKey: AutomationKey, updates: Partial<AutomationConfig>) {
    if (automationKey === 'off_hours' && updates.enabled === true) {
      const aiConfig = readStoredAIConfig();

      if (aiConfig.useOutsideHours) {
        saveStoredAIConfig({
          ...aiConfig,
          useOutsideHours: false,
        });
      }
    }

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

  async function saveSmartBookingSettings(updates: UpdateSmartBookingSettingsInput) {
    if (isSmartBookingLocked) {
      return;
    }

    setIsSmartBookingLoading(true);
    setSmartBookingError(null);

    try {
      const settings = await updateSmartBookingSettings(updates);
      setSmartBookingSettings(settings);
    } catch (error) {
      setSmartBookingError(error instanceof Error ? error.message : 'No se pudo guardar.');
    } finally {
      setIsSmartBookingLoading(false);
    }
  }

  return (
    <section className="automations-page">
      <div className="dashboard-hero">
        <div>
          <span className="workspace-header__eyebrow">Automatizaciones</span>
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
                    <legend>Días laborales</legend>
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
                {automation.key === 'off_hours' && config.enabled ? (
                  <span className="config-conflict-note">
                    La automatización clásica gestionará fuera de horario. La IA fuera de horario se desactivará para evitar duplicados.
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

        <article
          className={`automation-card smart-booking-card ${
            isSmartBookingLocked ? 'automation-card--locked' : ''
          }`}
        >
          <div className="automation-card__header">
            <div>
              <div className="automation-card__badges">
                <span
                  className={`automation-status ${
                    smartBookingSettings.enabled && !isSmartBookingLocked
                      ? 'automation-status--enabled'
                      : ''
                  }`}
                >
                  {smartBookingStatus}
                </span>
                {isSmartBookingLocked ? (
                  <span className="plan-badge plan-badge--premium">PREMIUM</span>
                ) : null}
              </div>
              <h3>Agenda inteligente</h3>
            </div>
            <button
              className={`toggle-switch ${
                smartBookingSettings.enabled && !isSmartBookingLocked
                  ? 'toggle-switch--enabled'
                  : ''
              }`}
              type="button"
              aria-pressed={smartBookingSettings.enabled && !isSmartBookingLocked}
              disabled={isSmartBookingLocked || isSmartBookingLoading}
              onClick={() =>
                void saveSmartBookingSettings({ enabled: !smartBookingSettings.enabled })
              }
            >
              <span />
            </button>
          </div>

          <p>
            Permite que el sistema ayude a responder solicitudes de cita usando
            tus servicios, horarios y disponibilidad real.
          </p>

          <div className="smart-booking-card__source" aria-label="Fuentes de agenda">
            <span>Servicios</span>
            <span>Horarios</span>
            <span>Citas</span>
            <span>Bloqueos</span>
            <span>Disponibilidad real</span>
          </div>

          {isSmartBookingLocked ? (
            <p className="config-conflict-note">{smartBookingLockMessage}</p>
          ) : (
            <div className="smart-booking-card__config business-form">
              <label className="business-form__field">
                <span>Modo de actuación</span>
                <select
                  value={smartBookingSettings.mode}
                  disabled={isSmartBookingLoading}
                  onChange={(event) =>
                    void saveSmartBookingSettings({
                      mode: event.target.value as SmartBookingMode,
                    })
                  }
                >
                  <option value="SUGGEST_SLOTS">Solo sugerir huecos</option>
                  <option value="REQUEST_CONFIRMATION">
                    Pedir confirmación antes de reservar
                  </option>
                  {canUseAutoBookingConfirm ? (
                    <option value="AUTO_CONFIRM">Confirmar automáticamente</option>
                  ) : null}
                </select>
              </label>
              <label className="business-form__field">
                <span>Huecos sugeridos</span>
                <select
                  value={smartBookingSettings.maxSuggestions}
                  disabled={isSmartBookingLoading}
                  onChange={(event) =>
                    void saveSmartBookingSettings({
                      maxSuggestions: Number(event.target.value),
                    })
                  }
                >
                  <option value={2}>2 huecos</option>
                  <option value={3}>3 huecos</option>
                  <option value={4}>4 huecos</option>
                </select>
              </label>
              <label className="business-form__field">
                <span>Si faltan datos</span>
                <select
                  value={smartBookingSettings.missingInfoBehavior}
                  disabled={isSmartBookingLoading}
                  onChange={(event) =>
                    void saveSmartBookingSettings({
                      missingInfoBehavior: event.target
                        .value as SmartBookingMissingInfoBehavior,
                    })
                  }
                >
                  <option value="ASK_CLIENT">Preguntar al cliente</option>
                  <option value="HANDOFF_TO_HUMAN">Derivar al equipo</option>
                </select>
              </label>
              {isSmartBookingLoading ? (
                <p className="automation-card__meta">Guardando configuración...</p>
              ) : null}
              {smartBookingError ? (
                <p className="config-conflict-note">{smartBookingError}</p>
              ) : null}
              <p className="config-conflict-note">
                Esta automatización usará la Agenda configurada. Para cambiar
                horarios o servicios, ve a Agenda.
              </p>
            </div>
          )}

          <div className="automation-card__footer">
            <Link className="button button--ghost" href="/agenda">
              Configurar Agenda
            </Link>
          </div>
        </article>
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

function formatBusinessHoursSummary(businessHours: BusinessHours): string {
  const formattedDays = weekdayOptions
    .filter((day) => businessHours.days.includes(day.value))
    .map((day) => day.label.slice(0, 3))
    .join(', ');

  return `${formattedDays} | ${businessHours.start} - ${businessHours.end} | ${businessHours.timezone}`;
}

function getAutomationTooltip(automationKey: AutomationKey): string {
  return automationKey === 'welcome'
    ? 'Se envía una sola vez al primer mensaje del cliente'
    : 'Responde cuando no estás disponible';
}
