const LegalBackdrop = ({ className = '' }) => (
  <div className={`relative h-[400px] w-full overflow-hidden ${className}`} aria-hidden="true">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_25%,rgba(34,211,238,.18),transparent_58%)]" />
    <div className="absolute left-1/2 top-1/3 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2rem] border border-cyan/20 bg-cyan/[.04] shadow-[0_0_80px_rgba(34,211,238,.08)]" />
    <div className="absolute left-1/2 top-1/3 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[1.5rem] border border-cyan/25" />
  </div>
);

export default LegalBackdrop;
