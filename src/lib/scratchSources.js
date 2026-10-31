import { hexColor } from './legacyText'
import { colorKey, specializeEffects } from './shaderVariants'

const EFFECT = 'assets/minecraft/shaders/include/preview_scratch_effect.glsl'
const HELPERS = 'assets/minecraft/shaders/include/preview_scratch_helpers.glsl'

export function unusedTriggerHex(effects, preferred = '') {
  const used = new Set(effects.map(effect => colorKey(effect.hex)))
  const normalized = `#${preferred.replace(/^#/, '').toLowerCase()}`
  if (/^#[a-f\d]{6}$/.test(normalized) && !used.has(colorKey(normalized))) return normalized
  for (let attempt = 0; attempt < 100000; attempt++) {
    const hex = `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`
    if (!used.has(colorKey(hex))) return hex
  }
  throw new Error('Could not find an unused color slot for the scratch effect.')
}

function importClosure(root, resolve) {
  const seen = new Set()
  const visit = file => {
    if (!file || seen.has(file.path)) return
    seen.add(file.path)
    for (const match of file.content.matchAll(/^\s*#moj_import\s*(?:<([^>]+)>|"([^"]+)")/gm)) {
      const name = match[1] || match[2]
      const [namespace, resource] = name.includes(':') ? name.split(':') : ['minecraft', name]
      const candidates = match[2] ? [`${file.path.slice(0, file.path.lastIndexOf('/') + 1)}${resource}`] : []
      candidates.push(`assets/${namespace}/shaders/include/${resource}`)
      for (const candidate of candidates) {
        const found = resolve(candidate)
        if (found) { visit(found); break }
      }
    }
  }
  visit(root)
  return seen
}

// Which shader stage the scratch code belongs to: 'VSH', 'FSH', or null for both.
export function scratchStage(draft) {
  if (draft.stage === 'vertex') return 'VSH'
  if (draft.stage === 'fragment') return 'FSH'
  if (draft.stage === 'both') return null
  const code = `${draft.helpers || ''}\n${draft.body || ''}`
  const vertex = /\b(vertexColor|gl_Position|Position)\b/.test(code)
  const fragment = /\b(fragColor|texCoord0|discard)\b/.test(code)
  if (vertex && !fragment) return 'VSH'
  if (fragment && !vertex) return 'FSH'
  return null
}

export function scratchBlock(draft) {
  const color = hexColor(draft.hex)
  if (!color) throw new Error('Enter a six-digit hex color for your scratch effect.')
  if (!draft.body.trim()) throw new Error('Enter effect code before running the preview.')
  if (draft.body.length > 32000 || draft.helpers.length > 64000) throw new Error('Scratch code exceeds the editor size limit.')
  return `TEXT_EFFECT(${color.map(value => Math.round(value * 255)).join(', ')}) {\n${draft.body}\n}\n`
}

export function scratchSources(sources, draft) {
  const block = scratchBlock(draft)
  const guard = scratchStage(draft)
  const guarded = text => (guard ? `#ifdef ${guard}\n${text}\n#endif\n` : text)
  if (!sources.effectSource) throw new Error('This pack does not have a text effect configuration to test scratch code against.')
  const hex = `#${draft.hex.replace(/^#/, '').toLowerCase()}`
  const key = colorKey(hex)
  const effects = sources.effects.filter(effect => colorKey(effect.hex) !== key)
  const effectContent = specializeEffects(sources.effectSource.content, effects.map(effect => colorKey(effect.hex))) + `\n#moj_import <preview_scratch_effect.glsl>\n`
  const patched = new Map()
  if (draft.helpers.trim()) {
    const candidates = sources.effectImplementations?.length ? sources.effectImplementations : sources.effectImplementation ? [sources.effectImplementation] : []
    if (!candidates.length) throw new Error('This pack does not contain the text effect helper implementation.')
    // Put the helpers in the implementation file(s) that the shader running the effect actually imports.
    const reachable = new Set()
    for (const root of [sources.vertex, sources.fragment]) {
      const closure = importClosure(root, sources.resolve)
      if (closure.has(sources.effectSource.path)) closure.forEach(path => reachable.add(path))
    }
    let targets = candidates.filter(file => reachable.has(file.path))
    if (!targets.length) targets = [candidates[0]]
    const insertion = /^[ \t]*\n(?=[ \t]*#define[ \t]+TEXT_EFFECT\b)/m
    for (const file of targets) {
      const content = file.content.replace(/\r+\n/g, '\n').replace(/\r/g, '\n')
      if (insertion.test(content)) patched.set(file.path, content.replace(insertion, '#moj_import <preview_scratch_helpers.glsl>\n'))
    }
    if (!patched.size) throw new Error('This pack has no helper insertion point before TEXT_EFFECT. Test using the existing apply functions instead.')
  }
  const resolve = path => {
    if (path === EFFECT) return { path: 'scratch/effect.glsl', content: guarded(block.replace('\n', '\n#line 1\n')) }
    if (path === HELPERS) return { path: 'scratch/helpers.glsl', content: guard ? `#ifdef ${guard}\n#line 1\n${draft.helpers}\n#endif\n` : draft.helpers }
    const file = sources.resolve(path)
    if (file?.path === sources.effectSource.path) return { ...file, content: effectContent }
    if (file && patched.has(file.path)) return { ...file, content: patched.get(file.path) }
    return file
  }
  return { ...sources, resolve, effects: [...effects, { name: draft.name.trim() || 'Scratch effect', hex, color: hexColor(hex).map(value => Math.round(value * 255)), line: 1, scratch: true }] }
}
