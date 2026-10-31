import { useRef, useState } from 'react'

export default function Dropzone({ label, accept, onFile, compact = false, large = false, hint }) {
  const input = useRef(null)
  const [hover, setHover] = useState(false)

  function handleFiles(files) {
    const file = files?.[0]
    if (file) onFile(file)
  }

  if (large) {
    return (
      <div
        onDragOver={event => { event.preventDefault(); setHover(true) }}
        onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget)) setHover(false) }}
        onDrop={event => { event.preventDefault(); setHover(false); handleFiles(event.dataTransfer.files) }}
        onClick={() => input.current.click()}
        onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); input.current.click() } }}
        role="button"
        tabIndex={0}
        className={`flex min-h-85 w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-md border-2 border-dashed px-4 py-12 sm:px-6 text-center outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-(--accent-text) sm:min-h-105 ${hover ? 'border-(--accent-text) bg-(--accent)/10' : 'border-(--border) bg-(--field) hover:border-(--muted)'}`}
      >
        <input ref={input} type="file" accept={accept} className="hidden" onChange={event => handleFiles(event.target.files)} />
        <div className={`flex size-14 items-center justify-center rounded-full border transition-colors ${hover ? 'border-(--accent-text) text-(--accent-text)' : 'border-(--border) text-(--muted)'}`}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></svg>
        </div>
        <div>
          <p className="text-lg font-medium text-(--text)">{hover ? 'Release to load' : label}</p>
          <p className="mt-1.5 text-sm text-(--muted)">
            or <span className="text-(--accent-text) underline underline-offset-2">browse files</span> from your computer
          </p>
        </div>
        {hint && <div className="max-w-md text-xs text-(--muted)">{hint}</div>}
      </div>
    )
  }

  return (
    <div
      onDragOver={event => { event.preventDefault(); setHover(true) }}
      onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget)) setHover(false) }}
      onDrop={event => { event.preventDefault(); setHover(false); handleFiles(event.dataTransfer.files) }}
      onClick={() => input.current.click()}
      onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); input.current.click() } }}
      role="button"
      tabIndex={0}
      className={`cursor-pointer rounded-md border-2 border-dashed text-center transition-colors duration-100 outline-none focus-visible:ring-2 focus-visible:ring-(--accent-text) focus-visible:ring-offset-2 focus-visible:ring-offset-(--bg) ${compact ? 'p-3' : 'p-6'} ${hover ? 'border-(--accent-text) bg-(--accent)/10' : 'border-(--border) bg-(--field) hover:border-(--muted)'}`}
    >
      <input ref={input} type="file" accept={accept} className="hidden" onChange={event => handleFiles(event.target.files)} />
      <p className="truncate text-sm text-(--text)">{label}</p>
      {!compact && <p className="mt-1 text-xs text-(--muted)">Drag and drop, or click to browse</p>}
    </div>
  )
}
