import { useState } from 'react'
import { User } from 'lucide-react'

// Map of sizes to Tailwind dimension and text size classes
const SIZES = {
  xs: { box: 'h-6 w-6', text: 'text-[10px]', icon: 12 },
  sm: { box: 'h-8 w-8', text: 'text-xs', icon: 16 },
  md: { box: 'h-10 w-10', text: 'text-sm', icon: 20 },
  lg: { box: 'h-14 w-14', text: 'text-base font-semibold', icon: 26 },
  xl: { box: 'h-20 w-20', text: 'text-xl font-bold', icon: 36 },
}

// Generate consistent background color based on name string
function getAvatarBg(name = '') {
  const colors = [
    'bg-primary-100 text-primary-800 border-primary-200',
    'bg-emerald-100 text-emerald-800 border-emerald-200',
    'bg-blue-100 text-blue-800 border-blue-200',
    'bg-amber-100 text-amber-800 border-amber-200',
    'bg-purple-100 text-purple-800 border-purple-200',
    'bg-rose-100 text-rose-800 border-rose-200',
    'bg-indigo-100 text-indigo-800 border-indigo-200',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % colors.length
  return colors[index]
}

function getInitials(name = '') {
  if (!name.trim()) return ''
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function Avatar({
  src,
  name = '',
  size = 'md',
  className = '',
  alt,
}) {
  const [imgError, setImgError] = useState(false)
  const sizeConfig = SIZES[size] || SIZES.md
  const initials = getInitials(name)
  const colorClass = getAvatarBg(name)

  const hasValidImage = src && !imgError

  if (hasValidImage) {
    return (
      <img
        src={src}
        alt={alt || name || 'Member photo'}
        onError={() => setImgError(true)}
        className={`${sizeConfig.box} shrink-0 rounded-full object-cover border border-slate-200 shadow-sm ${className}`}
      />
    )
  }

  return (
    <div
      className={`${sizeConfig.box} ${sizeConfig.text} ${colorClass} shrink-0 flex items-center justify-center rounded-full border font-medium select-none shadow-sm ${className}`}
      aria-label={name || 'Avatar'}
    >
      {initials ? initials : <User size={sizeConfig.icon} aria-hidden="true" />}
    </div>
  )
}
