import { unzipSync } from 'fflate'

const BASE = 'assets/minecraft/shaders/'
const TEXT_EXTENSION = /\.(json|mcmeta|glsl|vsh|fsh)$/i

function range(entry) {
  const value = entry.formats
  if (Array.isArray(value)) return [value[0], value[value.length - 1]]
  if (typeof value === 'number') return [value, value]
  return [value?.min_inclusive ?? entry.min_format ?? 0, value?.max_inclusive ?? entry.max_format ?? Infinity]
}

export function packVersions(meta) {
  const entries = meta.overlays?.entries || []
  const values = entries.map(entry => {
    const [min, max] = range(entry)
    const version = entry.directory.replace(/^overlay_/, '').replaceAll('_', '.')
    return { id: entry.directory, label: `${version}+ · formats ${min} to ${max}`, format: min, directories: entries.filter(value => { const [low, high] = range(value); return min >= low && min <= high }).map(value => value.directory) }
  })
  return [{ id: 'base', label: `Base pack · format ${meta.pack?.pack_format ?? 'default'}`, format: meta.pack?.pack_format ?? 46, directories: [] }, ...values]
}

export function sourceResolver(files, version) {
  return name => {
    let resolved = Object.hasOwn(files, name) ? { path: name, content: files[name] } : null
    for (const directory of version?.directories || []) {
      const candidate = `${directory}/${name}`
      if (Object.hasOwn(files, candidate)) resolved = { path: candidate, content: files[candidate] }
    }
    return resolved
  }
}

function discoverEffectFiles(files, resolve) {
  const names = new Set()
  for (const path of Object.keys(files)) {
    const match = path.match(/(?:^|\/)(assets\/[^/]+\/shaders\/include\/[^/]+\.glsl)$/)
    if (match) names.add(match[1])
  }
  let effectSource = null
  let bestCount = 0
  let effectImplementation = null
  const effectImplementations = []
  for (const name of names) {
    const file = resolve(name)
    if (!file) continue
    const count = (file.content.match(/TEXT_EFFECT\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)\s*\{/g) || []).length
    if (count > bestCount) { bestCount = count; effectSource = file }
    if (/#define\s+TEXT_EFFECT\s*\(/.test(file.content)) {
      effectImplementations.push(file)
      if (!effectImplementation) effectImplementation = file
    }
  }
  return { effectSource, effectImplementation, effectImplementations }
}

export function effectList(source = '') {
  const effects = []
  const pattern = /TEXT_EFFECT\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)\s*\{[ \t]*(?:\/\/[ \t]*([^\r\n]*))?/g
  for (const match of source.matchAll(pattern)) {
    const color = match.slice(1, 4).map(Number)
    if (color.some(value => value < 0 || value > 255)) continue
    const hex = `#${color.map(value => value.toString(16).padStart(2, '0')).join('')}`
    const name = (match[4] || '').replace(/\s*\(?#[a-f\d]{6}\)?/ig, '').replace(/\s*\(For[^)]*\)/ig, '').trim().replaceAll('_', ' ')
    effects.push({ name: name || hex, hex, color, line: source.slice(0, match.index).split('\n').length })
  }
  return effects
}

function pngDataUrl(bytes) {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return `data:image/png;base64,${btoa(binary)}`
}

export async function loadPack(file) {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const entries = unzipSync(bytes, { filter: entry => !entry.name.endsWith('/') && (entry.name === 'pack.png' || TEXT_EXTENSION.test(entry.name)) })
  const files = {}
  for (const [name, data] of Object.entries(entries)) if (name !== 'pack.png') files[name] = new TextDecoder().decode(data)
  const meta = JSON.parse(files['pack.mcmeta'] || '{}')
  const pack = { name: file.name, files, meta, icon: entries['pack.png'] ? pngDataUrl(entries['pack.png']) : '', versions: packVersions(meta) }
  await savePack(pack)
  return pack
}

function database() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('glyphex-packs', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('packs')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function cachedPack() {
  const db = await database()
  try { return await new Promise((resolve, reject) => { const request = db.transaction('packs').objectStore('packs').get('pack'); request.onsuccess = () => resolve(request.result || null); request.onerror = () => reject(request.error) }) } finally { db.close() }
}

async function savePack(pack) {
  let db
  try {
    db = await database()
    await new Promise((resolve, reject) => { const transaction = db.transaction('packs', 'readwrite'); transaction.objectStore('packs').put(pack, 'pack'); transaction.oncomplete = resolve; transaction.onerror = () => reject(transaction.error); transaction.onabort = () => reject(transaction.error) })
  } catch { return } finally { db?.close() }
}

export async function clearPack() {
  let db
  try {
    db = await database()
    await new Promise((resolve, reject) => { const transaction = db.transaction('packs', 'readwrite'); transaction.objectStore('packs').delete('pack'); transaction.oncomplete = resolve; transaction.onerror = () => reject(transaction.error); transaction.onabort = () => reject(transaction.error) })
  } catch { return } finally { db?.close() }
}

export function selectedSources(pack, version) {
  const resolve = sourceResolver(pack.files, version)
  const vertex = resolve(`${BASE}core/rendertype_text.vsh`)
  const fragment = resolve(`${BASE}core/rendertype_text.fsh`)
  if (!vertex || !fragment) throw new Error('This pack does not contain the rendertype_text vertex and fragment shaders.')
  let configuration = {}
  const json = resolve(`${BASE}core/rendertype_text.json`)
  if (json) configuration = JSON.parse(json.content)
  const { effectSource, effectImplementation, effectImplementations } = discoverEffectFiles(pack.files, resolve)
  return { resolve, vertex, fragment, configuration, effectSource, effectImplementation, effectImplementations, effects: effectList(effectSource?.content) }
}
