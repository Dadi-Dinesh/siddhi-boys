import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import Badge from '../Badge'
import { formatSignedRupees } from '../../utils/format'

// Small "IN" / "OUT" label with an arrow, so it's clear without relying on colour.
export function TypeBadge({ direction }) {
  return direction === 'IN' ? (
    <Badge variant="success" icon={ArrowDownLeft}>
      IN
    </Badge>
  ) : (
    <Badge variant="danger" icon={ArrowUpRight}>
      OUT
    </Badge>
  )
}

// "+₹100" (money in) or "-₹800" (money out)
export function SignedAmount({ amount, direction }) {
  return (
    <span className={`font-semibold tabular-nums ${direction === 'IN' ? 'text-success-700' : 'text-slate-900'}`}>
      {formatSignedRupees(amount, direction)}
    </span>
  )
}
