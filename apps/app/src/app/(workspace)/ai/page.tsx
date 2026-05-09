'use client';

import { useEffect, useState } from 'react';
import {
  type AIConfig,
  type AIConfigFallback,
  type AIConfigMode,
  type AIConfigTone,
  defaultAIConfig,
  readStoredAIConfig,
  saveStoredAIConfig,
} from '../../../lib/ai-config';
import {
  defaultTenantEntitlements,
  fetchTenantEntitlements,
  type TenantEntitlements,
} from '../../../lib/entitlements';

const automationsStorageKey = 'automations';

type StoredAutomationConfig = {
  enabled?: boolean;
  message?: string;
};

type StoredAutomationsState = {
  welcome?: StoredAutomationConfig;
  off_hours?: StoredAutomationConfig;
};

const modeOptions: Array<{ label: string; value: AIConfigMode; description: string }> = [
  { label: 'Solo sugerencias (recomendado)', value: 'suggestions', description: 'Prepara borradores para que el equipo los revise antes de enviar.' },
  { label: 'Respuesta asistida', value: 'auto_reply', description: 'Ayuda con respuestas en casos permitidos cuando el flujo real esté conectado.' },
  { label: 'Automatización avanzada', value: 'autopilot', description: 'Actúa en casos de alta confianza según los permisos definidos por el equipo.' },
];

const permissionOptions: Array<{ label: string; value: keyof AIConfig['permissions'] }> = [
  { label: 'FAQ', value: 'faq' },
  { label: 'Precios', value: 'pricing' },
  { label: 'Reservas', value: 'booking' },
  { label: 'Quejas', value: 'complaints' },
  { label: 'Cancelaciones', value: 'cancellations' },
];

const toneOptions: Array<{ label: string; value: AIConfigTone }> = [
  { label: 'Cercano', value: 'friendly' },
  { label: 'Profesional', value: 'professional' },
  { label: 'Directo', value: 'direct' },
  { label: 'Formal', value: 'formal' },
];

const fallbackOptions: Array<{ label: string; value: AIConfigFallback }> = [
  { label: 'Pedir más información', value: 'ask_more' },
  { label: 'Marcar como pendiente', value: 'mark_pending' },
  { label: 'Notificar al equipo', value: 'notify' },
];

export default function AIPage() {
  const [aiConfig, setAIConfig] = useState<AIConfig>(defaultAIConfig);
  const [entitlements, setEntitlements] = useState<TenantEntitlements>(defaultTenantEntitlements);
  const [isHydrated, setIsHydrated] = useState(false);
  const canUseAi = entitlements.features.canUseAi;

  useEffect(() => {
    setAIConfig(readStoredAIConfig());
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
    if (!isHydrated || !canUseAi) return;
    saveStoredAIConfig(aiConfig);
  }, [aiConfig, canUseAi, isHydrated]);

  useEffect(() => {
    if (!isHydrated || !canUseAi || !aiConfig.useOutsideHours) return;
    disableClassicOffHoursAutomation();
  }, [aiConfig.useOutsideHours, canUseAi, isHydrated]);

  function updateAIConfig(updates: Partial<AIConfig>) {
    if (!canUseAi) return;
    setAIConfig((currentConfig) => ({
      ...currentConfig,
      ...updates,
    }));
  }

  function updatePermission(permission: keyof AIConfig['permissions'], value: boolean) {
    if (!canUseAi || !canUsePermission(permission, entitlements)) return;
    setAIConfig((currentConfig) => ({
      ...currentConfig,
      permissions: {
        ...currentConfig.permissions,
        [permission]: value,
      },
    }));
  }

  function updateOutsideHoursUsage(value: boolean) {
    if (!canUseAi) return;
    if (value) {
      disableClassicOffHoursAutomation();
    }

    updateAIConfig({ useOutsideHours: value });
  }

  return (
    <section className="ai-page">
      <div className="dashboard-hero">
        <div>
          <span className="workspace-header__eyebrow">IA</span>
          <h2>Asistente de IA</h2>
          <p>
            Prepara cómo ayudará la IA al equipo cuando WhatsApp Business esté
            conectado.
          </p>
        </div>
      </div>

      <section className="business-profile-card business-profile-card--page">
        <p className="config-conflict-note">
          Preparación de configuración. La activación completa dependerá de la
          conexión real con WhatsApp Business.
        </p>
        {!canUseAi ? (
          <div className="feature-lock-banner" role="note">
            <span className="feature-lock-banner__badge">PRO</span>
            <div>
              <strong>Disponible en plan Pro</strong>
              <p>
                Puedes preparar esta pantalla desde Basic, pero la ayuda de IA
                se activa en planes Pro o Premium.
              </p>
            </div>
          </div>
        ) : null}
        <div className="ai-settings">
          <div className="ai-settings__section">
            <div className="ai-settings__section-header">
              <strong>Nivel de ayuda</strong>
              <span>Elige cuánto revisa el equipo antes de enviar.</span>
            </div>
            <div className="ai-option-grid">
              {modeOptions.map((option) => (
                <label key={option.value} className={`ai-choice-card${aiConfig.mode === option.value ? ' ai-choice-card--active' : ''}`}>
                  <input
                    type="radio"
                    name="ai-mode"
                    value={option.value}
                    checked={aiConfig.mode === option.value}
                    disabled={!canUseAi}
                    onChange={() => updateAIConfig({ mode: option.value })}
                  />
                  <span>{option.label}</span>
                  <small>{option.description}</small>
                </label>
              ))}
            </div>
          </div>

          <div className="ai-settings__section">
            <div className="ai-settings__section-header">
              <strong>Permisos</strong>
              <span>Temas en los que la IA puede ayudar.</span>
            </div>
            <div className="ai-permission-grid">
              {permissionOptions.map((permission) => (
                <label key={permission.value} className="automation-day-pill">
                  <input
                    type="checkbox"
                    checked={aiConfig.permissions[permission.value]}
                    disabled={!canUseAi || !canUsePermission(permission.value, entitlements)}
                    onChange={(event) => updatePermission(permission.value, event.target.checked)}
                  />
                  <span>{permission.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="business-form">
            <label className="business-form__field">
              <span>Tono</span>
              <select
                value={aiConfig.tone}
                disabled={!canUseAi || !entitlements.features.canUseAiTone}
                onChange={(event) => updateAIConfig({ tone: event.target.value as AIConfigTone })}
              >
                {toneOptions.map((tone) => (
                  <option key={tone.value} value={tone.value}>{tone.label}</option>
                ))}
              </select>
            </label>

            <label className="business-form__field">
              <span>Cuando falte información</span>
              <select
                value={aiConfig.fallback}
                disabled={!canUseAi}
                onChange={(event) => updateAIConfig({ fallback: event.target.value as AIConfigFallback })}
              >
                {fallbackOptions.map((fallback) => (
                  <option key={fallback.value} value={fallback.value}>{fallback.label}</option>
                ))}
              </select>
            </label>

            <label className="business-form__field business-form__field--full">
              <span>Estilo personalizado</span>
              <textarea
                aria-label="Estilo personalizado"
                value={aiConfig.customStyle}
                disabled={!canUseAi}
                onChange={(event) => updateAIConfig({ customStyle: event.target.value })}
                placeholder="Ej: Respuestas breves, claras y con una pregunta final cuando haga falta."
              />
            </label>
          </div>

          <div className="ai-settings__section">
            <div className="ai-settings__section-header">
              <strong>Fuera de horario</strong>
              <span>Define si la IA puede ayudar con mensajes recibidos fuera del horario del negocio.</span>
            </div>
            <label className="ai-toggle-row">
              <input
                type="checkbox"
                checked={aiConfig.useOutsideHours}
                disabled={!canUseAi}
                onChange={(event) => updateOutsideHoursUsage(event.target.checked)}
              />
              <span>Aplicar ayuda de IA fuera de horario</span>
            </label>
            {aiConfig.useOutsideHours ? (
              <p className="config-conflict-note">
                La IA preparará respuestas fuera de horario. La automatización
                clásica se desactivará para evitar duplicados.
              </p>
            ) : null}
          </div>

          <div className="feature-lock-actions">
            <button className="button button--primary" type="button" disabled={!canUseAi} onClick={() => saveStoredAIConfig(aiConfig)}>
              Guardar preparación
            </button>
            {!canUseAi ? <span>Disponible en plan Pro</span> : <span>Preparación guardada en este navegador</span>}
          </div>
        </div>
      </section>
    </section>
  );
}

function canUsePermission(permission: keyof AIConfig['permissions'], entitlements: TenantEntitlements): boolean {
  if (permission === 'pricing') return entitlements.features.canUseAiPricing;
  if (permission === 'booking') return entitlements.features.canUseAiBooking;
  return entitlements.features.canUseAi;
}

function disableClassicOffHoursAutomation() {
  const storedValue = window.localStorage.getItem(automationsStorageKey);

  if (!storedValue) {
    return;
  }

  try {
    const automations = JSON.parse(storedValue) as StoredAutomationsState;
    const offHours = automations.off_hours;

    if (!offHours?.enabled) {
      return;
    }

    window.localStorage.setItem(automationsStorageKey, JSON.stringify({
      ...automations,
      off_hours: {
        ...offHours,
        enabled: false,
      },
    }));
  } catch {
    // Si localStorage contiene datos antiguos o inválidos, no bloqueamos la configuración de IA.
  }
}
