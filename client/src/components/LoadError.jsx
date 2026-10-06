import { AlertCircle } from 'lucide-react'
import Button from './Button'
import Card from './Card'

// Shown when a page's data couldn't be loaded. `detail` is already a friendly
// message from getErrorMessage(), never a raw server error.
export default function LoadError({ title, detail, onRetry, retrying }) {
  return (
    <Card className="text-center">
      <AlertCircle size={28} className="mx-auto mb-2 text-danger-600" aria-hidden="true" />
      <p className="font-medium text-slate-900">{title}</p>
      {detail && <p className="mt-1 text-sm text-slate-500">{detail}</p>}
      <Button onClick={onRetry} loading={retrying} loadingText="Retrying..." className="mt-4">
        Retry
      </Button>
    </Card>
  )
}
