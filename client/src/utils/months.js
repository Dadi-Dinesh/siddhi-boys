// Small helpers for working with { year, month } pairs (month is 1–12).

const monthFormatter = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' })

// monthLabel(2026, 10) → "October 2026"
export function monthLabel(year, month) {
  return monthFormatter.format(new Date(year, month - 1, 1))
}

export function currentMonth() {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

// shiftMonth(2026, 12, 1) → { year: 2027, month: 1 }
export function shiftMonth(year, month, step) {
  const d = new Date(year, month - 1 + step, 1)
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

// A comparable number for sorting: 2026-10 → 24322
const index = ({ year, month }) => year * 12 + (month - 1)

// Options for the month dropdown, newest first:
// every month from the earliest created month (or 12 months ago) up to
// 2 months ahead (or the latest created month), plus the selected month.
// `createdMonths` comes from the API, so we know which months already exist.
export function buildMonthOptions(createdMonths, selected) {
  const now = currentMonth()
  const indexes = [index(shiftMonth(now.year, now.month, -12)), index(shiftMonth(now.year, now.month, 2)), index(selected)]
  createdMonths.forEach((m) => indexes.push(index(m)))
  const created = new Set(createdMonths.map(index))

  const options = []
  for (let i = Math.max(...indexes); i >= Math.min(...indexes); i--) {
    const year = Math.floor(i / 12)
    const month = (i % 12) + 1
    options.push({ year, month, created: created.has(i) })
  }
  return options
}
