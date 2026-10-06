import { WifiOff } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import Button from './Button'

// Shown on startup if a saved session exists but the server can't be reached.
export default function ConnectionError() {
  const { retry, logout } = useAuth()
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-sm text-center">
        <WifiOff className="mx-auto mb-3 text-slate-400" size={32} aria-hidden="true" />
        <h1 className="font-semibold text-slate-900">Unable to connect to the server</h1>
        <p className="mt-1 text-sm text-slate-500">Please check your connection and try again.</p>
        <div className="mt-5 flex justify-center gap-2">
          <Button onClick={retry}>Try again</Button>
          <Button variant="secondary" onClick={logout}>
            Log out
          </Button>
        </div>
      </div>
    </div>
  )
}
