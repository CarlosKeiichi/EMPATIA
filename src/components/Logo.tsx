interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export default function Logo({ size = 40, showText = false, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Fundo com gradiente roxo */}
        <defs>
          <linearGradient id="logoBg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8b6bab" />
            <stop offset="1" stopColor="#5a4a82" />
          </linearGradient>
          <linearGradient id="heartGlow" x1="40" y1="30" x2="80" y2="90" gradientUnits="userSpaceOnUse">
            <stop stopColor="#e0d4f5" />
            <stop offset="1" stopColor="#c3b5fd" />
          </linearGradient>
        </defs>

        {/* Fundo arredondado */}
        <rect width="120" height="120" rx="28" fill="url(#logoBg)" />

        {/* Mãos acolhedoras (simplificadas como curvas) */}
        <path
          d="M30 70 C30 50, 45 35, 60 45 C75 35, 90 50, 90 70"
          stroke="#e0d4f5"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />
        <path
          d="M25 75 C25 52, 42 30, 60 42 C78 30, 95 52, 95 75"
          stroke="#e0d4f5"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity="0.3"
        />

        {/* Coração central */}
        <path
          d="M60 85 C60 85, 40 70, 40 58 C40 50, 48 45, 54 48 C57 50, 59 53, 60 56 C61 53, 63 50, 66 48 C72 45, 80 50, 80 58 C80 70, 60 85, 60 85Z"
          fill="url(#heartGlow)"
        />

        {/* Pulso/onda dentro do coração (saúde mental) */}
        <path
          d="M47 63 L53 63 L56 57 L60 69 L64 57 L67 63 L73 63"
          stroke="#7c6bab"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Pequenas partículas de luz */}
        <circle cx="38" cy="38" r="2" fill="#c3b5fd" opacity="0.5" />
        <circle cx="82" cy="35" r="1.5" fill="#c3b5fd" opacity="0.4" />
        <circle cx="28" cy="55" r="1.5" fill="#c3b5fd" opacity="0.3" />
        <circle cx="92" cy="52" r="2" fill="#c3b5fd" opacity="0.4" />
      </svg>

      {showText && (
        <div className="flex flex-col">
          <span className="text-xl font-bold text-gray-800 leading-tight">
            Empat<span className="text-primary-600">IA</span>
          </span>
          <span className="text-[10px] text-gray-400 leading-tight">Saúde Mental do Professor</span>
        </div>
      )}
    </div>
  );
}

export function LogoMini({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logoBgMini" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8b6bab" />
          <stop offset="1" stopColor="#5a4a82" />
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="28" fill="url(#logoBgMini)" />
      <path
        d="M60 85 C60 85, 40 70, 40 58 C40 50, 48 45, 54 48 C57 50, 59 53, 60 56 C61 53, 63 50, 66 48 C72 45, 80 50, 80 58 C80 70, 60 85, 60 85Z"
        fill="#e0d4f5"
      />
      <path
        d="M47 63 L53 63 L56 57 L60 69 L64 57 L67 63 L73 63"
        stroke="#7c6bab"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
