const base = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }

export const PackIcon = props => (
  <svg {...base} {...props}><path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" /><path d="M3 8l9 5 9-5" /><path d="M12 13v8" /></svg>
)
export const FontIcon = props => (
  <svg {...base} {...props}><path d="M4 20 10 4h2l6 16" /><path d="M6.5 14h9" /></svg>
)
export const EffectIcon = props => (
  <svg {...base} {...props}><path d="M12 3v3m0 12v3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M3 12h3m12 0h3M5.6 18.4l2.1-2.1m8.6-8.6 2.1-2.1" /><circle cx="12" cy="12" r="3" /></svg>
)
export const TextIcon = props => (
  <svg {...base} {...props}><path d="M4 7V5h16v2" /><path d="M9 20h6" /><path d="M12 5v15" /></svg>
)
export const ScaleIcon = props => (
  <svg {...base} {...props}><path d="M3 20 20 3" /><path d="M3 10V3h7" /><path d="M14 20h7v-7" /></svg>
)
export const SpeedIcon = props => (
  <svg {...base} {...props}><circle cx="12" cy="13" r="8" /><path d="M12 13l4-4" /><path d="M9 3h6" /></svg>
)
export const CanvasIcon = props => (
  <svg {...base} {...props}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="m3 15 5-5 4 4 3-3 6 6" /></svg>
)
export const CodeIcon = props => (
  <svg {...base} {...props}><path d="m8 6-6 6 6 6" /><path d="m16 6 6 6-6 6" /><path d="m13 4-2 16" /></svg>
)
export const ChevronIcon = props => (
  <svg {...base} {...props}><path d="m6 9 6 6 6-6" /></svg>
)
export const GithubIcon = props => (
  <svg {...base} fill="currentColor" stroke="none" {...props}><path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.36 1.08 2.93.83.09-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.85-2.35 4.7-4.58 4.94.36.31.68.92.68 1.86v2.76c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" /></svg>
)

export const ColorPickerIcon = props => (
  <svg {...base} {...props}>
    <path d="M12 4a8 8 0 0 0-7.2 4.3L3 15l5-1.2A8 8 0 0 0 12 20a8 8 0 0 0 8-8c0-4.4-3.6-8-8-8Z" />
    <circle cx="9" cy="9" r="1.2" />
    <circle cx="15" cy="9" r="1.2" />
    <circle cx="12" cy="14" r="1.2" />
  </svg>
)

export const PlayIcon = props => (
  <svg {...base} {...props}><polygon points="6 3 20 12 6 21 6 3" /></svg>
)

export const PauseIcon = props => (
  <svg {...base} {...props}><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
)

export const StepIcon = props => (
  <svg {...base} {...props}><polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" /></svg>
)

export const CheckIcon = props => (
  <svg {...base} {...props}><polyline points="20 6 9 17 4 12" /></svg>
)

export const TrashIcon = props => (
  <svg {...base} {...props}><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
)

export const CoffeeIcon = props => (
  <svg {...base} {...props}><path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z" /><path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16" /><path d="M8 3v3M12 3v3" /></svg>
)
