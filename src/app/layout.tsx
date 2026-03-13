import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EmpatIA | Saúde Mental do Professor',
  description: 'Plataforma de apoio à saúde mental de professores com jornadas guiadas por IA',
  icons: {
    icon: '/logos/logo-icone.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
