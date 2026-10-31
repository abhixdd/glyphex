import { vanillaIncludes } from './vanillaIncludes'
import { desktopArithmetic, fragmentSingleExit } from './glslCompatibility'
import { italicVertex } from './italicShader'

function safeName(name) {
  if (name.includes('..') || name.includes('\\') || name.startsWith('/')) throw new Error(`Invalid shader import: ${name}`)
  return name
}

export function preprocessShader(root, resolve, stage, configuration = {}) {
  const names = new Map()
  const files = {}
  const imported = new Set()
  const active = new Set()
  const uniforms = new Set()
  const flattened = {}
  let nextId = 1
  function id(name) {
    if (!names.has(name)) { names.set(name, nextId); files[nextId++] = name }
    return names.get(name)
  }
  function importSource(name, parent, relative) {
    safeName(name)
    let namespace = 'minecraft'
    let resource = name
    if (name.includes(':')) [namespace, resource] = name.split(':')
    const candidates = relative ? [`${parent.slice(0, parent.lastIndexOf('/') + 1)}${resource}`] : []
    candidates.push(`assets/${namespace}/shaders/include/${resource}`)
    for (const candidate of candidates) {
      const source = resolve(candidate)
      if (source) return source
    }
    if (namespace === 'minecraft' && vanillaIncludes[resource]) {
      let content = vanillaIncludes[resource]
      if (resource === 'fog.glsl' && /\bvec4\s+linear_fog\s*\(/.test(root.content)) content = content.replace(/^vec4 linear_fog\([^\n]*\n?/m, '\n')
      return { path: `vanilla/${resource}`, content }
    }
    throw new Error(`${parent}: missing shader include <${name}>`)
  }
  function expand(source) {
    if (active.has(source.path)) throw new Error(`Circular shader import: ${source.path}`)
    if (imported.has(source.path)) return ''
    imported.add(source.path)
    active.add(source.path)
    let content = source.content.replace(/\r+\n/g, '\n').replace(/\r/g, '\n')
    content = content.replace(/(?:layout\s*\([^)]*\)\s*)?uniform\s+(\w+)\s*\{([\s\S]*?)\}\s*(\w+)?\s*;/g, (match, block, members, instance) => {
      const declarations = members.split(';').map(value => value.trim()).filter(Boolean)
      if (instance) for (const value of declarations) { const name = value.match(/(\w+)(?:\s*\[.*\])?$/)?.[1]; if (name) flattened[`${instance}.${name}`] = name }
      const replacement = declarations.map(value => `uniform ${value};`).join(' ')
      return replacement + '\n'.repeat((match.match(/\n/g) || []).length)
    })
    const output = [`#line 1 ${id(source.path)}`]
    const lines = content.split('\n')
    for (let line = 0; line < lines.length; line++) {
      const value = lines[line]
      const include = value.match(/^\s*#moj_import\s*(?:<([^>]+)>|"([^"]+)")/)
      if (include) {
        output.push(expand(importSource(include[1] || include[2], source.path, Boolean(include[2]))))
        output.push(`#line ${line + 2} ${id(source.path)}`)
      } else if (/^\s*#version\b/.test(value)) output.push('')
      else {
        const uniform = value.match(/^\s*uniform\s+\w+\s+(\w+)(?:\s*\[[^\]]+\])?\s*;/)
        if (uniform && uniforms.has(uniform[1])) output.push('')
        else { if (uniform) uniforms.add(uniform[1]); output.push(value.replace(/\bnoperspective\s+/g, '').replace(/\blayout\s*\(\s*location\s*=\s*\d+\s*\)\s*/g, '')) }
      }
    }
    active.delete(source.path)
    return output.join('\n')
  }
  const defines = configuration.defines || {}
  const flags = (defines.flags || []).filter(flag => /^[A-Za-z_]\w*$/.test(flag)).map(flag => `#define ${flag}`)
  const values = Object.entries(defines.values || {}).filter(([name, value]) => /^[A-Za-z_]\w*$/.test(name) && /^[-+\w.]+$/.test(String(value))).map(([name, value]) => `#define ${name} ${value}`)
  const compatibleRoot = stage === 'fragment' ? { ...root, content: fragmentSingleExit(root.content) } : root
  let body = desktopArithmetic(expand(compatibleRoot))
  if (stage === 'vertex') body = italicVertex(body, id('preview/italic.glsl'))
  let source = `#version 300 es\nprecision highp float;\nprecision highp int;\n#define ${stage === 'vertex' ? 'VSH' : 'FSH'}\n${flags.join('\n')}\n${values.join('\n')}\n${body}`
  for (const [from, to] of Object.entries(flattened)) source = source.replaceAll(from, to)
  return { source, files, stage, root: root.path }
}

export function mapShaderErrors(log, prepared) {
  return log.replace(/(?:ERROR|WARNING):\s*(\d+):(\d+):/g, (match, source, line) => `${prepared.files[Number(source)] || prepared.root}:${line}:`).trim()
}
