export function desktopArithmetic(source) {
  const scalars = new Set(Array.from(source.matchAll(/\buniform\s+float\s+(\w+)/g), match => match[1]))
  const signatures = new Map()
  for (const match of source.matchAll(/\b(?:void|float|vec[234]|int|bool|uint)\s+(\w+)\s*\(([^{};]*)\)\s*\{/g)) {
    const types = match[2].split(',').filter(value => value.trim()).map(value => value.trim().replace(/^(?:in|out|inout)\s+/, '').split(/\s+/)[0])
    if (!signatures.has(match[1])) signatures.set(match[1], [])
    signatures.get(match[1]).push(types)
  }
  let converted = source.replace(/\b(vec[234]|float)\s+(\w+)\s*\(([^{};]*)\)\s*\{([^{}]*)\}/g, (body, type, name, argumentsSource) => {
    const integers = Array.from(argumentsSource.matchAll(/\bint\s+(\w+)/g), match => match[1])
    for (const integer of integers) body = body.replace(new RegExp(`\\b${integer}[ \\t]*([*/+\\-])[ \\t]*(\\d+\\.\\d+(?:e[+-]?\\d+)?)`, 'g'), `float(${integer}) $1 $2`)
    return body
  })
  converted = converted.replace(/\b([A-Za-z_]\w*)[ \t]*([*/+-])[ \t]*(\d+)\b(?![.\w])/g, (match, name, operator, number) => scalars.has(name) ? `${name} ${operator} ${number}.0` : match)
  converted = converted.replace(/\b(\d+\.\d+(?:e[+-]?\d+)?)[ \t]*([*/+-])[ \t]*(\d+)\b(?![.\w])/g, '$1 $2 $3.0')
  converted = converted.replace(/\bmod\([ \t]*([^,\n]+),[ \t]*(\d+)[ \t]*\)/g, 'mod($1, $2.0)')
  converted = converted.replace(/\b(\w+)([ \t]*\()([^()\n]*)(\))/g, (match, name, open, argumentsSource, close) => {
    const values = argumentsSource.split(',')
    const overloads = signatures.get(name)?.filter(types => types.length === values.length)
    if (!overloads?.length) return match
    return name + open + values.map((value, index) => /^[ \t]*[+-]?\d+[ \t]*$/.test(value) && overloads.every(types => types[index] === 'float') ? value.replace(/\d+/, '$&.0') : value).join(',') + close
  })
  return converted
}

export function fragmentSingleExit(source) {
  const code = source.replace(/\/\/[^\r\n]*|\/\*[\s\S]*?\*\//g, value => value.replace(/[^\r\n]/g, ' '))
  const main = /\bvoid\s+main\s*\(\s*\)\s*\{/.exec(code)
  if (!main) return source
  const start = main.index + main[0].length
  let depth = 1
  let end = start
  while (end < code.length && depth) { if (code[end] === '{') depth++; if (code[end] === '}') depth--; if (depth) end++ }
  if (depth) return source
  const guard = /^\s*if\s*\(\s*(\w+)\s*\(\s*\)\s*\)\s*(?:\{\s*return\s*;\s*\}|return\s*;)/.exec(code.slice(start, end))
  if (!guard) return source
  const name = guard[1]
  const before = start + guard.index
  const after = before + guard[0].length
  const padding = source.slice(before, after).match(/\r\n|\r|\n/g)?.join('') || ''
  return source.slice(0, before) + `if (!${name}()) {` + padding + source.slice(after, end) + '} ' + source.slice(end)
}
