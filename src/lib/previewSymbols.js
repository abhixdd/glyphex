export function previewSymbols(atlas) {
  const pixels = new Uint8Array(atlas.pixels)
  let position = null
  for (let y = 244; y >= 0 && !position; y -= 10) for (let x = 244; x >= 0 && !position; x -= 10) {
    let empty = true
    for (let row = y; row < y + 10 && empty; row++) for (let column = x; column < x + 10; column++) {
      if (pixels[(row * 256 + column) * 4 + 3]) { empty = false; break }
    }
    if (empty) position = [x + 1, y + 1]
  }
  if (!position) throw new Error('The font atlas has no room for preview squares. Import a smaller font bitmap.')
  const [x, y] = position
  for (let row = y; row < y + 8; row++) for (let column = x; column < x + 8; column++) pixels.fill(255, (row * 256 + column) * 4, (row * 256 + column) * 4 + 4)
  const glyph = { width: 8, height: 8, bearing: 0, advance: 9, uv: [x / 256, y / 256, (x + 8) / 256, (y + 8) / 256] }
  return { ...atlas, pixels, glyphs: { ...atlas.glyphs, ...Object.fromEntries(['⬛', '■', '█', '▪', '◼'].map(character => [character, glyph])) } }
}
