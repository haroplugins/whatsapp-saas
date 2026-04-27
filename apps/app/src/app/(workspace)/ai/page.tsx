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

const modeOptions: Array<{ label: string; value: AIConfigMode; description: string }> = [
  { label: 'Solo sugerencias', value: 'suggestions', description: 'La IA prepara respuestas para revisar antes de enviar.' },
  { label: 'Respuesta automatica', value: 'auto_reply', description: 'La IA puede responder casos permitidos sin salir del flujo actual.' },
  { label: 'Autopilot', value: 'autopilot', description: 'La IA opera de forma mas autonoma cuando tenga suficiente confianza.' },
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
  { label: 'Pedir mas informacion', value: 'ask_more' },
  { label: 'Marcar como pendiente', value: 'mark_pending' },
  { label: 'Notificar al equipo', value: 'notify' },
];

export default function AIPage() {
  const [aiConfig, setAIConfig] = useState<AIConfig>(defaultAIConfig);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setAIConfig(readStoredAIConfig());
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    saveStoredAIConfig(aiConfig);
  }, [aiConfig, isHydrated]);

  function updateAIConfig(updates: Partial<AIConfig>) {
    setAIConfig((currentConfig) => ({
      ...currentConfig,
      ...updates,
    }));
  }

  function updatePermission(permission: keyof AIConfig['permissions'], value: boolean) {
    setAIConfig((currentConfig) => ({
      ...currentConfig,
      permissions: {
        ...currentConfig.permissions,
        [permission]: value,
      },
    }));
  }

  return (
    <section className="ai-page">
      <div className="dashboard-hero">
        <div>
          <span className="workspace-header__eyebrow">IA</span>
          <h2>AI Autopilot</h2>
          <p>Configura como debera comportarse la IA cuando activemos la siguiente fase.</p>
        </div>
      </div>

      <section className="business-profile-card business-profile-card--page">
        <div className="ai-settings">
          <div className="ai-settings__section">
            <div className="ai-settings__section-header">
              <strong>Modo IA</strong>
              <span>Define cuanto control tendra la IA.</span>
            </div>
            <div className="ai-option-grid">
              {modeOptions.map((option) => (
                <label key={option.value} className={`ai-choice-card${aiConfig.mode === option.value ? ' ai-choice-card--active' : ''}`}>
                  <input
                    type="radio"
                    name="ai-mode"
                    value={option.value}
                    checked={aiConfig.mode === option.value}
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
              <span>Temas que la IA podra tratar.</span>
            </div>
            <div className="ai-permission-grid">
              {permissionOptions.map((permission) => (
                <label key={permission.value} className="automation-day-pill">
                  <input
                    type="checkbox"
                    checked={aiConfig.permissions[permission.value]}
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
                onChange={(event) => updateAIConfig({ tone: event.target.value as AIConfigTone })}
              >
                {toneOptions.map((tone) => (
                  <option key={tone.value} value={tone.value}>{tone.label}</option>
                ))}
              </select>
            </label>

            <label className="business-form__field">
              <span>Comportamiento en duda</span>
              <select
                value={aiConfig.fallback}
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
                onChange={(event) => updateAIConfig({ customStyle: event.target.value })}
                placeholder="Ej: Respuestas breves, claras y con una pregunta final cuando haga falta."
              />
            </label>
          </div>

          <div className="ai-settings__section">
            <div className="ai-settings__section-header">
              <strong>Fuera de horario</strong>
              <span>Controla si la IA debe aplicar este comportamiento fuera del horario del negocio.</span>
            </div>
            <label className="ai-toggle-row">
              <input
                type="checkbox"
                checked={aiConfig.useOutsideHours}
                onChange={(event) => updateAIConfig({ useOutsideHours: event.target.checked })}
              />
              <span>Usar IA fuera de horario</span>
            </label>
          </div>
        </div>
      </section>
    </section>
  );
}
