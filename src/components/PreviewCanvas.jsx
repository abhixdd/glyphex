import { useEffect, useRef, useState } from 'react'
import { createRenderer } from '../lib/renderer'
import { backgroundStyle } from '../lib/backgrounds'

export default function PreviewCanvas({ sources, atlas, text, color, scale, speed, paused, background, bgColor, bgImage, bgDim, onError, bold, italic, effects, boxes, boxCount, boxRows, step }) {
  const canvas = useRef(null)
  const wrapper = useRef(null)
  const renderer = useRef(null)
  const ticks = useRef(0)
  const previousStep = useRef(step)
  const clock = useRef({ speed, paused })
  const [width, setWidth] = useState(600)
  const [generation, setGeneration] = useState(0)

  useEffect(() => { clock.current = { speed, paused } }, [speed, paused])

  useEffect(() => {
    const observer = new ResizeObserver(entries => setWidth(Math.max(1, Math.floor(entries[0].contentRect.width))))
    observer.observe(wrapper.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const element = canvas.current
    const lost = event => { event.preventDefault(); onError('The WebGL context was lost. Waiting for the browser to restore it.') }
    const restored = () => setGeneration(value => value + 1)
    element.addEventListener('webglcontextlost', lost)
    element.addEventListener('webglcontextrestored', restored)
    try { renderer.current = createRenderer(element, sources, atlas); onError('') } catch (error) { onError(error.message) }
    return () => { element.removeEventListener('webglcontextlost', lost); element.removeEventListener('webglcontextrestored', restored); renderer.current?.dispose(); renderer.current = null }
  }, [sources, atlas, generation, onError])

  useEffect(() => {
    if (!renderer.current) return
    try { renderer.current.setScene({ text, color, scale, width, dpr: window.devicePixelRatio || 1, bold, italic, effects, boxes, boxCount, boxRows }); renderer.current.draw(ticks.current); onError('') } catch (error) { onError(error.message) }
  }, [sources, atlas, generation, text, color, scale, width, bold, italic, effects, boxes, boxCount, boxRows, onError])

  useEffect(() => {
    ticks.current += step - previousStep.current
    previousStep.current = step
    renderer.current?.draw(ticks.current)
  }, [step])

  useEffect(() => {
    let frame
    let previous
    const render = time => {
      if (previous !== undefined && !document.hidden && !clock.current.paused) ticks.current += (time - previous) / 1000 * 20 * clock.current.speed
      previous = time
      if (!document.hidden) { try { renderer.current?.draw(ticks.current) } catch (error) { onError(error.message) } }
      frame = requestAnimationFrame(render)
    }
    frame = requestAnimationFrame(render)
    return () => cancelAnimationFrame(frame)
  }, [onError])

  return (
    <div ref={wrapper} className="w-full" style={backgroundStyle({ preset: background, color: bgColor, image: bgImage, dim: bgDim })}>
      <canvas ref={canvas} className="w-full block" aria-label="Live shader preview" />
    </div>
  )
}
