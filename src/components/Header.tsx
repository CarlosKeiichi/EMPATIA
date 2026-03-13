'use client';

import { useRouter } from 'next/navigation';
import { LogoMini } from '@/components/Logo';

interface HeaderProps {
  titulo?: string;
  subtitulo?: string;
  children?: React.ReactNode;
}

export default function Header({ titulo = 'EmpatIA', subtitulo, children }: HeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/');
  }

  return (
    <header className="bg-white/70 backdrop-blur-md border-b border-primary-100/40 px-4 sm:px-6 py-3.5 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LogoMini size={32} />
          <div>
            <h1 className="font-bold text-primary-950 text-sm sm:text-base">{titulo}</h1>
            {subtitulo && <p className="text-xs text-primary-400 font-medium">{subtitulo}</p>}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {children}
          <button
            onClick={handleLogout}
            className="text-sm text-primary-400 hover:text-primary-700 font-medium transition-colors duration-200"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
