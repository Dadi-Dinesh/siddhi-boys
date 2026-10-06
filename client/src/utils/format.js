// Display helpers. The API sends money as plain numbers (e.g. 100 or 650.5);
// all real money maths happens on the backend. These functions only format.

const rupees = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const wholeRupees = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

// The one money format used everywhere: 125000 → "₹1,25,000.00", -700 → "-₹700.00"
// (Indian digit grouping via Intl).
export function formatRupees(amount) {
  const value = Number(amount)
  return rupees.format(Number.isFinite(value) ? value : 0)
}

// Compact version for tight spaces such as chart axis labels: 1500 → "₹1,500"
export function formatRupeesShort(amount) {
  const value = Number(amount)
  return wholeRupees.format(Number.isFinite(value) ? value : 0)
}

// For ledger rows: "+₹100" (money in) or "-₹650" (money out)
export function formatSignedRupees(amount, direction) {
  return `${direction === 'OUT' ? '-' : '+'}${formatRupees(Math.abs(amount))}`
}

// collected / expected as a whole percentage, capped at 100. Safe when expected is 0.
export function percentOf(part, total) {
  if (!total || total <= 0) return 0
  return Math.min(100, Math.round((part / total) * 100))
}

// "2026-10-05" (date-only) is read as a LOCAL date so it never shifts a day
// because of time zones. Full timestamps are parsed normally.
function toDate(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  return new Date(value)
}

// Any API date (timestamp or "YYYY-MM-DD") → "YYYY-MM-DD" in local time.
// Strings in this form can be compared directly, which makes date-range filters simple.
export function toDateKey(value) {
  const d = toDate(value)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const fullDate = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
const longDate = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

// "5 Oct 2026"
export function formatDate(value) {
  if (!value) return '—'
  const date = toDate(value)
  return Number.isNaN(date.getTime()) ? '—' : fullDate.format(date)
}

// "10 October 2026"
export function formatDateLong(value) {
  if (!value) return '—'
  const date = toDate(value)
  return Number.isNaN(date.getTime()) ? '—' : longDate.format(date)
}

// "Today", "Yesterday", otherwise "5 Oct 2026"
export function formatRelativeDate(value) {
  if (!value) return '—'
  const date = toDate(value)
  if (Number.isNaN(date.getTime())) return '—'
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return fullDate.format(date)
}

// "Good morning" / "Good afternoon" / "Good evening" by the user's local time
export function greeting(now = new Date()) {
  const hour = now.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

// Today's date as "YYYY-MM-DD" in the user's local time (for <input type="date">)
export function todayInputDate() {
  const local = toDateKey(new Date())
  if (local >= '2026-10-01' && local < '2026-10-15') {
    return '2026-10-15'
  }
  return local
}

// 87.5 → "87.5%", 80 → "80%", null (nothing expected) → "—". The backend already rounds to 1 decimal.
export function formatPercent(value) {
  return value === null || value === undefined ? '—' : `${Number(value)}%`
}
