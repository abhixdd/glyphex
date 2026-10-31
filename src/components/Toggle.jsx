export default function Toggle({ checked, onChange, label, ...props }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-[5px] border-2 border-(--edge) transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent-text) ${checked ? 'bg-(--accent) shadow-[inset_0_1px_0_rgb(255_255_255/0.3)]' : 'bg-(--btn-deep)'}`}
      {...props}
    >
      <span className={`absolute left-0.5 top-1/2 size-3.5 -translate-y-1/2 rounded-[3px] bg-white shadow-[0_1px_0_rgb(0_0_0/0.4)] transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  )
}
