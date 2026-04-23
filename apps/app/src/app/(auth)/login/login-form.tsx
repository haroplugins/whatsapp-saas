'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiFetch, setAccessToken } from '../../../lib/api';

type LoginResponse = {
  accessToken: string;
};

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: {
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
          : 'No se pudo iniciar sesión.';

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" action={handleSubmit}>
      <label className="field">
        <span>Email</span>
        <input name="email" type="email" placeholder="you@company.com" required />
      </label>

      <label className="field">
        <span>Password</span>
        <input
          name="password"
          type="password"
          placeholder="Introduce tu password"
          required
        />
      </label>

      {error ? <p className="form-error">{error}</p> : null}

      <button className="button button--primary" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Entrando...' : 'Login'}
      </button>
    </form>
  );
}
