import Link from 'next/link';
import { RegisterForm } from './register-form';

export default function RegisterPage() {
  return (
    <main className="auth-page">
      <section className="auth-panel auth-panel--hero">
        <span className="auth-badge">New workspace</span>
        <h1>Crea una base limpia para operar desde el primer día.</h1>
        <p>
          Registra tu equipo y deja lista la estructura para conversaciones,
          mensajes y automatizaciones.
        </p>
        <div className="auth-metrics">
          <article>
            <strong>3 vistas base</strong>
            <span>Dashboard, inbox y automations ya preparadas.</span>
          </article>
          <article>
            <strong>Multi-tenant</strong>
            <span>Separación por tenant lista desde backend.</span>
          </article>
        </div>
      </section>

      <section className="auth-panel auth-panel--form">
        <div className="auth-form-heading">
          <span className="auth-kicker">Register</span>
          <h2>Crear cuenta</h2>
          <p>El registro ya crea el tenant y la cuenta usando la API real.</p>
        </div>

        <RegisterForm />

        <p className="auth-footer">
          ¿Ya tienes cuenta? <Link href="/login">Ir a login</Link>
        </p>
      </section>
    </main>
  );
}
