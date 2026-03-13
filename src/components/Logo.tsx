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
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <defs>
          <linearGradient id="handGrad" x1="40" y1="60" x2="160" y2="180" gradientUnits="userSpaceOnUse">
            <stop stopColor="#a594d0" />
            <stop offset="1" stopColor="#7b6bab" />
          </linearGradient>
          <linearGradient id="brainGrad" x1="60" y1="30" x2="140" y2="120" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ddd4f0" />
            <stop offset="1" stopColor="#c4b3e3" />
          </linearGradient>
          <linearGradient id="heartGrad" x1="80" y1="100" x2="120" y2="170" gradientUnits="userSpaceOnUse">
            <stop stopColor="#c4b3e3" />
            <stop offset="1" stopColor="#a594d0" />
          </linearGradient>
        </defs>

        {/* Left hand */}
        <path
          d="M50 140 C30 130, 20 110, 25 90 C28 75, 40 62, 55 58 C60 56, 65 58, 68 62 C72 68, 70 76, 65 80"
          stroke="url(#handGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
          opacity="0.85"
        />
        <path
          d="M50 140 C45 145, 42 155, 50 160 C55 163, 62 160, 65 155"
          stroke="url(#handGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />

        {/* Right hand */}
        <path
          d="M150 140 C170 130, 180 110, 175 90 C172 75, 160 62, 145 58 C140 56, 135 58, 132 62 C128 68, 130 76, 135 80"
          stroke="url(#handGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
          opacity="0.85"
        />
        <path
          d="M150 140 C155 145, 158 155, 150 160 C145 163, 138 160, 135 155"
          stroke="url(#handGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />

        {/* Brain (organic curves) */}
        <path
          d="M75 75 C75 55, 85 40, 100 38 C115 40, 125 55, 125 75"
          stroke="url(#brainGrad)"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M80 68 C85 58, 95 52, 100 52 C105 52, 115 58, 120 68"
          stroke="url(#brainGrad)"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
        {/* Brain folds */}
        <path d="M88 48 C90 42, 95 40, 100 40 C105 40, 110 42, 112 48" stroke="url(#brainGrad)" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.5" />
        <path d="M82 62 C86 56, 92 53, 100 53" stroke="url(#brainGrad)" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.5" />
        <path d="M118 62 C114 56, 108 53, 100 53" stroke="url(#brainGrad)" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.5" />
        {/* Neural connections dots */}
        <circle cx="85" cy="50" r="2.5" fill="#c4b3e3" opacity="0.6" />
        <circle cx="115" cy="50" r="2.5" fill="#c4b3e3" opacity="0.6" />
        <circle cx="100" cy="42" r="2" fill="#ddd4f0" opacity="0.8" />
        <circle cx="92" cy="60" r="2" fill="#c4b3e3" opacity="0.5" />
        <circle cx="108" cy="60" r="2" fill="#c4b3e3" opacity="0.5" />

        {/* Heart (below brain, morphing into it) */}
        <path
          d="M100 155 C100 155, 72 130, 72 110 C72 100, 80 92, 88 96 C93 98, 97 103, 100 108 C103 103, 107 98, 112 96 C120 92, 128 100, 128 110 C128 130, 100 155, 100 155Z"
          fill="url(#heartGrad)"
          opacity="0.9"
        />
        {/* Heart-brain connection */}
        <path d="M92 92 C95 82, 100 78, 100 75" stroke="#c4b3e3" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.4" />
        <path d="M108 92 C105 82, 100 78, 100 75" stroke="#c4b3e3" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.4" />

        {/* Pulse line inside heart */}
        <path
          d="M84 118 L92 118 L96 110 L100 126 L104 110 L108 118 L116 118"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.8"
        />
      </svg>

      {showText && (
        <div className="flex flex-col">
          <span className="text-xl font-extrabold text-primary-950 leading-tight tracking-tight">
            Empat<span className="text-primary-600">IA</span>
          </span>
          <span className="text-[10px] text-primary-400 font-medium leading-tight">Saude Mental do Professor</span>
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
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="miniGrad" x1="60" y1="40" x2="140" y2="160" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a594d0" />
          <stop offset="1" stopColor="#7b6bab" />
        </linearGradient>
      </defs>
      {/* Simplified brain+heart */}
      <path
        d="M75 75 C75 55, 85 40, 100 38 C115 40, 125 55, 125 75"
        stroke="url(#miniGrad)"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M100 155 C100 155, 72 130, 72 110 C72 100, 80 92, 88 96 C93 98, 97 103, 100 108 C103 103, 107 98, 112 96 C120 92, 128 100, 128 110 C128 130, 100 155, 100 155Z"
        fill="url(#miniGrad)"
        opacity="0.85"
      />
      <path
        d="M84 118 L92 118 L96 110 L100 126 L104 110 L108 118 L116 118"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.9"
      />
    </svg>
  );
}
