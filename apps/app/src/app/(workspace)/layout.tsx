import Link from 'next/link';

type WorkspaceLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

const navigation = [
  { href: '/dashboard', label: 'Dashboard', description: 'Resumen general' },
  { href: '/inbox', label: 'Inbox', description: 'Conversaciones' },
  { href: '/automations', label: 'Automations', description: 'Reglas activas' },
];

export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  return (
    <div className="workspace-shell">
      <aside className="workspace-sidebar">
        <div className="workspace-brand">
          <span className="workspace-brand__mark">WS</span>
          <div>
            <strong>Workspace</strong>
            <p>Control room</p>
          </div>
        </div>

        <nav className="workspace-nav" aria-label="Primary">
          {navigation.map((item) => (
            <Link key={item.href} className="workspace-nav__link" href={item.href}>
              <strong>{item.label}</strong>
              <span>{item.description}</span>
            </Link>
          ))}
        </nav>

        <div className="workspace-sidebar__card">
          <span className="workspace-sidebar__eyebrow">MVP</span>
          <p>La shell ya está lista para conectar auth y datos reales en el siguiente bloque.</p>
        </div>
      </aside>

      <div className="workspace-main">
        <header className="workspace-header">
          <div>
            <span className="workspace-header__eyebrow">Private app</span>
            <h1>Panel interno</h1>
          </div>
          <Link className="button button--ghost" href="/login">
            Sign out
          </Link>
        </header>

        <main className="workspace-content">{children}</main>
      </div>
    </div>
  );
}
