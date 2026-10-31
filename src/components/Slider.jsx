export default function Slider({ value, min, max, step = 1, onChange, label }) {
  const percent = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))
  return (
    <div className="relative h-6 w-full">
      <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-xs bg-(--border)">
        <div className="absolute inset-y-0 left-0 rounded-xs bg-(--accent)" style={{ width: `${percent}%` }} />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={event => onChange(Number(event.target.value))}
        className="peer absolute inset-0 z-10 w-full cursor-pointer opacity-0 focus-visible:outline-none"
      />
      <div
        className="pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 rounded-sm bg-[#f2f3f7] shadow-[0_2px_0_#9097ab] peer-focus-visible:ring-2 peer-focus-visible:ring-(--accent-text)"
        style={{ left: `calc(${percent}% - 8px)` }}
      />
    </div>
  )
}
