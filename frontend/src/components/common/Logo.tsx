type LogoProps = {
  showText?: boolean;
  className?: string;
  subtitle?: string;
};

function Logo({ showText = true, className = "", subtitle }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        viewBox="0 0 40 40"
        className="h-9 w-9 shrink-0 drop-shadow-sm"
        role="img"
        aria-label="Turnos AI"
      >
        <defs>
          <linearGradient id="turnos-logo-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8fb59c" />
            <stop offset="100%" stopColor="#4f725c" />
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="38" height="38" rx="11" fill="url(#turnos-logo-gradient)" />
        <rect
          x="9"
          y="12"
          width="22"
          height="19"
          rx="4"
          fill="none"
          stroke="white"
          strokeWidth="2"
          opacity="0.95"
        />
        <path d="M9 18h22" stroke="white" strokeWidth="2" opacity="0.95" />
        <path d="M15 9v6M25 9v6" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path
          d="m15.5 26.5 3 3 6-6.5"
          fill="none"
          stroke="white"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showText && (
        <span className="min-w-0 leading-tight">
          <span className="block whitespace-nowrap text-base font-semibold tracking-tight text-zinc-900">
            Turnos<span className="text-sage-600"> AI</span>
          </span>
          {subtitle && (
            <span className="block whitespace-nowrap text-xs text-zinc-400">
              {subtitle}
            </span>
          )}
        </span>
      )}
    </span>
  );
}

export default Logo;
