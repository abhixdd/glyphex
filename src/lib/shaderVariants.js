export function colorKey(color) {
  const values = typeof color === 'string' ? color.replace(/^#/, '').match(/../g)?.map(value => parseInt(value, 16)) : color.map(value => Math.round(value * 255))
  return values?.map(value => Math.floor(value / 4)).join(',') || ''
}

function blockEnd(source, start) {
  let depth = 0
  let lineComment = false
  let blockComment = false
  for (let index = start; index < source.length; index++) {
    const character = source[index]
    const next = source[index + 1]
    if (lineComment) { if (character === '\n' || character === '\r') lineComment = false; continue }
    if (blockComment) { if (character === '*' && next === '/') { blockComment = false; index++ }; continue }
    if (character === '/' && next === '/') { lineComment = true; index++; continue }
    if (character === '/' && next === '*') { blockComment = true; index++; continue }
    if (character === '{') depth++
    if (character === '}' && --depth === 0) return index + 1
  }
  throw new Error('Unclosed TEXT_EFFECT block in shader source.')
}

export function specializeEffects(source, keys) {
  const allowed = new Set(keys)
  const expression = /\bTEXT_EFFECT\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)\s*\{/g
  const code = source.replace(/\/\/[^\r\n]*|\/\*[\s\S]*?\*\//g, value => value.replace(/[^\r\n]/g, ' '))
  let output = ''
  let previous = 0
  let match
  while ((match = expression.exec(code))) {
    const end = blockEnd(code, expression.lastIndex - 1)
    const key = match.slice(1, 4).map(value => Math.floor(Number(value) / 4)).join(',')
    output += source.slice(previous, match.index)
    const block = source.slice(match.index, end)
    output += allowed.has(key) ? block : block.replace(/[^\r\n]/g, ' ')
    previous = expression.lastIndex = end
  }
  return output + source.slice(previous)
}

export function variantSources(sources, keys) {
  const resolve = path => {
    const file = sources.resolve(path)
    return file ? { ...file, content: specializeEffects(file.content, keys) } : null
  }
  return { ...sources, resolve, vertex: { ...sources.vertex, content: specializeEffects(sources.vertex.content, keys) }, fragment: { ...sources.fragment, content: specializeEffects(sources.fragment.content, keys) } }
}
