import Link from 'next/link';
import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <main className="auth-page">
      <section className="auth-panel auth-panel--hero">
        <span className="auth-badge">Private workspace</span>
        <h1>Todo el equipo en una sola bandeja clara.</h1>
        <p>
          Accede a tu espacio para revisar conversaciones, automatizaciones y el
          resumen operativo del negocio.
        </p>
        <div className="auth-highlights">
          <article>
            <strong>Inbox compartido</strong>
            <span>Conversaciones ordenadas y listas para responder.</span>
          </article>
          <article>
            <strong>Automations listas</strong>
            <span>Reglas simples para responder y hacer seguimiento.</span>
          </article>
          <article>
            <strong>Dashboard preparado</strong>
            <span>Resumen rápido de actividad para seguir construyendo.</span>
          </article>
        </div>
      </section>

      <section className="auth-panel auth-panel--form">
        <div className="auth-form-heading">
          <span className="auth-kicker">Login</span>
          <h2>Entrar al workspace</h2>
          <p>La autenticación ya conecta con el backend real del proyecto.</p>
        </div>

        <LoginForm />

        <p className="auth-footer">
          ¿Aún no tienes cuenta? <Link href="/register">Crear workspace</Link>
        </p>
      </section>
    </main>
  );
}
