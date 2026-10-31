import { useEffect, useId, useRef, useState } from 'react'
import { ChevronIcon, CheckIcon } from './icons'

export default function Select({ value, onChange, options, className = '', label }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const root = useRef(null)
  const list = useRef(null)
  const listId = useId()

  const selectedIndex = Math.max(0, options.findIndex(option => option.value === value))
  const selected = options[selectedIndex]

  useEffect(() => {
    function onDocClick(event) { if (root.current && !root.current.contains(event.target)) setOpen(false) }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  useEffect(() => {
    if (open) list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  function show() { setActive(selectedIndex); setOpen(true) }
  function choose(index) { onChange(options[index].value); setOpen(false) }

  function onKeyDown(event) {
    const last = options.length - 1
    if (event.key === 'Escape') { if (open) { event.preventDefault(); setOpen(false) } return }
    if (event.key === 'Tab') { setOpen(false); return }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const step = event.key === 'ArrowDown' ? 1 : -1
      if (!open) { show(); return }
      setActive(current => Math.min(last, Math.max(0, current + step)))
    } else if (event.key === 'Home' || event.key === 'End') {
      if (!open) return
      event.preventDefault()
      setActive(event.key === 'Home' ? 0 : last)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (open) choose(active)
      else show()
    }
  }

  return (
    <div ref={root} className={`relative ${className}`}>
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        aria-label={label}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
        className="inset flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-(--text) outline-none focus-visible:ring-2 focus-visible:ring-(--accent-text)"
      >
        <span className="min-w-0 flex-1 truncate">{selected?.label}</span>
        <ChevronIcon className={`shrink-0 text-(--muted) transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          ref={list}
          id={listId}
          role="listbox"
          aria-label={label}
          className="animate-fade-in absolute left-0 right-0 z-30 mt-2 max-h-70 overflow-y-auto rounded-md border-2 border-(--edge) bg-[#0b0f1a] p-1.5 shadow-[0_0_0_1px_var(--border),0_14px_30px_rgb(0_0_0/0.55)]"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value
            const isActive = index === active
            return (
              <div
                key={option.value}
                id={`${listId}-${index}`}
                data-index={index}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActive(index)}
                onMouseDown={event => event.preventDefault()}
                onClick={() => choose(index)}
                className={`flex cursor-pointer items-center gap-2.5 rounded-sm px-2.5 py-2 text-sm transition-colors ${isActive ? 'bg-[#1b2440] text-white' : isSelected ? 'text-white' : 'text-(--label)'}`}
              >
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {isSelected && <CheckIcon className="size-4 shrink-0 text-(--accent-text)" />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
