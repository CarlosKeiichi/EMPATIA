import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EmpatIA | Saude Mental do Professor',
  description: 'Plataforma de apoio a saude mental de professores com jornadas guiadas por IA',
  icons: {
    icon: '/logos/logo-icone.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-organic">{children}</body>
    </html>
  );
}
