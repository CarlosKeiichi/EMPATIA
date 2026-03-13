import BotaoCrise from '@/components/BotaoCrise';

export default function ProfessorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <BotaoCrise />
    </>
  );
}
