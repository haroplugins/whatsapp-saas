'use client';

import { useEffect, useMemo, useState } from 'react';

type AutomationKey = 'welcome' | 'off_hours';

type AutomationSchedule = {
  days: number[];
  start: string;
  end: string;
};

type AutomationConfig = {
  enabled: boolean;
  message: string;
  schedule?: AutomationSchedule;
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

const emptySchedule: AutomationSchedule = {
  days: [],
  start: '',
  end: '',
};

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

  const offHoursSchedule = automations.off_hours.schedule ?? emptySchedule;

  function updateAutomation(automationKey: AutomationKey, updates: Partial<AutomationConfig>) {
    setAutomations((currentAutomations) => ({
      ...currentAutomations,
      [automationKey]: {
        ...currentAutomations[automationKey],
        ...updates,
      },
    }));
  }

  function updateOffHoursSchedule(updates: Partial<AutomationSchedule>) {
    const nextSchedule = {
      ...(automations.off_hours.schedule ?? emptySchedule),
      ...updates,
    };

    updateAutomation('off_hours', {
      schedule: hasConfiguredSchedule(nextSchedule) ? nextSchedule : undefined,
    });
  }

  function toggleOffHoursDay(day: number) {
    const nextDays = offHoursSchedule.days.includes(day)
      ? offHoursSchedule.days.filter((currentDay) => currentDay !== day)
      : [...offHoursSchedule.days, day].sort((firstDay, secondDay) => firstDay - secondDay);

    updateOffHoursSchedule({ days: nextDays });
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

              <div className="automation-card__footer">
                <span className="automation-card__message">{config.message}</span>
                {automation.key === 'off_hours' && config.schedule ? (
                  <span className="automation-card__meta">
                    {formatScheduleSummary(config.schedule)}
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

              {activeAutomationDefinition.key === 'off_hours' ? (
                <div className="automation-modal__schedule">
                  <div className="automation-modal__schedule-copy">
                    <strong>Disponibilidad</strong>
                    <p>
                      Si no configuras dias y horas, esta automation seguira
                      respondiendo siempre que este activa.
                    </p>
                  </div>

                  <fieldset className="automation-modal__days">
                    <legend>Dias activos</legend>
                    <div className="automation-modal__days-grid">
                      {weekdayOptions.map((day) => (
                        <label key={day.value} className="automation-day-pill">
                          <input
                            type="checkbox"
                            checked={offHoursSchedule.days.includes(day.value)}
                            onChange={() => toggleOffHoursDay(day.value)}
                          />
                          <span>{day.label}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <div className="automation-modal__time-grid">
                    <label className="automation-modal__field">
                      <span>Inicio</span>
                      <input
                        type="time"
                        value={offHoursSchedule.start}
                        onChange={(event) =>
                          updateOffHoursSchedule({ start: event.target.value })
                        }
                      />
                    </label>

                    <label className="automation-modal__field">
                      <span>Fin</span>
                      <input
                        type="time"
                        value={offHoursSchedule.end}
                        onChange={(event) =>
                          updateOffHoursSchedule({ end: event.target.value })
                        }
                      />
                    </label>
                  </div>
                </div>
              ) : null}
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
        schedule: normalizeSchedule(parsedValue.off_hours?.schedule),
      },
    };
  } catch {
    return defaultAutomationsState;
  }
}

function normalizeSchedule(schedule: unknown): AutomationSchedule | undefined {
  if (!schedule || typeof schedule !== 'object') {
    return undefined;
  }

  const candidate = schedule as Partial<AutomationSchedule>;
  const days = Array.isArray(candidate.days)
    ? candidate.days.filter(isValidDay).sort((firstDay, secondDay) => firstDay - secondDay)
    : [];
  const start = typeof candidate.start === 'string' ? candidate.start : '';
  const end = typeof candidate.end === 'string' ? candidate.end : '';

  if (!hasConfiguredSchedule({ days, start, end })) {
    return undefined;
  }

  return {
    days,
    start,
    end,
  };
}

function hasConfiguredSchedule(schedule: AutomationSchedule): boolean {
  return schedule.days.length > 0 || schedule.start.length > 0 || schedule.end.length > 0;
}

function formatScheduleSummary(schedule: AutomationSchedule): string {
  if (!schedule.days.length || !schedule.start || !schedule.end) {
    return 'Horario sin completar';
  }

  const formattedDays = weekdayOptions
    .filter((day) => schedule.days.includes(day.value))
    .map((day) => day.label.slice(0, 3))
    .join(', ');

  return `${formattedDays} · ${schedule.start} - ${schedule.end}`;
}

function isValidDay(day: unknown): day is number {
  return typeof day === 'number' && Number.isInteger(day) && day >= 0 && day <= 6;
}

function getAutomationTooltip(automationKey: AutomationKey): string {
  return automationKey === 'welcome'
    ? 'Se envia una sola vez al primer mensaje del cliente'
    : 'Responde cuando no estas disponible';
}
