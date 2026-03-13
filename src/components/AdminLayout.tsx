'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="7" height="8" rx="1.5" />
      <rect x="11" y="2" width="7" height="5" rx="1.5" />
      <rect x="2" y="12" width="7" height="6" rx="1.5" />
      <rect x="11" y="9" width="7" height="9" rx="1.5" />
    </svg>
  )},
  { href: '/admin/professores', label: 'Professores', icon: (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="6" r="3" />
      <path d="M2 17c0-3 2.5-5 5-5s5 2 5 5" />
      <circle cx="14" cy="5" r="2.5" />
      <path d="M18 16c0-2.5-1.8-4-4-4-.8 0-1.5.2-2 .5" />
    </svg>
  )},
  { href: '/admin/configuracoes', label: 'Config IA', icon: (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2v1.5M10 16.5V18M18 10h-1.5M3.5 10H2M15.66 4.34l-1.06 1.06M5.4 14.6l-1.06 1.06M15.66 15.66l-1.06-1.06M5.4 5.4L4.34 4.34" />
      <circle cx="10" cy="10" r="3.5" />
    </svg>
  )},
  { href: '/admin/perguntas', label: 'Perguntas', icon: (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h12M4 8h8M4 12h10M4 16h6" />
    </svg>
  )},
  { href: '/admin/sistema', label: 'Sistema', icon: (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="2" />
      <path d="M10 2a1 1 0 011 1v1.07a6 6 0 012.51 1.04l.76-.76a1 1 0 011.41 0l.01.01a1 1 0 010 1.41l-.76.76A6 6 0 0116.93 9H18a1 1 0 011 1v.01a1 1 0 01-1 1h-1.07a6 6 0 01-1.04 2.51l.76.76a1 1 0 010 1.41l-.01.01a1 1 0 01-1.41 0l-.76-.76A6 6 0 0111 15.93V17a1 1 0 01-1 1h-.01a1 1 0 01-1-1v-1.07a6 6 0 01-2.51-1.04l-.76.76a1 1 0 01-1.41 0l-.01-.01a1 1 0 010-1.41l.76-.76A6 6 0 013.07 11H2a1 1 0 01-1-1v-.01a1 1 0 011-1h1.07a6 6 0 011.04-2.51l-.76-.76a1 1 0 010-1.41l.01-.01a1 1 0 011.41 0l.76.76A6 6 0 019 3.07V2a1 1 0 011-1z" />
    </svg>
  )},
];

interface EscolaInfo {
  nome: string;
  professores: number;
  genero: string;
  faixaEtaria: string;
}

interface AdminLayoutProps {
  children: React.ReactNode;
  titulo: string;
  subtitulo?: string;
}

export default function AdminLayout({ children, titulo, subtitulo }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [escola, setEscola] = useState<EscolaInfo | null>(null);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(data => {
        if (data) {
          setEscola({
            nome: 'Escola Principal',
            professores: data.totalProfessoresEscola || data.totalProfessores || 0,
            genero: '—',
            faixaEtaria: '31 - 50',
          });
        }
      })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/');
  }

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] font-[Nunito]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-[250px] bg-white z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 shadow-[1px_0_0_#ece8e1] ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="px-5 py-5">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logos/logo-icone.png"
              alt="EmpatIA"
              width={34}
              height={34}
              className="flex-shrink-0"
            />
            <span className="font-extrabold text-[#2d4a3e] text-[17px] tracking-tight">EMPATIA</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-1 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-semibold transition-all duration-200 ${
                  active
                    ? 'bg-[#e8f5ee] text-[#2d7a5e]'
                    : 'text-[#7a7a72] hover:bg-[#f5f3ef] hover:text-[#4a6b5d]'
                }`}
              >
                <span className={active ? 'text-[#2d7a5e]' : 'text-[#a3a29a]'}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* School info */}
        <div className="mx-3 mb-3 rounded-xl bg-[#faf8f5] border border-[#ece8e1] p-4">
          <p className="font-bold text-[#2d2a26] text-[13px]">{escola?.nome || 'Escola'}</p>
          <div className="mt-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-[11.5px]">
              <span className="text-[#9a9590]">Professores:</span>
              <span className="font-bold text-[#4a4842]">{escola?.professores || '—'}</span>
            </div>
            <div className="flex items-center justify-between text-[11.5px]">
              <span className="text-[#9a9590]">Genero:</span>
              <span className="font-bold text-[#4a4842]">{escola?.genero || '—'}</span>
            </div>
            <div className="flex items-center justify-between text-[11.5px]">
              <span className="text-[#9a9590]">Faixa etaria:</span>
              <span className="font-bold text-[#4a4842]">{escola?.faixaEtaria || '—'}</span>
            </div>
          </div>
        </div>

        {/* Suporte + Sair */}
        <div className="px-3 pb-4 space-y-1">
          <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[13px] font-bold bg-[#2d7a5e] text-white hover:bg-[#24674f] transition-colors">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16z" />
              <path d="M10 14v-1M7.5 7.5a2.5 2.5 0 014.6 1.3c0 1.7-2.6 1.7-2.6 3.2" />
            </svg>
            Suporte
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[13px] font-semibold text-[#a3a29a] hover:bg-[#fef2f2] hover:text-[#dc6b6b] transition-all duration-200"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 3h3a1 1 0 011 1v12a1 1 0 01-1 1h-3M8 17l-5-5 5-5M3 12h12" />
            </svg>
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-[250px] min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-[#faf8f5]/90 backdrop-blur-md">
          <div className="flex items-center justify-between px-5 lg:px-8 h-[60px]">
            <div className="flex items-center gap-3">
              {/* Mobile menu */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-1.5 rounded-lg hover:bg-[#ece8e1] text-[#7a7a72] transition-colors"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 6h18M3 12h18M3 18h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-[17px] font-extrabold text-[#2d2a26] tracking-tight">{titulo}</h1>
                {subtitulo && <p className="text-[11.5px] text-[#9a9590] font-medium -mt-0.5">{subtitulo}</p>}
              </div>
            </div>

            {/* Right: notification + avatar */}
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-xl hover:bg-[#ece8e1] text-[#9a9590] hover:text-[#4a4842] transition-colors relative">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 6.5A5 5 0 005 6.5c0 5.5-2.5 7-2.5 7h15S15 12 15 6.5zM8.5 16.5a2 2 0 003 0" />
                </svg>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#e57a5a] rounded-full" />
              </button>
              <div className="w-8 h-8 rounded-full bg-[#2d7a5e] flex items-center justify-center text-white text-xs font-bold ml-1">
                A
              </div>
            </div>
          </div>
          <div className="h-px bg-[#ece8e1]" />
        </header>

        {/* Page content */}
        <main className="p-5 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
