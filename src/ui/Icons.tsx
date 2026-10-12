/* Os ícones das telas, em SVG de traço (herdam a cor do texto). */
type P = { className?: string };
const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export const ArrowCircle = ({ className, dir = "right" }: P & { dir?: "right" | "left" }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...base} style={dir === "left" ? { transform: "scaleX(-1)" } : undefined}>
    <circle cx="12" cy="12" r="10.2" />
    <path d="M7 12h10M12.6 7.6 17 12l-4.4 4.4" />
  </svg>
);
export const ArrowDisc = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="12" fill="currentColor" />
    <path d="M6.6 12h10.4M12.8 7.8 17 12l-4.2 4.2" fill="none" stroke="var(--disc-ink, #000)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const Expand = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
    <path d="M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7" />
  </svg>
);
export const Caret = ({ className }: P) => (
  <svg viewBox="0 0 12 10" className={className} aria-hidden="true"><path d="M0 0h12L6 10z" fill="currentColor" /></svg>
);
export const GridIcon = ({ className }: P) => (
  <svg viewBox="0 0 16 16" className={className} aria-hidden="true" fill="currentColor">
    <rect x="1" y="1" width="6" height="6" rx="1" /><rect x="9" y="1" width="6" height="6" rx="1" />
    <rect x="1" y="9" width="6" height="6" rx="1" /><rect x="9" y="9" width="6" height="6" rx="1" />
  </svg>
);
export const ListIcon = ({ className }: P) => (
  <svg viewBox="0 0 16 16" className={className} aria-hidden="true" fill="currentColor">
    <rect x="1" y="2.5" width="2" height="2" rx=".5" /><rect x="5" y="2.8" width="10" height="1.4" rx=".7" />
    <rect x="1" y="7" width="2" height="2" rx=".5" /><rect x="5" y="7.3" width="10" height="1.4" rx=".7" />
    <rect x="1" y="11.5" width="2" height="2" rx=".5" /><rect x="5" y="11.8" width="10" height="1.4" rx=".7" />
  </svg>
);
export const Close = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const Bulb = ({ className, on }: P & { on?: boolean }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
    <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" fill={on ? "currentColor" : "none"} fillOpacity={on ? 0.25 : 0} />
  </svg>
);
export const Bag = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
    <path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </svg>
);
export const Plus = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}><path d="M12 5v14M5 12h14" /></svg>
);
export const Check = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);
