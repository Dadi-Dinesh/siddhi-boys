import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import api, { getErrorMessage } from '../services/api'
import Loading from './Loading'
import Alert from './Alert'

export default function ImageModal({ open, onClose, title = 'Payment Screenshot', subtitle, imageUrl }) {
  const [blobUrl, setBlobUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open || !imageUrl) {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl)
        setBlobUrl(null)
      }
      setError(null)
      setLoading(false)
      return
    }

    let isCurrent = true
    setLoading(true)
    setError(null)

    // Fetch the authenticated screenshot securely using the Axios client
    api
      .get(imageUrl, { responseType: 'blob' })
      .then((res) => {
        if (!isCurrent) return
        const url = URL.createObjectURL(res.data)
        setBlobUrl(url)
        setLoading(false)
      })
      .catch((err) => {
        if (!isCurrent) return
        setError(getErrorMessage(err) || 'Unable to load payment screenshot')
        setLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [open, imageUrl])

  // Clean up object URL when component unmounts
  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [blobUrl])

  // Close on Escape key
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="screenshot-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="min-w-0 pr-4">
            <h3 id="screenshot-modal-title" className="text-base font-semibold text-slate-900 truncate">
              {title}
            </h3>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5 truncate">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close image preview"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Image Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex items-center justify-center bg-slate-50 min-h-[260px]">
          {loading && (
            <div className="flex flex-col items-center gap-2 py-10">
              <Loading />
              <p className="text-xs text-slate-500">Loading screenshot...</p>
            </div>
          )}

          {error && (
            <div className="max-w-md w-full">
              <Alert variant="error">{error}</Alert>
            </div>
          )}

          {!loading && !error && blobUrl && (
            <img
              src={blobUrl}
              alt="Payment verification screenshot"
              className="max-h-[68vh] w-auto max-w-full rounded-lg object-contain shadow-sm border border-slate-200 bg-white"
            />
          )}
        </div>
      </div>
    </div>
  )
}
