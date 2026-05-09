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
  fetchBusinessProfile,
  isDefaultBusinessProfile,
  readStoredBusinessProfile,
  saveBusinessProfile,
  saveStoredBusinessProfile,
} from '../../../lib/business-profile';

export default function BusinessPage() {
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>(defaultBusinessProfile);
  const [defaultCurrency, setDefaultCurrency] = useState<BusinessCurrency>('EUR');
  const [isCurrencyLoading, setIsCurrencyLoading] = useState(true);
  const [isCurrencySaving, setIsCurrencySaving] = useState(false);
  const [currencyError, setCurrencyError] = useState<string | null>(null);
  const [currencyFeedback, setCurrencyFeedback] = useState<string | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileFeedback, setProfileFeedback] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadBusinessProfile() {
      setIsProfileLoading(true);
      setProfileError(null);

      try {
        const backendProfile = await fetchBusinessProfile();
        if (!isMounted) return;

        const storedProfile = readStoredBusinessProfile();
        const nextProfile =
          isDefaultBusinessProfile(backendProfile) &&
          !isDefaultBusinessProfile(storedProfile)
            ? storedProfile
            : backendProfile;

        setBusinessProfile(nextProfile);
      } catch (error) {
        if (!isMounted) return;
        setBusinessProfile(readStoredBusinessProfile());
        setProfileError(
          error instanceof Error
            ? error.message
            : 'No se ha podido cargar el perfil del negocio.',
        );
      } finally {
        if (isMounted) {
          setIsProfileLoading(false);
          setIsHydrated(true);
        }
      }
    }

    void loadBusinessProfile();

    return () => {
      isMounted = false;
    };
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
    setProfileFeedback(null);
  }

  async function handleProfileSave() {
    setIsProfileSaving(true);
    setProfileError(null);
    setProfileFeedback(null);

    try {
      const savedProfile = await saveBusinessProfile(businessProfile);
      setBusinessProfile(savedProfile);
      saveStoredBusinessProfile(savedProfile);
      setProfileFeedback('Perfil guardado.');
    } catch (error) {
      setProfileError(
        error instanceof Error
          ? error.message
          : 'No se ha podido guardar el perfil.',
      );
    } finally {
      setIsProfileSaving(false);
    }
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
          <p>
            Organiza la información que ayudará al equipo a responder mejor a
            los clientes.
          </p>
        </div>
      </div>

      <div className="business-page__grid">
      <section className="business-profile-card business-profile-card--page">
        <div className="business-profile-card__header">
          <div>
            <span className="workspace-header__eyebrow">
              Datos del negocio
            </span>
            <h3>Información principal</h3>
            <p>Define cómo se presenta tu negocio ante los clientes.</p>
          </div>
        </div>
        <p className="config-conflict-note">
          Estos datos se guardan en tu espacio de trabajo.
        </p>
        <div className="business-form">
          <label className="business-form__field">
            <span>Nombre comercial</span>
            <input
              type="text"
              placeholder="Ej: Clínica Norte"
              value={businessProfile.businessName}
              onChange={(event) => updateBusinessProfile({ businessName: event.target.value })}
            />
          </label>

          <label className="business-form__field">
            <span>Tipo de negocio</span>
            <input
              type="text"
              placeholder="Ej: estética, clínica, asesoría"
              value={businessProfile.serviceType}
              onChange={(event) => updateBusinessProfile({ serviceType: event.target.value })}
            />
          </label>

          <label className="business-form__field business-form__field--full">
            <span>Descripción breve</span>
            <textarea
              aria-label="Descripción breve"
              placeholder="Resume qué hace tu negocio y para qué tipo de clientes."
              value={businessProfile.shortDescription}
              onChange={(event) => updateBusinessProfile({ shortDescription: event.target.value })}
            />
          </label>
        </div>
      </section>

      <section className="business-profile-card business-profile-card--page">
        <div className="business-profile-card__header">
          <div>
            <span className="workspace-header__eyebrow">
              Contacto público
            </span>
            <h3>Canales visibles para clientes</h3>
            <p>Guarda los datos que un cliente puede necesitar para encontrarte.</p>
          </div>
        </div>
        <div className="business-form">
          <label className="business-form__field">
            <span>Teléfono</span>
            <input
              type="tel"
              placeholder="+34 600 000 000"
              value={businessProfile.publicPhone}
              onChange={(event) => updateBusinessProfile({ publicPhone: event.target.value })}
            />
          </label>

          <label className="business-form__field">
            <span>Email</span>
            <input
              type="email"
              placeholder="hola@tunegocio.com"
              value={businessProfile.publicEmail}
              onChange={(event) => updateBusinessProfile({ publicEmail: event.target.value })}
            />
          </label>

          <label className="business-form__field">
            <span>Web</span>
            <input
              type="url"
              placeholder="https://tunegocio.com"
              value={businessProfile.website}
              onChange={(event) => updateBusinessProfile({ website: event.target.value })}
            />
          </label>

          <label className="business-form__field business-form__field--full">
            <span>Dirección o zona de servicio</span>
            <textarea
              aria-label="Dirección o zona de servicio"
              placeholder="Dirección del local, ciudad o zonas donde trabajas."
              value={businessProfile.addressOrServiceArea}
              onChange={(event) => updateBusinessProfile({ addressOrServiceArea: event.target.value })}
            />
          </label>
        </div>
      </section>

      <section className="business-profile-card business-profile-card--page">
        <div className="business-profile-card__header">
          <div>
            <span className="workspace-header__eyebrow">
              Redes sociales
            </span>
            <h3>Perfiles públicos</h3>
            <p>
              Añade los canales donde tus clientes pueden seguir o contactar
              con tu negocio.
            </p>
          </div>
        </div>
        <div className="business-form">
          <label className="business-form__field">
            <span>Instagram</span>
            <input
              type="text"
              placeholder="@tunegocio"
              value={businessProfile.instagram}
              onChange={(event) => updateBusinessProfile({ instagram: event.target.value })}
            />
          </label>

          <label className="business-form__field">
            <span>Facebook</span>
            <input
              type="url"
              placeholder="https://facebook.com/tunegocio"
              value={businessProfile.facebook}
              onChange={(event) => updateBusinessProfile({ facebook: event.target.value })}
            />
          </label>

          <label className="business-form__field">
            <span>TikTok</span>
            <input
              type="url"
              placeholder="https://tiktok.com/@tunegocio"
              value={businessProfile.tiktok}
              onChange={(event) => updateBusinessProfile({ tiktok: event.target.value })}
            />
          </label>

          <label className="business-form__field">
            <span>YouTube</span>
            <input
              type="url"
              placeholder="https://youtube.com/@tunegocio"
              value={businessProfile.youtube}
              onChange={(event) => updateBusinessProfile({ youtube: event.target.value })}
            />
          </label>

          <label className="business-form__field">
            <span>LinkedIn</span>
            <input
              type="url"
              placeholder="https://linkedin.com/company/tunegocio"
              value={businessProfile.linkedin}
              onChange={(event) => updateBusinessProfile({ linkedin: event.target.value })}
            />
          </label>

          <label className="business-form__field">
            <span>X / Twitter</span>
            <input
              type="url"
              placeholder="https://x.com/tunegocio"
              value={businessProfile.twitterX}
              onChange={(event) => updateBusinessProfile({ twitterX: event.target.value })}
            />
          </label>
        </div>
      </section>

      <section className="business-profile-card business-profile-card--page">
        <div className="business-profile-card__header">
          <div>
            <span className="workspace-header__eyebrow">
              Información útil
            </span>
            <h3>Detalles para clientes</h3>
            <p>Añade respuestas frecuentes que el equipo suele repetir.</p>
          </div>
        </div>
        <div className="business-form">
          <label className="business-form__field">
            <span>Métodos de pago aceptados</span>
            <textarea
              aria-label="Métodos de pago aceptados"
              placeholder="Ej: tarjeta, efectivo, transferencia, Bizum."
              value={businessProfile.paymentMethods}
              onChange={(event) => updateBusinessProfile({ paymentMethods: event.target.value })}
            />
          </label>

          <label className="business-form__field">
            <span>Política de cancelación</span>
            <textarea
              aria-label="Política de cancelación"
              placeholder="Ej: avísanos con 24 horas de antelación."
              value={businessProfile.cancellationPolicy}
              onChange={(event) => updateBusinessProfile({ cancellationPolicy: event.target.value })}
            />
          </label>

          <label className="business-form__field">
            <span>Tiempo habitual de respuesta</span>
            <input
              type="text"
              placeholder="Ej: respondemos en menos de 24 horas"
              value={businessProfile.responseTime}
              onChange={(event) => updateBusinessProfile({ responseTime: event.target.value })}
            />
          </label>

          <label className="business-form__field business-form__field--full">
            <span>Instrucciones importantes</span>
            <textarea
              aria-label="Instrucciones importantes"
              placeholder="Normas, requisitos previos o detalles que conviene recordar al cliente."
              value={businessProfile.importantNotes}
              onChange={(event) => updateBusinessProfile({ importantNotes: event.target.value })}
            />
          </label>
        </div>
      </section>

      <section className="business-profile-card business-profile-card--page">
        <div className="business-profile-card__header">
          <div>
            <span className="workspace-header__eyebrow">
              Tono y respuestas
            </span>
            <h3>Estilo de comunicación</h3>
            <p>Prepara el tono y el contexto base de las respuestas.</p>
          </div>
        </div>
        <div className="business-form">
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
              placeholder="Ej: Responde de forma clara, breve y amable. Pregunta si el cliente quiere reservar cita."
              value={businessProfile.baseMessage}
              onChange={(event) => updateBusinessProfile({ baseMessage: event.target.value })}
            />
            <small>
              Texto opcional que se añadirá como contexto de apoyo para las
              respuestas.
            </small>
          </label>
        </div>
      </section>

      <section className="business-profile-card business-profile-card--page business-page__grid-full">
        <div className="business-profile-card__header">
          <div>
            <span className="workspace-header__eyebrow">
              Guardar perfil
            </span>
            <h3>Guardar perfil</h3>
            <p>
              Guarda los cambios del perfil del negocio en tu espacio de
              trabajo.
            </p>
          </div>
        </div>
        {profileError ? <p className="form-error">{profileError}</p> : null}
        {profileFeedback ? (
          <p className="config-conflict-note">{profileFeedback}</p>
        ) : null}
        {isProfileLoading ? (
          <p className="config-conflict-note">Cargando perfil...</p>
        ) : null}
        <button
          className="button button--primary"
          type="button"
          disabled={isProfileLoading || isProfileSaving}
          onClick={() => void handleProfileSave()}
        >
          {isProfileSaving ? 'Guardando...' : 'Guardar perfil'}
        </button>
      </section>

      <form
        className="business-profile-card business-profile-card--page business-page__grid-full"
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
      </div>
    </section>
  );
}
