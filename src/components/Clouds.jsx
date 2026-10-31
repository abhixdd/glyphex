const CLOUDS = [
  { top: 96, width: 84, opacity: 1, duration: 90, delay: -20 },
  { top: 70, width: 120, opacity: 0.95, duration: 140, delay: -90 },
  { top: 150, width: 60, opacity: 0.8, duration: 70, delay: -45 },
  { top: 40, width: 96, opacity: 0.9, duration: 110, delay: -10 },
  { top: 210, width: 72, opacity: 0.7, duration: 120, delay: -70 },
]

export default function Clouds() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-85 overflow-hidden" aria-hidden="true">
      {CLOUDS.map(cloud => (
        <div
          key={`${cloud.top}-${cloud.width}`}
          className="absolute left-0"
          style={{ top: cloud.top, width: cloud.width, opacity: cloud.opacity, animation: `drift ${cloud.duration}s linear ${cloud.delay}s infinite` }}
        >
          <svg viewBox="0 0 12 5" width={cloud.width} className="block" shapeRendering="crispEdges">
            <rect x="3" y="0" width="5" height="1" fill="#fff" />
            <rect x="1" y="1" width="9" height="1" fill="#fff" />
            <rect x="0" y="2" width="12" height="2" fill="#fff" />
            <rect x="0" y="4" width="12" height="1" fill="#c5cde0" />
            <rect x="5" y="0" width="3" height="1" fill="#eef2fb" />
          </svg>
        </div>
      ))}
    </div>
  )
}
