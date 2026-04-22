import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Workspace App',
  description: 'Private app shell for the WhatsApp SaaS workspace.',
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
