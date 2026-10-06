import { RefreshCw } from 'lucide-react'
import Button from './Button'

// "↻ Refresh" button used in page headers. Spins and says "Refreshing..." while busy.
export default function RefreshButton({ onClick, refreshing, disabled }) {
  return (
    <Button variant="secondary" onClick={onClick} loading={refreshing} loadingText="Refreshing..." disabled={disabled}>
      <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} aria-hidden="true" />
      {!refreshing && 'Refresh'}
    </Button>
  )
}
