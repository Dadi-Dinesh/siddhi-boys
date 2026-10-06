// Minimal loading indicator. fullScreen centres it on the page (used during the auth check).
export default function Loading({ label = 'Loading...', fullScreen = false }) {
  return (
    <div
      role="status"
      className={`flex items-center justify-center gap-3 text-sm text-slate-500 ${fullScreen ? 'min-h-screen' : 'py-12'}`}
    >
      <span
        className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-primary-600"
        aria-hidden="true"
      />
      {label}
    </div>
  )
}
