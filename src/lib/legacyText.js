const COLORS = ['000000', '0000aa', '00aa00', '00aaaa', 'aa0000', 'aa00aa', 'ffaa00', 'aaaaaa', '555555', '5555ff', '55ff55', '55ffff', 'ff5555', 'ff55ff', 'ffff55', 'ffffff']

export function hexColor(value) {
  const hex = value.replace(/^#/, '')
  if (!/^[a-f\d]{6}$/i.test(hex)) return null
  return [0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16) / 255)
}

export function parseLegacy(text, initial = '#ffffff') {
  const runs = []
  let color = hexColor(initial) || [1, 1, 1]
  let bold = false
  let italic = false
  let underline = false
  let strike = false
  let buffer = ''
  const flush = () => { if (buffer) runs.push({ text: buffer, color, bold, italic, underline, strike }); buffer = '' }
  for (let index = 0; index < text.length;) {
    const match = text.slice(index).match(/^[&§](?:#([a-f\d]{6})|([0-9a-frlonmk]))/i)
    if (!match) { const point = String.fromCodePoint(text.codePointAt(index)); buffer += point; index += point.length; continue }
    flush()
    const code = match[2]?.toLowerCase()
    if (match[1] || /^[0-9a-f]$/.test(code || '')) {
      color = hexColor(match[1] || COLORS[parseInt(code, 16)])
      bold = italic = underline = strike = false
    } else if (code === 'r') { color = [1, 1, 1]; bold = italic = underline = strike = false }
    else if (code === 'l') bold = true
    else if (code === 'o') italic = true
    else if (code === 'n') underline = true
    else if (code === 'm') strike = true
    index += match[0].length
  }
  flush()
  return runs
}

export function layoutText(text, atlas, color, maxWidth = Infinity, style = {}) {
  const glyphs = []
  let x = 0
  let y = 0
  let width = 0
  for (const run of parseLegacy(text, color)) for (const character of run.text) {
    if (character === '️' || character === '︎') continue
    if (character === '\n') { width = Math.max(width, x); x = 0; y += 10; continue }
    const glyph = atlas.glyphs[character] || atlas.glyphs['?']
    if (!glyph) continue
    const bold = Boolean(style.bold || run.bold)
    const italic = Boolean(style.italic || run.italic)
    const advance = (character === ' ' ? 4 : glyph.advance) + (bold ? 1 : 0)
    if (x && x + advance > maxWidth) { width = Math.max(width, x); x = 0; y += 10 }
    if (character !== ' ') glyphs.push({ ...run, bold, italic, glyph, x, y, advance })
    x += advance
  }
  return { glyphs, width: Math.max(width, x), height: y + 8 }
}
