import { ChevronIcon } from './icons'

export default function Stepper({ value, onChange, min, max, step = 1, label = 'Value' }) {
  function clamp(next) {
    return Math.min(max, Math.max(min, next))
  }

  return (
    <div className="inset flex h-9 items-stretch overflow-hidden">
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={event => onChange(clamp(Number(event.target.value) || min))}
        className="w-11 bg-transparent px-2 text-right font-mono text-sm text-(--text) outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none focus:outline-none"
      />
      <div className="flex flex-col border-l border-(--border)">
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => onChange(clamp(Math.round((value + step) * 10) / 10))}
          className="flex h-4.5 w-6 items-center justify-center text-(--muted) transition-colors hover:bg-(--surface) hover:text-(--text) focus-visible:outline-none focus-visible:bg-(--surface)"
        >
          <ChevronIcon width={10} height={10} className="rotate-180" />
        </button>
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(clamp(Math.round((value - step) * 10) / 10))}
          className="flex h-4.5 w-6 items-center justify-center border-t border-(--border) text-(--muted) transition-colors hover:bg-(--surface) hover:text-(--text) focus-visible:outline-none focus-visible:bg-(--surface)"
        >
          <ChevronIcon width={10} height={10} />
        </button>
      </div>
    </div>
  )
}
