import { useEffect, useMemo, useState } from 'react'
import Dropzone from './components/Dropzone'
import PreviewCanvas from './components/PreviewCanvas'
import Tile from './components/Tile'
import Toggle from './components/Toggle'
import Slider from './components/Slider'
import Select from './components/Select'
import Stepper from './components/Stepper'
import ScratchEditor from './components/ScratchEditor'
import Clouds from './components/Clouds'
import { ColorPickerIcon, CoffeeIcon, GithubIcon } from './components/icons'
import { loadPack, selectedSources, cachedPack, clearPack } from './lib/pack'
import { fallbackFont, emptyFont, importFont, cachedFont, clearFont } from './lib/fontAtlas'
import { hexColor } from './lib/legacyText'
import { scratchSources } from './lib/scratchSources'
import { BACKGROUNDS } from './lib/backgrounds'

const YEAR = new Date().getFullYear()

const labelClass = 'section-label mb-2 block'

function fieldClass(extra = '') {
  return `inset block w-full px-3 py-2.5 text-sm text-(--text) outline-none placeholder:text-(--muted) ${extra}`
}

function toggleButtonClass(active) {
  return `${active ? 'btn btn-primary' : 'btn'} px-3 py-2.5 text-[13px]`
}

const TABS = [
  { id: 'text', label: 'Effects' },
  { id: 'style', label: 'Display & Style' },
  { id: 'pack', label: 'Pack & Font' },
]

function friendlyName(name) {
  if (name !== name.toUpperCase() || !/[A-Z]/.test(name)) return name
  return name.toLowerCase().replace(/(^|\s)\S/g, letter => letter.toUpperCase())
}

const TITLES = { text: 'Effects & Text', style: 'Display & Style', pack: 'Pack & Font' }

export default function App() {
  const [pack, setPack] = useState(null)
  const [packError, setPackError] = useState('')
  const [version, setVersion] = useState(null)
  const [bundledAtlas] = useState(fallbackFont)
  const [emptyAtlas] = useState(emptyFont)
  const [customAtlas, setCustomAtlas] = useState(null)
  const [useBundled, setUseBundled] = useState(true)
  const [fontError, setFontError] = useState('')
  const [shaderError, setShaderError] = useState('')
  const [text, setText] = useState('Glyphex preview')
  const [hex, setHex] = useState('#ffffff')
  const [effectHex, setEffectHex] = useState('')
  const [scale, setScale] = useState(4)
  const [speed, setSpeed] = useState(1)
  const [paused, setPaused] = useState(false)
  const [background, setBackground] = useState('checker')
  const [bgColor, setBgColor] = useState('#17171a')
  const [bgDim, setBgDim] = useState(0)
  const [bgImage, setBgImage] = useState('')
  const [bold, setBold] = useState(false)
  const [italic, setItalic] = useState(false)
  const [grid, setGrid] = useState(false)
  const [boxes, setBoxes] = useState(false)
  const [boxCount, setBoxCount] = useState(12)
  const [boxRows, setBoxRows] = useState(1)
  const [loadKey, setLoadKey] = useState(0)
  const [step, setStep] = useState(0)
  const [scratch, setScratch] = useState(null)
  const [scratchExpanded, setScratchExpanded] = useState(true)
  const [activeTab, setActiveTab] = useState('text')

  const atlas = useBundled ? bundledAtlas : customAtlas || emptyAtlas
  const activeFontName = useBundled ? 'Bundled pixel font' : customAtlas?.name || ''

  useEffect(() => { cachedFont().then(font => { if (font) { setCustomAtlas(font); setUseBundled(false) } }).catch(() => {}) }, [])
  useEffect(() => { cachedPack().then(loaded => { if (loaded) { setPack(loaded); setVersion(loaded.versions[0]) } }).catch(() => {}) }, [])

  const { sources, sourceError } = useMemo(() => {
    if (!pack || !version) return { sources: null, sourceError: '' }
    try { return { sources: selectedSources(pack, version), sourceError: '' } } catch (error) { return { sources: null, sourceError: error.message } }
  }, [pack, version])

  const { previewSources, scratchError } = useMemo(() => {
    if (!sources) return { previewSources: null, scratchError: '' }
    if (!scratch) return { previewSources: sources, scratchError: '' }
    try { return { previewSources: scratchSources(sources, scratch), scratchError: '' } } catch (error) { return { previewSources: sources, scratchError: error.message } }
  }, [sources, scratch])

  const effects = previewSources?.effects || []
  const scratchActive = Boolean(scratch) && !scratchError

  useEffect(() => {
    function onKey(event) {
      if (event.code !== 'Space') return
      const tag = event.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || event.target.isContentEditable) return
      event.preventDefault()
      setPaused(value => !value)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const stop = event => { if (event.dataTransfer?.types?.includes('Files')) event.preventDefault() }
    window.addEventListener('dragover', stop)
    window.addEventListener('drop', stop)
    return () => { window.removeEventListener('dragover', stop); window.removeEventListener('drop', stop) }
  }, [])

  const activeColor = effectHex || hex
  const backgroundLabel = bgImage ? 'Custom image' : background === 'custom' ? `Custom ${bgColor}` : BACKGROUNDS.find(item => item.id === background)?.label
  const error = packError || sourceError || fontError || scratchError || shaderError
  const webglBroken = /webgl|context/i.test(shaderError)

  async function handlePack(file) {
    try {
      const loaded = await loadPack(file)
      setPack(loaded)
      setVersion(loaded.versions[0])
      setPackError('')
      setEffectHex('')
      setShaderError('')
      setActiveTab('text')
    } catch (error) { setPackError(error.message) }
  }

  function reloadPreview() { setLoadKey(value => value + 1); setShaderError('') }

  function removePack() {
    setPack(null)
    setVersion(null)
    setPackError('')
    clearPack().catch(() => {})
  }

  async function handleFont(file) {
    try { setCustomAtlas(await importFont(file)); setUseBundled(false); setFontError('') } catch (error) { setFontError(error.message) }
  }

  function resetFont() {
    setCustomAtlas(null)
    setUseBundled(true)
    clearFont().catch(() => {})
  }

  function runScratch(draft) {
    setScratch(draft)
    setEffectHex(draft.hex)
    setShaderError('')
  }

  function resetScratch() {
    setScratch(null)
    setEffectHex('')
  }

  function handleBackgroundImage(file) {
    const reader = new FileReader()
    reader.onload = () => setBgImage(typeof reader.result === 'string' ? reader.result : '')
    reader.readAsDataURL(file)
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="hero-band" aria-hidden="true" />
      <div className="hero-sky" aria-hidden="true" />
      <Clouds />

      <div className="relative mx-auto max-w-280 px-4 pb-14 sm:px-6">
        <header className="mt-2 flex flex-wrap items-center gap-x-3.5 gap-y-3 rounded-lg border-2 border-(--edge) bg-[#10131a] px-4.5 py-3 shadow-[0_0_0_1px_var(--border)]">
          <div className="grid h-8.5 min-w-11.5 shrink-0 place-items-center rounded-md bg-(--accent) px-2 font-pixel text-[14px] font-bold leading-none tracking-[0.06em] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.3),0_3px_0_var(--accent-deep)] [text-shadow:1px_1px_0_var(--accent-deep)]" aria-hidden="true">
            GLX
          </div>
          <span className="font-pixel text-[22px] font-bold tracking-[0.03em] text-white [text-shadow:0_2px_0_#1a2a6b]"><span className="text-[#a8b6ff]">Gl</span>yphe<span className="text-[#a8b6ff]">x</span></span>
          <div className="flex-1" />
          <label
            title="Click to load a resource pack (.zip)"
            className="inset flex cursor-pointer items-center gap-3 whitespace-nowrap py-1.25 pl-1.25 pr-1.5 max-sm:order-2"
          >
            <input
              type="file"
              accept=".zip"
              className="sr-only"
              onChange={event => { const file = event.target.files?.[0]; if (file) handlePack(file); event.target.value = '' }}
            />
            {pack?.icon ? (
              <img src={pack.icon} alt="" width="32" height="32" className="block rounded-sm bg-black [image-rendering:pixelated]" />
            ) : (
              <div className="grid size-8 place-items-center rounded-sm bg-[#2fa84a] shadow-[inset_0_1px_0_rgb(255_255_255/0.35),inset_0_-3px_0_#1c6b2f]" aria-hidden="true">
                <div className="size-3 bg-[#d9ffe1] shadow-[inset_-3px_-3px_0_#8fd9a2]" />
              </div>
            )}
            <div className="flex flex-col leading-tight">
              <span className="max-w-37.5 truncate font-mono text-[13px] font-semibold text-[#f2f4fa] sm:max-w-60">{pack ? pack.name : 'Load resource pack'}</span>
              <span className="text-[11px] text-(--muted)">{pack ? 'Resource pack · loaded' : 'Click to load a pack (.zip)'}</span>
            </div>
            {pack && (
              <span className="mr-0.5 rounded-sm bg-[#17204a] px-1.75 py-1 font-pixel text-[10px] font-bold tracking-[0.12em] text-(--accent-text)">
                FORMAT {version?.format ?? pack.meta?.pack?.pack_format ?? '?'}
              </span>
            )}
          </label>
          <button type="button" onClick={() => setPaused(value => !value)} className="btn px-3.5 py-2.25 text-[13px] max-sm:order-2">
            {paused ? 'Play' : 'Pause'}<span className="hidden sm:inline"> · Space</span>
          </button>
          <a
            href="https://ko-fi.com/abhixd"
            target="_blank"
            rel="noreferrer"
            title="Support Glyphex on Ko-fi"
            aria-label="Support Glyphex on Ko-fi"
            className="btn inline-flex h-9.5 items-center gap-2 px-3 text-[13px] no-underline"
          >
            <CoffeeIcon className="size-5.5 text-[#ff7b78]" />
            <span className="hidden sm:inline">Support</span>
          </a>
          <a
            href="https://github.com/abhixdd/glyphex"
            target="_blank"
            rel="noreferrer"
            title="Glyphex on GitHub"
            aria-label="Glyphex on GitHub"
            className="btn btn-primary inline-flex h-9.5 w-10 items-center justify-center no-underline"
          >
            <GithubIcon className="size-5" />
          </a>
        </header>

        <div className="pb-6.5 pt-9 sm:pt-11">
          <div className="mb-3.5 flex gap-2.5 text-[13px] text-[#dbe4ff]">
            <span>Minecraft Tools</span><span aria-hidden="true">›</span><span>Text shader preview</span>
          </div>
          <h1 className="m-0 font-pixel text-[34px] font-bold leading-[1.1] tracking-[0.01em] text-white [text-shadow:0_3px_0_#1a2a6b] sm:text-[46px]">
            Glyphex Preview
          </h1>
          <p className="mt-1.5 max-w-160 text-sm text-[#e3eaff]">
            Try your pack's text effects and write scratch GLSL, with a live preview of exactly how it renders in game.
          </p>
        </div>

        <main className="flex flex-col items-start gap-6 lg:flex-row">
          <div className="flex w-full min-w-0 flex-col gap-6 lg:flex-[1_1_560px]">
          <Tile
            title="Preview"
            trailing={
              <div className="flex items-center gap-2.5">
                {scratchActive && (
                  <span className="text-xs font-semibold text-(--live)">Scratch active</span>
                )}
                <button type="button" onClick={reloadPreview} className="btn px-3.5 py-1.5 text-xs">
                  Reload
                </button>
              </div>
            }
          >
            {!sources && (
              <div className="animate-fade-up">
                <Dropzone
                  large
                  label="Drop a resource pack (.zip) here"
                  accept=".zip"
                  onFile={handlePack}
                  hint={<>Requires <code className="break-words rounded bg-black/30 px-1 py-0.5 text-xs text-(--text) sm:whitespace-nowrap">assets/<wbr />minecraft/<wbr />shaders/<wbr />core/<wbr />rendertype_text.vsh</code> and <code className="whitespace-nowrap rounded bg-black/30 px-1 py-0.5 text-xs text-(--text)">.fsh</code></>}
                />
              </div>
            )}

            {sources && (
              <div className="animate-fade-up">
                <div className="inset overflow-hidden">
                  <div className="max-h-100 overflow-y-auto">
                    <PreviewCanvas
                      key={loadKey}
                      sources={previewSources}
                      atlas={atlas}
                      text={text}
                      color={hexColor(activeColor) ? activeColor : '#ffffff'}
                      scale={scale}
                      speed={speed}
                      paused={paused}
                      background={background}
                      bgColor={bgColor}
                      bgImage={bgImage}
                      bgDim={bgDim}
                      bold={bold}
                      italic={italic}
                      effects={grid ? effects : null}
                      boxes={boxes}
                      boxCount={boxCount}
                      boxRows={boxRows}
                      step={step}
                      onError={setShaderError}
                    />
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2.5">
                  <button
                    type="button"
                    onClick={() => setPaused(value => !value)}
                    aria-label={paused ? 'Resume animation' : 'Pause animation'}
                    className="btn btn-primary px-4 py-2 text-[13px] font-bold"
                  >
                    {paused ? 'Play' : 'Pause'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(value => value + 1)}
                    disabled={!paused && speed !== 0}
                    aria-label="Advance one animation tick"
                    className="btn px-4 py-2 text-[13px]"
                  >
                    Step
                  </button>
                  <div className="flex-1" />
                  <span className="text-xs text-(--muted)">Scale</span>
                  <div className="w-27.5"><Slider value={scale} min={1} max={10} step={1} onChange={setScale} label="Preview scale" /></div>
                  <span className="w-6 font-mono text-xs">{scale}×</span>
                  <span className="text-xs text-(--muted)">Speed</span>
                  <div className="w-27.5"><Slider value={speed} min={0} max={3} step={0.1} onChange={setSpeed} label="Animation speed" /></div>
                  <span className="w-8 font-mono text-xs">{speed.toFixed(1)}×</span>
                </div>
              </div>
            )}
          </Tile>

          <Tile
            title="Scratch GLSL"
            trailing={
              <button
                type="button"
                onClick={() => setScratchExpanded(value => !value)}
                aria-expanded={scratchExpanded}
                className="btn px-3.5 py-1.5 text-xs"
              >
                {scratchExpanded ? 'Minimize' : 'Expand'}
              </button>
            }
          >
            {scratchExpanded && (
              <ScratchEditor
                enabled={Boolean(sources?.effectSource)}
                effects={sources?.effects || []}
                active={scratchActive}
                hostError={scratchError}
                onRun={runScratch}
                onReset={resetScratch}
              />
            )}
          </Tile>
        </div>

        <Tile className="w-full lg:sticky lg:top-6 lg:max-w-105 lg:flex-[1_1_340px]" bodyClassName="gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="section-label">{TITLES[activeTab]}</span>
            <div role="tablist" aria-label="Controls" className="flex gap-1 rounded-md border-2 border-(--edge) bg-(--field) p-1 shadow-[0_0_0_1px_var(--border)]">
              {TABS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  id={`tab-${id}`}
                  aria-selected={activeTab === id}
                  aria-controls={`panel-${id}`}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-sm px-3 py-1.75 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent-text) ${activeTab === id ? 'bg-(--accent) text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.3),0_2px_0_var(--accent-deep)]' : 'text-(--label) hover:text-white'}`}
                >
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'text' && (
            <div role="tabpanel" id="panel-text" aria-labelledby="tab-text" className="animate-fade-in flex flex-col gap-3.5">
              <div className="flex flex-col gap-2.5 rounded-md border-2 border-(--edge) bg-(--toolbar) p-2.5 shadow-[0_0_0_1px_var(--border)]">
                {effects.length > 0 && (
                  <div className="flex items-center gap-3">
                    <Select
                      className="min-w-0 flex-1"
                      label="Effect"
                      value={effectHex}
                      onChange={value => {
                        setEffectHex(value)
                        setGrid(false)
                      }}
                      options={[{ value: '', label: 'Custom color' }, ...effects.map(effect => ({ value: effect.hex, label: friendlyName(effect.name) }))]}
                    />
                    <span className="shrink-0 text-xs text-(--muted)">{effects.length} found</span>
                  </div>
                )}
                <div className="flex items-center gap-2.5">
                  <button type="button" aria-label="Bold" aria-pressed={bold} onClick={() => setBold(value => !value)} className={`${bold ? 'btn btn-primary' : 'btn'} h-9 w-10 shrink-0 text-[15px] font-bold`}>B</button>
                  <button type="button" aria-label="Italic" aria-pressed={italic} onClick={() => setItalic(value => !value)} className={`${italic ? 'btn btn-primary' : 'btn'} h-9 w-10 shrink-0 text-[15px] font-bold italic`}>I</button>
                  {!effectHex && (
                    <label className="inset flex min-w-0 flex-1 items-center gap-2.5 px-2.5 py-1.25">
                      <input
                        type="color"
                        aria-label="Pick color"
                        value={/^#[0-9a-f]{6}$/i.test(hex) ? hex : '#ffffff'}
                        onChange={event => setHex(event.target.value)}
                        className="size-6 shrink-0 cursor-pointer border-0 bg-transparent p-0"
                      />
                      <input
                        type="text"
                        aria-label="Hex color"
                        value={hex}
                        spellCheck={false}
                        onChange={event => setHex(event.target.value)}
                        placeholder="#ffffff"
                        className="min-w-0 flex-1 bg-transparent font-mono text-[13px] text-(--text) outline-none placeholder:text-(--muted)"
                      />
                    </label>
                  )}
                </div>
              </div>

              {effects.length > 0 && (
                <button type="button" aria-pressed={grid} onClick={() => setGrid(value => !value)} className={`${toggleButtonClass(grid)} w-full`}>
                  All effects · {effects.length}
                </button>
              )}

              <label htmlFor="preview-text-input" className="sr-only">Text</label>
              <textarea
                id="preview-text-input"
                value={text}
                onChange={event => setText(event.target.value)}
                rows={3}
                spellCheck={false}
                className={fieldClass('min-h-22 resize-y p-3.5 font-mono')}
              />
              <span className="text-xs text-(--muted)">Supports &amp;0–&amp;f, &amp;l bold, &amp;o italic, &amp;r reset, and &amp;#rrggbb.</span>

              <div className="flex flex-wrap items-center gap-2.5">
                <span className="mr-1 text-xs text-(--muted)">Presets</span>
                <button type="button" onClick={() => setText('&8[&#aca02c&lABHI&r&8] &fWelcome')} className="btn px-3.5 py-2 text-xs">Sample Name</button>
                <button type="button" onClick={() => setText('ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz\n0123456789 !@#$%^&*()')} className="btn px-3.5 py-2 text-xs">Alphabet</button>
                <button type="button" onClick={() => setText('Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.')} className="btn px-3.5 py-2 text-xs">Lorem</button>
              </div>
            </div>
          )}

          {activeTab === 'style' && (
            <div role="tabpanel" id="panel-style" aria-labelledby="tab-style" className="animate-fade-in flex flex-col gap-5">
              <div>
                <span className={labelClass}>Preview Style</span>
                <div className="grid grid-cols-2 gap-2.5">
                  <button type="button" onClick={() => setBoxes(false)} className={toggleButtonClass(!boxes)}>Text</button>
                  <button type="button" onClick={() => setBoxes(true)} className={toggleButtonClass(boxes)}>Color boxes</button>
                </div>
                {boxes && (
                  <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-(--label)">Per line</span>
                      <Stepper value={boxCount} min={1} max={64} step={1} onChange={setBoxCount} label="Boxes per line" />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-(--label)">Lines</span>
                      <Stepper value={boxRows} min={1} max={16} step={1} onChange={setBoxRows} label="Box lines" />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="section-label">Background</span>
                  <span className="text-xs text-(--muted)">{backgroundLabel}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  {BACKGROUNDS.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => { setBackground(item.id); setBgImage('') }}
                      title={item.label}
                      aria-label={item.label}
                      className={`size-8 rounded-[5px] border-2 border-(--edge) transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent-text) ${background === item.id && !bgImage ? 'shadow-[0_0_0_2px_var(--accent-text)]' : 'shadow-[0_0_0_1px_var(--border)] hover:shadow-[0_0_0_1px_var(--muted)]'}`}
                      style={item.style}
                    />
                  ))}
                  <label
                    title="Custom color"
                    className={`relative size-8 cursor-pointer overflow-hidden rounded-[5px] border-2 border-(--edge) transition-shadow focus-within:ring-2 focus-within:ring-(--accent-text) ${background === 'custom' && !bgImage ? 'shadow-[0_0_0_2px_var(--accent-text)]' : 'shadow-[0_0_0_1px_var(--border)] hover:shadow-[0_0_0_1px_var(--muted)]'}`}
                    style={{ backgroundColor: bgColor }}
                  >
                    <ColorPickerIcon className="pointer-events-none absolute left-1/2 top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 text-(--muted)" />
                    <input
                      type="color"
                      value={bgColor}
                      aria-label="Custom background color"
                      onChange={event => { setBgColor(event.target.value); setBackground('custom'); setBgImage('') }}
                      className="absolute inset-0 size-full cursor-pointer opacity-0"
                    />
                  </label>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-xs text-(--label)">Dimming</span>
                  <span className="font-mono text-xs">{Math.round(bgDim * 100)}%</span>
                </div>
                <Slider value={bgDim} min={0} max={0.9} step={0.05} onChange={setBgDim} label="Background dimming" />

                <div className="mt-3">
                  {bgImage ? (
                    <div className="inset flex items-center gap-2 p-1.5">
                      <span className="size-8 shrink-0 rounded-sm bg-cover bg-center" style={{ backgroundImage: `url("${bgImage}")` }} />
                      <span className="min-w-0 flex-1 truncate text-xs text-(--muted)">Custom image</span>
                      <button type="button" onClick={() => setBgImage('')} className="btn btn-danger shrink-0 px-3 py-1.5 text-xs">
                        Clear
                      </button>
                    </div>
                  ) : (
                    <Dropzone label="Drop a background image" accept="image/*" onFile={handleBackgroundImage} compact />
                  )}
                </div>
              </div>

              <div>
                <span className={labelClass}>Fine Adjustments</span>
                <div className="space-y-2.5">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-(--label)">Scale</span>
                      <span className="font-mono text-xs">{scale}×</span>
                    </div>
                    <Slider value={scale} min={1} max={10} step={1} onChange={setScale} label="Preview scale" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-(--label)">Speed</span>
                      <span className="font-mono text-xs">{speed.toFixed(1)}×</span>
                    </div>
                    <Slider value={speed} min={0} max={3} step={0.1} onChange={setSpeed} label="Animation speed" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pack' && (
            <div role="tabpanel" id="panel-pack" aria-labelledby="tab-pack" className="animate-fade-in flex flex-col gap-5">
              <div>
                <span className={labelClass}>Resource Pack</span>
                <Dropzone label={pack ? pack.name : 'Drop a resource pack .zip'} accept=".zip" onFile={handlePack} compact />
                {pack && version && (
                  <Select
                    className="mt-2.5"
                    label="Pack version"
                    value={version.id}
                    onChange={id => { setVersion(pack.versions.find(item => item.id === id)); setShaderError('') }}
                    options={pack.versions.map(item => ({ value: item.id, label: item.label }))}
                  />
                )}
                {pack && (
                  <button type="button" onClick={removePack} className="btn btn-danger mt-3 w-full px-3 py-2 text-xs">
                    Remove pack
                  </button>
                )}
              </div>

              <div>
                <span className={labelClass}>Font Atlas</span>
                <Dropzone label={activeFontName || 'Drop a font .jar or .png'} accept=".png,.jar" onFile={handleFont} compact />
                <div className="inset mt-2.5 flex items-center justify-between px-3 py-2">
                  <span className="text-sm text-(--text)">Bundled pixel font</span>
                  <Toggle checked={useBundled} onChange={setUseBundled} label="Toggle bundled pixel font" />
                </div>
                {customAtlas && (
                  <button type="button" onClick={resetFont} className="btn mt-3 px-3 py-2 text-xs">
                    Reset to bundled font
                  </button>
                )}
                {!activeFontName && (
                  <p className="mt-2 text-xs text-(--muted)">No font selected. Import a client .jar or ascii.png to preview text.</p>
                )}
              </div>
            </div>
          )}
        </Tile>
        </main>

        <footer className="mt-12">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-lg border-2 border-(--edge) bg-[#10131a] px-4.5 py-3 shadow-[0_0_0_1px_var(--border)]">
            <div className="grid h-7 min-w-9.5 place-items-center rounded-[5px] bg-(--accent) px-1.5 font-pixel text-[11px] font-bold leading-none tracking-[0.06em] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.3),0_2px_0_var(--accent-deep)] [text-shadow:1px_1px_0_var(--accent-deep)]" aria-hidden="true">GLX</div>
            <div className="flex flex-col leading-tight">
              <span className="font-pixel text-base font-bold tracking-[0.03em]">Glyphex</span>
              <span className="text-xs text-(--muted)">Minecraft text shader preview</span>
            </div>
            <div className="flex-1" />
            <span className="text-[13px] text-(--muted)">Made by <a href="https://github.com/abhixdd" target="_blank" rel="noreferrer" className="font-semibold text-(--text) underline-offset-2 hover:text-(--accent-text) hover:underline">ABHI</a></span>
            <a href="https://ko-fi.com/abhixd" target="_blank" rel="noreferrer" className="btn inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-bold no-underline">
              <CoffeeIcon className="size-4 text-[#ff7b78]" />
              Support on Ko-fi
            </a>
            <a href="https://github.com/abhixdd/glyphex" target="_blank" rel="noreferrer" className="btn btn-primary inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-bold no-underline">
              <GithubIcon className="size-4" />
              Source on GitHub
            </a>
          </div>
          <p className="mt-4 text-center text-xs leading-relaxed text-(--muted)">
            © {YEAR} ABHI · Unofficial fan tool, not affiliated with Mojang or Microsoft · Open source under{' '}
            <a href="https://github.com/abhixdd/glyphex" target="_blank" rel="noreferrer" className="text-(--accent-text) underline-offset-2 hover:text-white hover:underline">AGPL-3.0</a>
          </p>
        </footer>
      </div>

      {error && (
        <div role="alert" className="animate-fade-up panel fixed bottom-4 left-1/2 z-40 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-col gap-2 px-4 py-3 text-sm text-red-300 sm:bottom-6 sm:max-w-xl">
          <div className="flex items-center gap-3">
            <span className="whitespace-pre-wrap">{error}</span>
            {shaderError && (
              <button type="button" onClick={reloadPreview} className="btn shrink-0 px-3 py-1.5 text-xs">
                Reload
              </button>
            )}
          </div>
          {/scratch\//.test(error) && (
            <p className="text-xs leading-relaxed text-(--label)">
              Pick the shader your code is for under <strong className="text-white">Runs in</strong> in the Scratch GLSL panel, or wrap stage-specific code in <code className="text-white">#ifdef VSH … #endif</code> / <code className="text-white">#ifdef FSH … #endif</code>.
            </p>
          )}
          {webglBroken && (
            <p className="text-xs text-red-300/70">
              If reloading doesn't help, try fully closing and reopening your browser (not just this tab) — some GPU driver issues only clear on a full restart.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
