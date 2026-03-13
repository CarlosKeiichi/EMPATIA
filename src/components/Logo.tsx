import Image from 'next/image';

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
  variant?: 'dark' | 'light';
}

export default function Logo({ size = 40, showText = false, className = '', variant = 'dark' }: LogoProps) {
  const src = variant === 'light' ? '/logos/logo-completo-light.png' : '/logos/logo-completo.png';

  return (
    <div className={`flex-shrink-0 ${className}`}>
      <Image
        src={src}
        alt="EmpatIA"
        width={size}
        height={size}
        className="object-contain"
        style={{ width: showText ? size : size * 0.8, height: 'auto' }}
        priority
      />
    </div>
  );
}

export function LogoMini({ size = 32, variant = 'dark' }: { size?: number; variant?: 'dark' | 'light' }) {
  const src = variant === 'light' ? '/logos/logo-completo-light.png' : '/logos/logo-completo.png';

  return (
    <Image
      src={src}
      alt="EmpatIA"
      width={size}
      height={size}
      className="flex-shrink-0 object-contain"
      style={{ width: size, height: 'auto' }}
      priority
    />
  );
}
