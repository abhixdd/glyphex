export const BACKGROUNDS = [
  { id: 'checker', label: 'Checker', style: { backgroundColor: '#0e0e0f', backgroundImage: 'repeating-conic-gradient(#17171a 0% 25%, #0e0e0f 0% 50%)', backgroundSize: '20px 20px' } },
  { id: 'black', label: 'Black', style: { backgroundColor: '#000000' } },
  { id: 'dark', label: 'Dark gray', style: { backgroundColor: '#2b2b2b' } },
  { id: 'white', label: 'White', style: { backgroundColor: '#ffffff' } },
]

export function presetStyle(id) {
  return BACKGROUNDS.find(item => item.id === id)?.style || BACKGROUNDS[0].style
}

export function backgroundStyle({ preset = 'checker', color = '#0e0e0f', image = '', dim = 0 } = {}) {
  const base = preset === 'custom' ? { backgroundColor: color } : presetStyle(preset)
  const layers = []
  if (dim > 0) layers.push({ image: `linear-gradient(rgba(0, 0, 0, ${dim}), rgba(0, 0, 0, ${dim}))`, size: 'auto', repeat: 'repeat', position: '0 0' })
  if (image) layers.push({ image: `url("${image}")`, size: 'cover', repeat: 'no-repeat', position: 'center' })
  if (base.backgroundImage) layers.push({ image: base.backgroundImage, size: base.backgroundSize || 'auto', repeat: base.backgroundRepeat || 'repeat', position: base.backgroundPosition || '0 0' })
  const style = { backgroundColor: base.backgroundColor }
  if (layers.length) {
    style.backgroundImage = layers.map(layer => layer.image).join(', ')
    style.backgroundSize = layers.map(layer => layer.size).join(', ')
    style.backgroundRepeat = layers.map(layer => layer.repeat).join(', ')
    style.backgroundPosition = layers.map(layer => layer.position).join(', ')
  }
  return style
}
