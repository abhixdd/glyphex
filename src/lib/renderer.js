import { preprocessShader, mapShaderErrors } from './preprocessor'
import { layoutText } from './legacyText'
import { colorKey, variantSources } from './shaderVariants'
import { previewSymbols } from './previewSymbols'

const IDENTITY = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])
const ATTRIBUTES = [['Position', 3], ['Color', 4], ['UV0', 2], ['UV2', 2, true], ['PreviewStyle', 2]]

export function createRenderer(canvas, sources, atlas) {
  atlas = previewSymbols(atlas)
  const gl = canvas.getContext('webgl2', { alpha: true, antialias: false, premultipliedAlpha: true })
  if (!gl) throw new Error('WebGL2 is unavailable. Enable hardware acceleration or use a browser with WebGL2 support.')
  const resources = new Map()
  const programs = new Map()
  const track = (kind, value) => { if (!resources.has(kind)) resources.set(kind, new Set()); resources.get(kind).add(value); return value }
  const remove = (kind, value) => { gl[`delete${kind}`](value); resources.get(kind)?.delete(value) }
  const dispose = () => { for (const [kind, values] of resources) for (const value of values) gl[`delete${kind}`](value); resources.clear(); programs.clear() }
  try {
    const buildProgram = keys => {
      const variant = variantSources(sources, keys)
      const shaders = []
      let program
      try {
        for (const stage of ['vertex', 'fragment']) {
          const prepared = preprocessShader(stage === 'vertex' ? variant.vertex : variant.fragment, variant.resolve, stage, variant.configuration)
          const shader = track('Shader', gl.createShader(stage === 'vertex' ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER))
          shaders.push(shader)
          gl.shaderSource(shader, prepared.source)
          gl.compileShader(shader)
          if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(`${stage.toUpperCase()} compile error\n${mapShaderErrors(gl.getShaderInfoLog(shader), prepared)}`)
        }
        program = track('Program', gl.createProgram())
        shaders.forEach(shader => gl.attachShader(program, shader))
        ATTRIBUTES.forEach(([name], index) => gl.bindAttribLocation(program, index, name))
        gl.linkProgram(program)
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(`Shader link error\n${sources.vertex.path}\n${sources.fragment.path}\n${gl.getProgramInfoLog(program)}`)
        gl.useProgram(program)
        const uniforms = new Map()
        for (let index = 0; index < gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS); index++) {
          const info = gl.getActiveUniform(program, index)
          uniforms.set(info.name.replace(/\[0\]$/, ''), { location: gl.getUniformLocation(program, info.name), type: info.type })
        }
        const uniform = (name, value) => {
          const info = uniforms.get(name)
          if (!info) return
          const { location, type } = info
          if (type === gl.FLOAT_MAT4) gl.uniformMatrix4fv(location, false, value)
          else if (type === gl.FLOAT_MAT3) gl.uniformMatrix3fv(location, false, value)
          else if (type === gl.FLOAT_VEC4) gl.uniform4fv(location, value)
          else if (type === gl.FLOAT_VEC3) gl.uniform3fv(location, value)
          else if (type === gl.FLOAT_VEC2) gl.uniform2fv(location, value)
          else if (type === gl.FLOAT) gl.uniform1f(location, Array.isArray(value) ? value[0] : value)
          else if ([gl.INT, gl.BOOL, gl.SAMPLER_2D].includes(type)) gl.uniform1i(location, Array.isArray(value) ? value[0] : value)
        }
        for (const entry of sources.configuration.uniforms || []) uniform(entry.name, entry.values)
        uniform('ModelViewMat', IDENTITY)
        uniform('TextureMat', IDENTITY)
        uniform('IViewRotMat', [1, 0, 0, 0, 1, 0, 0, 0, 1])
        uniform('ColorModulator', [1, 1, 1, 1])
        uniform('ModelOffset', [0, 0, 0])
        uniform('FogColor', [0, 0, 0, 0])
        for (const name of ['FogStart', 'FogEnvironmentalStart', 'FogRenderDistanceStart']) uniform(name, 1000000)
        for (const name of ['FogEnd', 'FogEnvironmentalEnd', 'FogRenderDistanceEnd']) uniform(name, 1000001)
        uniform('FogShape', 0)
        uniform('LineWidth', 1)
        uniform('GlintAlpha', 1)
        uniform('Sampler0', 0)
        uniform('Sampler2', 2)
        return { program, uniform, validated: false }
      } catch (error) {
        if (program) { remove('Program', program); program = null }
        throw error
      } finally { for (const shader of shaders) { if (program) gl.detachShader(program, shader); remove('Shader', shader) } }
    }
    const texture = (unit, size, pixels) => {
      gl.activeTexture(gl.TEXTURE0 + unit)
      gl.bindTexture(gl.TEXTURE_2D, track('Texture', gl.createTexture()))
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    }
    texture(0, 256, new Uint8Array(atlas.pixels))
    texture(2, 16, new Uint8Array(16 * 16 * 4).fill(255))
    const vao = track('VertexArray', gl.createVertexArray())
    gl.bindVertexArray(vao)
    const buffers = {}
    ATTRIBUTES.forEach(([name, size, integer], location) => {
      buffers[name] = track('Buffer', gl.createBuffer())
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers[name])
      gl.enableVertexAttribArray(location)
      if (integer) gl.vertexAttribIPointer(location, size, gl.SHORT, 0, 0)
      else gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0)
    })
    const indices = track('Buffer', gl.createBuffer())
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices)
    gl.enable(gl.BLEND)
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    gl.disable(gl.DEPTH_TEST)
    gl.disable(gl.CULL_FACE)
    const available = new Set(sources.effects.map(effect => colorKey(effect.hex)))
    let groups = []
    let batches = []
    let projection = IDENTITY
    let sceneError = ''
    const setScene = ({ text, color, effects, scale, width, dpr = 1, boxes = false, boxCount = 12, boxRows = 1, bold = false, italic = false }) => {
      if (gl.isContextLost()) throw new Error('The WebGL context was lost. Reload the preview.')
      const columns = effects ? Math.max(1, Math.floor(width / 320)) : 1
      const cellWidth = width / columns / scale
      const squareLine = '⬛'.repeat(Math.max(1, Math.min(64, Math.floor(boxCount) || 12)))
      const squares = Array.from({ length: Math.max(1, Math.min(16, Math.floor(boxRows) || 1)) }, () => squareLine).join('\n')
      const items = (effects || [{ name: text, hex: color }]).map(effect => layoutText(boxes ? effects ? `${effect.name}\n${squares}` : squares : effect.name, atlas, effect.hex, Math.max(8, cellWidth - 20), { bold, italic }))
      const keys = [...new Set(items.flatMap(item => item.glyphs.map(glyph => colorKey(glyph.color))).filter(key => available.has(key)))].sort()
      groups = []
      for (let index = 0; index < keys.length; index += 2) { const subset = keys.slice(index, index + 2); groups.push({ keys: subset, id: subset.join('|') }) }
      if (!groups.length) groups.push({ keys: [], id: 'plain' })
      const active = new Set(groups.map(group => group.id))
      for (const [id, value] of programs) if (!active.has(id)) { remove('Program', value.program); programs.delete(id) }
      const keyGroups = new Map(groups.flatMap((group, index) => group.keys.map(key => [key, index])))
      const triangles = groups.map(() => [[], []])
      const rowHeights = []
      items.forEach((item, index) => { const row = Math.floor(index / columns); rowHeights[row] = Math.max(rowHeights[row] || 0, item.height + 24) })
      const offsets = []
      let total = 0
      for (const value of rowHeights) { offsets.push(total); total += value }
      const height = effects ? Math.max(160, Math.ceil(total * scale)) : Math.max(200, Math.ceil((items[0]?.height + 32) * scale))
      const limit = Math.min(gl.getParameter(gl.MAX_VIEWPORT_DIMS)[1], gl.getParameter(gl.MAX_RENDERBUFFER_SIZE))
      if (height * dpr > limit) throw new Error('The all-effects canvas exceeds your GPU height limit. Reduce GUI scale or widen the window.')
      canvas.width = Math.max(1, Math.round(width * dpr))
      canvas.height = Math.max(1, Math.round(height * dpr))
      canvas.style.height = `${height}px`
      const guiWidth = canvas.width / (scale * dpr)
      const guiHeight = canvas.height / (scale * dpr)
      projection = new Float32Array([2 / guiWidth, 0, 0, 0, 0, -2 / guiHeight, 0, 0, 0, 0, -0.001, 0, -1, 1, 0, 1])
      const positions = []
      const colors = []
      const uvs = []
      const lightmap = []
      const styles = []
      let vertices = 0
      const quad = (item, x, y, shadow, boldOffset) => {
        const glyph = item.glyph
        const left = x + item.x + boldOffset + (shadow ? 1 : 0)
        const top = y + item.y + glyph.bearing + (shadow ? 1 : 0)
        const [u0, v0, u1, v1] = glyph.uv
        const corners = [[left, top, u0, v0], [left, top + glyph.height, u0, v1], [left + glyph.width, top + glyph.height, u1, v1], [left + glyph.width, top, u1, v0]]
        for (let index = 0; index < 4; index++) {
          const [px, py, u, v] = corners[index]
          positions.push(px, py, shadow ? 0 : 0.03)
          styles.push(item.italic ? 1 : 0, y + item.y + (shadow ? 1 : 0))
          colors.push(...item.color.map(value => shadow ? Math.floor(value * 255 * 0.25) / 255 : value), 1)
          uvs.push(u, v)
          lightmap.push(240, 240)
        }
        const group = keyGroups.get(colorKey(item.color)) ?? 0
        triangles[group][shadow ? 0 : 1].push(vertices, vertices + 1, vertices + 2, vertices + 2, vertices + 3, vertices)
        vertices += 4
      }
      for (const shadow of [true, false]) items.forEach((item, index) => {
        const row = Math.floor(index / columns)
        const x = effects ? (index % columns) * cellWidth + 10 : Math.max(10, (guiWidth - item.width) / 2)
        const y = effects ? offsets[row] + 12 : (guiHeight - item.height) / 2
        for (const glyph of item.glyphs) { quad(glyph, x, y, shadow, 0); if (glyph.bold) quad(glyph, x, y, shadow, 1) }
      })
      gl.bindVertexArray(vao)
      for (const [name, values] of [['Position', new Float32Array(positions)], ['Color', new Float32Array(colors)], ['UV0', new Float32Array(uvs)], ['UV2', new Int16Array(lightmap)], ['PreviewStyle', new Float32Array(styles)]]) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers[name])
        gl.bufferData(gl.ARRAY_BUFFER, values, gl.STATIC_DRAW)
      }
      const elements = []
      batches = []
      for (const pass of [0, 1]) groups.forEach((group, index) => { const values = triangles[index][pass]; batches.push({ id: group.id, count: values.length, offset: elements.length * 4 }); elements.push(...values) })
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices)
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(elements), gl.STATIC_DRAW)
      sceneError = ''
      return height
    }
    const draw = ticks => {
      if (gl.isContextLost() || sceneError) return
      try {
        const pending = groups.find(group => !programs.has(group.id))
        if (pending) programs.set(pending.id, buildProgram(pending.keys))
        gl.bindVertexArray(vao)
        gl.viewport(0, 0, canvas.width, canvas.height)
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)
        for (const batch of batches) {
          const value = programs.get(batch.id)
          if (!value || !batch.count) continue
          gl.useProgram(value.program)
          value.uniform('ScreenSize', [canvas.width, canvas.height])
          value.uniform('ProjMat', projection)
          value.uniform('GameTime', ((ticks % 24000) + 24000) % 24000 / 24000)
          gl.drawElements(gl.TRIANGLES, batch.count, gl.UNSIGNED_INT, batch.offset)
          if (!value.validated) {
            const error = gl.getError()
            if (error) throw new Error(`Your graphics driver could not draw this effect (${error}). Try reloading the preview. If it continues, use another browser or update your graphics driver.`)
            value.validated = true
          }
        }
      } catch (error) { sceneError = error.message; throw error }
    }
    return { setScene, draw, dispose, gl, get progress() { return { ready: programs.size, total: groups.length } } }
  } catch (error) { dispose(); throw error }
}
