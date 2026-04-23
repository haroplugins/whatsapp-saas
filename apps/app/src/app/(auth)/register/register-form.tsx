'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiFetch, setAccessToken } from '../../../lib/api';

type RegisterResponse = {
  accessToken: string;
};

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    const fullName = String(formData.get('fullName') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await apiFetch<RegisterResponse>('/auth/register', {
        method: 'POST',
        body: {
          fullName,
          email,
          password,
        },
      });

      setAccessToken(response.accessToken);
      router.push('/onboarding');
      router.refresh();
    } catch (submissionError) {
      const message =
        submissionError instanceof Error
          ? submissionError.message
          : 'No se pudo crear la cuenta.';

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" action={handleSubmit}>
      <label className="field">
        <span>Nombre completo</span>
        <input name="fullName" type="text" placeholder="Jane Doe" required />
      </label>

      <label className="field">
        <span>Email</span>
        <input name="email" type="email" placeholder="you@company.com" required />
      </label>

      <label className="field">
        <span>Password</span>
        <input
          name="password"
          type="password"
          placeholder="Crea una password segura"
          required
        />
      </label>

      {error ? <p className="form-error">{error}</p> : null}

      <button className="button button--primary" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creando cuenta...' : 'Register'}
      </button>
    </form>
  );
}
