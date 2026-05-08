'use client';

import { type FormEvent, useEffect, useState } from 'react';
import {
  type BusinessCurrency,
  businessCurrencyOptions,
  getBusinessSettings,
  updateBusinessSettings,
} from '../../../lib/business-settings';
import {
  type BusinessProfile,
  defaultBusinessProfile,
  readStoredBusinessProfile,
  saveStoredBusinessProfile,
} from '../../../lib/business-profile';

export default function BusinessPage() {
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>(defaultBusinessProfile);
  const [defaultCurrency, setDefaultCurrency] = useState<BusinessCurrency>('EUR');
  const [isCurrencyLoading, setIsCurrencyLoading] = useState(true);
  const [isCurrencySaving, setIsCurrencySaving] = useState(false);
  const [currencyError, setCurrencyError] = useState<string | null>(null);
  const [currencyFeedback, setCurrencyFeedback] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setBusinessProfile(readStoredBusinessProfile());
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadBusinessSettings() {
      setIsCurrencyLoading(true);
      setCurrencyError(null);

      try {
        const settings = await getBusinessSettings();
        if (!isMounted) return;
        setDefaultCurrency(settings.defaultCurrency);
      } catch (error) {
        if (!isMounted) return;
        setCurrencyError(
          error instanceof Error
            ? error.message
            : 'No se pudo cargar la moneda del negocio.',
        );
      } finally {
        if (isMounted) {
          setIsCurrencyLoading(false);
        }
      }
    }

    void loadBusinessSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    saveStoredBusinessProfile(businessProfile);
  }, [businessProfile, isHydrated]);

  function updateBusinessProfile(updates: Partial<BusinessProfile>) {
    setBusinessProfile((currentBusinessProfile) => ({
      ...currentBusinessProfile,
      ...updates,
    }));
  }

  async function handleCurrencySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCurrencySaving(true);
    setCurrencyError(null);
    setCurrencyFeedback(null);

    try {
      const settings = await updateBusinessSettings({
        defaultCurrency,
      });
      setDefaultCurrency(settings.defaultCurrency);
      setCurrencyFeedback('Moneda del negocio guardada.');
    } catch (error) {
      setCurrencyError(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar la moneda del negocio.',
      );
    } finally {
      setIsCurrencySaving(false);
    }
  }

  return (
    <section className="business-page">
      <div className="dashboard-hero">
        <div>
          <span className="workspace-header__eyebrow">Negocio</span>
          <h2>Perfil del negocio</h2>
          <p>Configura el contexto que usará el sistema para personalizar respuestas automáticas.</p>
        </div>
      </div>

      <section className="business-profile-card business-profile-card--page">
        <p className="config-conflict-note">
          Esta configuración se guarda en este navegador durante la fase actual.
        </p>
        <div className="business-form">
          <label className="business-form__field">
            <span>Nombre del negocio</span>
            <input
              type="text"
              value={businessProfile.name}
              onChange={(event) => updateBusinessProfile({ name: event.target.value })}
            />
          </label>

          <label className="business-form__field">
            <span>Tipo de servicio</span>
            <input
              type="text"
              value={businessProfile.service}
              onChange={(event) => updateBusinessProfile({ service: event.target.value })}
            />
          </label>

          <label className="business-form__field">
            <span>Tono</span>
            <select
              value={businessProfile.tone}
              onChange={(event) => updateBusinessProfile({ tone: event.target.value === 'formal' ? 'formal' : 'friendly' })}
            >
              <option value="friendly">Cercano</option>
              <option value="formal">Formal</option>
            </select>
          </label>

          <label className="business-form__field business-form__field--full">
            <span>Mensaje base</span>
            <textarea
              aria-label="Mensaje base"
              value={businessProfile.baseMessage}
              onChange={(event) => updateBusinessProfile({ baseMessage: event.target.value })}
            />
            <small>Texto opcional que se añadirá como contexto en las respuestas automáticas.</small>
          </label>
        </div>
      </section>

      <form
        className="business-profile-card business-profile-card--page"
        onSubmit={handleCurrencySubmit}
      >
        <div className="business-profile-card__header">
          <div>
            <span className="workspace-header__eyebrow">Configuración</span>
            <h3>Moneda del negocio</h3>
            <p>
              Esta moneda se usará como referencia para los precios de tus
              servicios.
            </p>
          </div>
        </div>

        <div className="business-form">
          <label className="business-form__field">
            <span>Moneda por defecto</span>
            <select
              value={defaultCurrency}
              onChange={(event) => {
                setDefaultCurrency(event.target.value as BusinessCurrency);
                setCurrencyFeedback(null);
              }}
              disabled={isCurrencyLoading || isCurrencySaving}
            >
              {businessCurrencyOptions.map((currencyOption) => (
                <option key={currencyOption.code} value={currencyOption.code}>
                  {currencyOption.label}
                </option>
              ))}
            </select>
            <small>
              Si cambias la moneda, los servicios existentes no se convertirán
              automáticamente.
            </small>
            <small>La moneda se guarda en tu espacio de trabajo.</small>
          </label>
        </div>

        {currencyError ? <p className="form-error">{currencyError}</p> : null}
        {currencyFeedback ? (
          <p className="config-conflict-note">{currencyFeedback}</p>
        ) : null}

        <button
          className="button button--primary"
          type="submit"
          disabled={isCurrencyLoading || isCurrencySaving}
        >
          {isCurrencySaving ? 'Guardando...' : 'Guardar moneda'}
        </button>
      </form>
    </section>
  );
}
