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
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LogoMini size={32} />
          <div>
            <h1 className="font-semibold text-gray-800 text-sm sm:text-base">{titulo}</h1>
            {subtitulo && <p className="text-xs text-gray-400">{subtitulo}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {children}
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
