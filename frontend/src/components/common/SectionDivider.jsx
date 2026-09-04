/**
 * SectionDivider — thin gold decorative line with optional eyebrow label and SVG motif
 * Usage: <SectionDivider label="Our Story" motif="elephant" />
 */
export default function SectionDivider({ label, motif = 'leaf', className = '' }) {
  return (
    <div className={`flex flex-col items-center gap-4 py-8 ${className}`} aria-hidden="true">
      {label && (
        <p className="eyebrow-label text-accent-gold">{label}</p>
      )}
      <div className="flex items-center gap-6 w-full max-w-md">
        {/* Left line */}
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-accent-gold/60" />
        {/* Central SVG motif */}
        <div className="flex-shrink-0 text-accent-gold">
          {motif === 'elephant' ? <ElephantMotif /> : <LeafMotif />}
        </div>
        {/* Right line */}
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-accent-gold/60" />
      </div>
    </div>
  );
}

function LeafMotif() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M16 2 C16 2 28 8 28 18 C28 24.627 22.627 30 16 30 C9.373 30 4 24.627 4 18 C4 8 16 2 16 2Z"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
      <line x1="16" y1="2" x2="16" y2="30" stroke="currentColor" strokeWidth="0.75" />
      <path d="M16 10 Q20 14 16 18" stroke="currentColor" strokeWidth="0.5" fill="none" />
      <path d="M16 10 Q12 14 16 18" stroke="currentColor" strokeWidth="0.5" fill="none" />
    </svg>
  );
}

function ElephantMotif() {
  return (
    <svg
      width="36"
      height="28"
      viewBox="0 0 36 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Body */}
      <ellipse cx="18" cy="16" rx="10" ry="8" stroke="currentColor" strokeWidth="1" fill="none" />
      {/* Head */}
      <circle cx="9" cy="12" r="5" stroke="currentColor" strokeWidth="1" fill="none" />
      {/* Ear */}
      <path d="M5 9 Q2 7 3 12 Q2 16 6 15" stroke="currentColor" strokeWidth="0.75" fill="none" />
      {/* Trunk */}
      <path d="M5 14 Q2 18 4 22 Q5 25 7 24" stroke="currentColor" strokeWidth="0.75" fill="none" />
      {/* Eye */}
      <circle cx="8" cy="11" r="0.8" fill="currentColor" />
      {/* Legs */}
      <line x1="13" y1="24" x2="13" y2="28" stroke="currentColor" strokeWidth="1" />
      <line x1="18" y1="24" x2="18" y2="28" stroke="currentColor" strokeWidth="1" />
      <line x1="23" y1="24" x2="23" y2="28" stroke="currentColor" strokeWidth="1" />
      {/* Tail */}
      <path d="M28 14 Q33 12 31 16" stroke="currentColor" strokeWidth="0.75" fill="none" />
    </svg>
  );
}
