import { useState } from 'react'
import { unusedTriggerHex } from '../lib/scratchSources'

const STAGES = [
  { id: 'auto', label: 'Auto' },
  { id: 'vertex', label: 'Vertex' },
  { id: 'fragment', label: 'Fragment' },
  { id: 'both', label: 'Both' },
]

const EXAMPLE = {
  name: 'Rainbow wave',
  body: 'apply_rainbow_wave();',
  helpers: `vec3 hsv2rgb(float h, float s, float v) {
    vec3 k = clamp(abs(fract(h + vec3(1.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0);
    return v * mix(vec3(1.0), k, s);
}

void apply_rainbow_wave() {
    float ticks = GameTime * 24000.0;
    gl_Position.y += ProjMat[1][1] * 1.5 * sin(Position.x * 0.45 + ticks * 0.3);
    vertexColor.rgb = hsv2rgb(fract(Position.x * 0.015 - ticks * 0.012), 0.7, 1.0);
}`,
}

const labelText = 'text-xs font-semibold text-(--label)'

function fieldClass(extra = '') {
  return `inset block w-full px-3 py-2.5 text-sm text-(--text) outline-none placeholder:text-(--muted) ${extra}`
}

export default function ScratchEditor({ enabled, effects, active, onRun, onReset, hostError = '' }) {
  const [name, setName] = useState('Scratch effect')
  const [hex, setHex] = useState(() => unusedTriggerHex(effects))
  const [body, setBody] = useState('apply_rainbow();')
  const [helpers, setHelpers] = useState('')
  const [showHelpers, setShowHelpers] = useState(true)
  const [stage, setStage] = useState('auto')
  const [error, setError] = useState('')

  function generateHex() {
    try { setHex(unusedTriggerHex(effects)); setError('') } catch (err) { setError(err.message) }
  }

  function copyHex() {
    navigator.clipboard?.writeText(hex).catch(() => {})
  }

  function loadExample() {
    setName(EXAMPLE.name)
    setBody(EXAMPLE.body)
    setHelpers(EXAMPLE.helpers)
    setShowHelpers(true)
    setStage('auto')
    setError('')
  }

  function run() {
    try { onRun({ name, hex, body, helpers, stage }); setError('') } catch (err) { setError(err.message) }
  }

  if (!enabled) {
    return (
      <p className="text-sm text-(--muted)">
        This pack has no detected text effect configuration, so there is nothing to test custom GLSL against yet.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="space-y-1.5">
          <span className={labelText}>Preview name</span>
          <input type="text" value={name} onChange={event => setName(event.target.value)} className={fieldClass()} />
        </label>
        <label className="space-y-1.5">
          <span className={labelText}>Trigger hex</span>
          <input type="text" value={hex} onChange={event => setHex(event.target.value)} className={fieldClass('font-mono')} />
        </label>
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <button type="button" onClick={generateHex} className="btn shrink-0 px-3.5 py-2.5 text-[13px]">
              New
            </button>
            <button type="button" onClick={copyHex} className="btn shrink-0 px-3.5 py-2.5 text-[13px]">
              Copy
            </button>
          </div>
        </div>
      </div>

      <label className="block space-y-1.5">
        <span className={labelText}>Effect code inside TEXT_EFFECT</span>
        <textarea
          value={body}
          onChange={event => setBody(event.target.value)}
          rows={3}
          spellCheck={false}
          className={fieldClass('resize-y font-mono')}
        />
        <p className="text-xs leading-relaxed text-(--muted)">Call your pack's existing apply functions, such as <code className="text-(--accent-text)">apply_rainbow();</code>. This color temporarily replaces a matching effect in the preview.</p>
      </label>

      <button type="button" onClick={() => setShowHelpers(value => !value)} className="text-xs text-(--accent-text) hover:text-white">
        {showHelpers ? 'Hide' : 'Add'} optional helper functions
      </button>
      {showHelpers && (
        <textarea
          value={helpers}
          onChange={event => setHelpers(event.target.value)}
          rows={2}
          spellCheck={false}
          placeholder="Helper GLSL functions, inserted before TEXT_EFFECT"
          className={fieldClass('resize-y font-mono')}
        />
      )}

      <div>
        <span className={`${labelText} block`}>Runs in</span>
        <div className="mt-2 flex w-fit gap-1 rounded-md border-2 border-(--edge) bg-(--field) p-1 shadow-[0_0_0_1px_var(--border)]" role="radiogroup" aria-label="Shader stage">
          {STAGES.map(option => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={stage === option.id}
              onClick={() => setStage(option.id)}
              className={`rounded-sm px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent-text) ${stage === option.id ? 'bg-(--accent) text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.3),0_2px_0_var(--accent-deep)]' : 'text-(--label) hover:text-white'}`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="mt-2.5 text-xs leading-relaxed text-(--muted)">
          {stage === 'auto' ? 'Auto picks the vertex or fragment shader from what your code uses (vertexColor, gl_Position… or fragColor…).' : stage === 'both' ? 'Compiled in both shaders. Wrap stage-specific code in #ifdef VSH / #ifdef FSH.' : `Only compiled in the ${stage} shader.`}
        </p>
      </div>

      {error && <p className="text-xs text-red-300">{error}</p>}
      {!error && hostError && <p className="text-xs text-red-300">{hostError}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={run}
          className="btn btn-primary px-5 py-2.5 text-sm font-bold"
        >
          Run preview
        </button>
        <button type="button" onClick={loadExample} className="btn px-4 py-2.5 text-sm">
          Load example
        </button>
        {active && (
          <button
            type="button"
            onClick={onReset}
            className="btn px-4 py-2.5 text-sm"
          >
            Use pack shaders
          </button>
        )}
      </div>
    </div>
  )
}
