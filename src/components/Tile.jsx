export default function Tile({ title, trailing, className = '', bodyClassName = '', children }) {
  return (
    <section className={`panel flex flex-col p-5 ${className}`}>
      {title && (
        <div className="mb-3.5 flex items-center justify-between gap-3">
          <h2 className="section-label">{title}</h2>
          {trailing}
        </div>
      )}
      <div className={`flex flex-col ${bodyClassName}`}>{children}</div>
    </section>
  )
}
