'use client';

import { useEffect, useState } from 'react';
import {
  type BusinessProfile,
  defaultBusinessProfile,
  readStoredBusinessProfile,
  saveStoredBusinessProfile,
} from '../../../lib/business-profile';

export default function BusinessPage() {
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>(defaultBusinessProfile);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setBusinessProfile(readStoredBusinessProfile());
    setIsHydrated(true);
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

  return (
    <section className="business-page">
      <div className="dashboard-hero">
        <div>
          <span className="workspace-header__eyebrow">Negocio</span>
          <h2>Perfil del negocio</h2>
          <p>Configura el contexto que usara el sistema para personalizar respuestas automaticas.</p>
        </div>
      </div>

      <section className="business-profile-card business-profile-card--page">
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
            <small>Texto opcional que se anadira como contexto en las respuestas automaticas.</small>
          </label>
        </div>
      </section>
    </section>
  );
}
