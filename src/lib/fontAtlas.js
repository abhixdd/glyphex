import { unzipSync } from 'fflate'

const ASCII = Array.from({ length: 16 }, (_, y) => Array.from({ length: 16 }, (_, x) => String.fromCharCode(y * 16 + x)).join(''))
const PIXELS = {
  A: '01110/10001/10001/11111/10001/10001/10001', B: '11110/10001/10001/11110/10001/10001/11110', C: '01111/10000/10000/10000/10000/10000/01111', D: '11110/10001/10001/10001/10001/10001/11110', E: '11111/10000/10000/11110/10000/10000/11111', F: '11111/10000/10000/11110/10000/10000/10000', G: '01111/10000/10000/10111/10001/10001/01111', H: '10001/10001/10001/11111/10001/10001/10001', I: '11111/00100/00100/00100/00100/00100/11111', J: '00111/00010/00010/00010/10010/10010/01100', K: '10001/10010/10100/11000/10100/10010/10001', L: '10000/10000/10000/10000/10000/10000/11111', M: '10001/11011/10101/10101/10001/10001/10001', N: '10001/11001/10101/10011/10001/10001/10001', O: '01110/10001/10001/10001/10001/10001/01110', P: '11110/10001/10001/11110/10000/10000/10000', Q: '01110/10001/10001/10001/10101/10010/01101', R: '11110/10001/10001/11110/10100/10010/10001', S: '01111/10000/10000/01110/00001/00001/11110', T: '11111/00100/00100/00100/00100/00100/00100', U: '10001/10001/10001/10001/10001/10001/01110', V: '10001/10001/10001/10001/10001/01010/00100', W: '10001/10001/10001/10101/10101/10101/01010', X: '10001/10001/01010/00100/01010/10001/10001', Y: '10001/10001/01010/00100/00100/00100/00100', Z: '11111/00001/00010/00100/01000/10000/11111', '?': '01110/10001/00001/00010/00100/00000/00100', '0': '01110/10001/10011/10101/11001/10001/01110', '1': '00100/01100/00100/00100/00100/00100/01110', '2': '01110/10001/00001/00010/00100/01000/11111', '3': '11110/00001/00001/01110/00001/00001/11110', '4': '00010/00110/01010/10010/11111/00010/00010', '5': '11111/10000/10000/11110/00001/00001/11110', '6': '01110/10000/10000/11110/10001/10001/01110', '7': '11111/00001/00010/00100/01000/01000/01000', '8': '01110/10001/10001/01110/10001/10001/01110', '9': '01110/10001/10001/01111/00001/00001/01110', '[': '01110/01000/01000/01000/01000/01000/01110', ']': '01110/00010/00010/00010/00010/00010/01110', '.': '00000/00000/00000/00000/00000/00100/00100', '-': '00000/00000/00000/11111/00000/00000/00000', ' ': '00000/00000/00000/00000/00000/00000/00000', '#': '01010/01010/11111/01010/11111/01010/01010', ':': '00000/00100/00100/00000/00100/00100/00000', '/': '00001/00010/00010/00100/01000/01000/10000', '!': '00100/00100/00100/00100/00100/00000/00100', '&': '01100/10010/10100/01000/10101/10010/01101', '(': '00010/00100/01000/01000/01000/00100/00010', ')': '01000/00100/00010/00010/00010/00100/01000', '_': '00000/00000/00000/00000/00000/00000/11111', '+': '00000/00100/00100/11111/00100/00100/00000', ',': '00000/00000/00000/00000/00100/00100/01000', "'": '00100/00100/00000/00000/00000/00000/00000', '=': '00000/00000/11111/00000/11111/00000/00000',
}

function canvas(width, height) {
  const element = document.createElement('canvas')
  element.width = width
  element.height = height
  return element
}

function buildAtlas(image, rows, height = 8, ascent = 7) {
  const input = image.getContext('2d').getImageData(0, 0, image.width, image.height)
  const output = canvas(256, 256)
  const context = output.getContext('2d')
  context.imageSmoothingEnabled = false
  const glyphs = {}
  const columns = Array.from(rows[0] || '').length
  if (!columns || !rows.length || image.width % columns || image.height % rows.length) throw new Error('The font bitmap does not match its character grid.')
  const cellWidth = image.width / columns
  const cellHeight = image.height / rows.length
  const scale = height / cellHeight
  const width = cellWidth * scale
  const slotWidth = Math.ceil(width) + 2
  const slotHeight = Math.ceil(height) + 2
  const slots = Math.floor(256 / slotWidth)
  let count = 0
  rows.forEach((row, y) => Array.from(row).forEach((character, x) => {
    if (character === '\0') return
    const left = (count % slots) * slotWidth + 1
    const top = Math.floor(count / slots) * slotHeight + 1
    if (top + height > 256) throw new Error('This font has too many glyphs for the 256px text shader atlas.')
    let right = -1
    for (let column = cellWidth - 1; column >= 0 && right < 0; column--) for (let row = 0; row < cellHeight; row++) {
      if (input.data[((y * cellHeight + row) * image.width + x * cellWidth + column) * 4 + 3]) { right = column; break }
    }
    context.drawImage(image, x * cellWidth, y * cellHeight, cellWidth, cellHeight, left, top, width, height)
    const glyphWidth = Math.max(1, right + 1) * scale
    glyphs[character] = { width: glyphWidth, height, bearing: 7 - ascent, advance: Math.floor((right + 1) * scale + 0.5) + 1, uv: [left / 256, top / 256, (left + glyphWidth) / 256, (top + height) / 256] }
    count++
  }))
  return { pixels: context.getImageData(0, 0, 256, 256).data, glyphs }
}

export function fallbackFont() {
  const image = canvas(128, 128)
  const context = image.getContext('2d')
  context.fillStyle = '#ffffff'
  for (let code = 0; code < 256; code++) {
    const character = String.fromCharCode(code)
    const pattern = PIXELS[character] || PIXELS[character.toUpperCase()] || PIXELS['?']
    pattern.split('/').forEach((row, y) => Array.from(row).forEach((value, x) => { if (value === '1') context.fillRect((code % 16) * 8 + x, Math.floor(code / 16) * 8 + y, 1, 1) }))
  }
  return { ...buildAtlas(image, ASCII), name: 'Bundled pixel font', fallback: true }
}

export function emptyFont() {
  return { pixels: new Uint8ClampedArray(256 * 256 * 4), glyphs: {}, name: '', fallback: false, empty: true }
}

async function bitmap(bytes) {
  const image = await createImageBitmap(new Blob([bytes], { type: 'image/png' }))
  if (image.width > 4096 || image.height > 4096) { image.close(); throw new Error('The font bitmap is too large.') }
  const result = canvas(image.width, image.height)
  result.getContext('2d').drawImage(image, 0, 0)
  image.close()
  return result
}

export async function importFont(file) {
  if (file.size > 250 * 1024 * 1024) throw new Error('Choose a client JAR smaller than 250 MB.')
  let bytes = new Uint8Array(await file.arrayBuffer())
  let rows = ASCII
  let height = 8
  let ascent = 7
  if (/\.(jar|zip)$/i.test(file.name)) {
    const files = unzipSync(bytes, { filter: entry => entry.name === 'assets/minecraft/textures/font/ascii.png' || /^assets\/[^/]+\/font\/.*\.json$/.test(entry.name) })
    bytes = files['assets/minecraft/textures/font/ascii.png']
    if (!bytes) throw new Error('The client JAR does not contain assets/minecraft/textures/font/ascii.png. Import ascii.png directly instead.')
    const visited = new Set()
    const find = path => {
      if (visited.has(path) || !files[path]) return null
      visited.add(path)
      const definition = JSON.parse(new TextDecoder().decode(files[path]))
      for (const provider of definition.providers || []) {
        if (provider.type === 'bitmap' && /(?:^|:)font\/ascii\.png$/.test(provider.file)) return provider
        if (provider.type === 'reference') {
          const [namespace, name] = provider.id.includes(':') ? provider.id.split(':') : ['minecraft', provider.id]
          const found = find(`assets/${namespace}/font/${name}.json`)
          if (found) return found
        }
      }
      return null
    }
    const provider = find('assets/minecraft/font/default.json')
    if (provider) { rows = provider.chars; height = provider.height ?? 8; ascent = provider.ascent ?? 7 }
  } else if (!/\.png$/i.test(file.name)) throw new Error('Choose a Minecraft client .jar or ascii.png.')
  const result = { ...buildAtlas(await bitmap(bytes), rows, height, ascent), name: file.name, fallback: false }
  await saveFont(result)
  return result
}

function database() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('glyphex-fonts', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('fonts')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function cachedFont() {
  const db = await database()
  try { return await new Promise((resolve, reject) => { const request = db.transaction('fonts').objectStore('fonts').get('atlas'); request.onsuccess = () => resolve(request.result || null); request.onerror = () => reject(request.error) }) } finally { db.close() }
}

export async function clearFont() {
  let db
  try {
    db = await database()
    await new Promise((resolve, reject) => {
      const transaction = db.transaction('fonts', 'readwrite')
      transaction.objectStore('fonts').delete('atlas')
      transaction.oncomplete = resolve
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error)
    })
  } catch { return } finally { db?.close() }
}

async function saveFont(font) {
  let db
  try {
    db = await database()
    await new Promise((resolve, reject) => { const transaction = db.transaction('fonts', 'readwrite'); transaction.objectStore('fonts').put(font, 'atlas'); transaction.oncomplete = resolve; transaction.onerror = () => reject(transaction.error); transaction.onabort = () => reject(transaction.error) })
  } catch { return } finally { db?.close() }
}
