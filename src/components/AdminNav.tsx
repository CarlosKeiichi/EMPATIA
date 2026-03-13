'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const links = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/professores', label: 'Professores', icon: '👩‍🏫' },
  { href: '/admin/configuracoes', label: 'Config IA', icon: '🤖' },
  { href: '/admin/perguntas', label: 'Perguntas', icon: '❓' },
  { href: '/admin/sistema', label: 'Sistema', icon: '⚙️' },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1.5 bg-primary-50/50 backdrop-blur-sm p-1.5 rounded-2xl w-fit border border-primary-100/30 shadow-warm-sm">
      {links.map((link) => {
        const ativo = link.href === '/admin'
          ? pathname === '/admin'
          : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-1.5 ${
              ativo
                ? 'bg-primary-600 text-white shadow-warm shadow-glow'
                : 'text-primary-500 hover:text-primary-700 hover:bg-primary-100/60'
            }`}
          >
            <span className="text-base">{link.icon}</span>
            <span className="hidden sm:inline">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
