// Horizontal progress bar. `percent` is 0–100. The light track is a lighter step
// of the same colour, so the bar reads clearly even when nearly empty.
const COLORS = {
  primary: { fill: 'bg-primary-600', track: 'bg-primary-100' },
  success: { fill: 'bg-success-600', track: 'bg-success-50' },
}

export default function ProgressBar({ percent, label, color = 'primary', className = '' }) {
  const safe = Math.max(0, Math.min(100, Number(percent) || 0))
  const { fill, track } = COLORS[color]
  return (
    <div
      role="progressbar"
      aria-valuenow={safe}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={`h-2 w-full overflow-hidden rounded-full ${track} ${className}`}
    >
      <div className={`h-full rounded-full ${fill}`} style={{ width: `${safe}%` }} />
    </div>
  )
}
