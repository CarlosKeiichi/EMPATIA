'use client';

// Redireciona para login principal
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const router = useRouter();
  useEffect(() => {
    router.push('/');
  }, [router]);
  return null;
}
