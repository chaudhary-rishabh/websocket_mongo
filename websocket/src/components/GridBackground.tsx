export default function GridBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-white/50 backdrop-blur-3xl">
      {/* Layer 1 — grid lines */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e8e8e8 1px, transparent 1px),
            linear-gradient(to bottom, #e8e8e8 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      />
      {/* Layer 2 — radial fade mask */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, transparent 0%, transparent 35%, white 75%)`,
        }}
      />
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
