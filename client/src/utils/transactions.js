// Display helpers for ledger rows (shared by the table and the phone cards).

// What each row says, based on the fields the API provides.
//   Contribution → "Monthly Contribution" · "Rahul" · "October 2026 (Base: ₹100 + Fine: ₹20)"
//   Expense      → "Birthday Cake" · "Expense" · "Cake for Rahul's birthday"
export function describeTransaction(t) {
  if (t.type === 'CONTRIBUTION') {
    const hasFine = Number(t.fineAmount || 0) > 0
    const periodLabel = t.period?.label || ''
    const breakdown = hasFine
      ? `Base: ₹${Number(t.baseAmount || 0)} + Fine: ₹${Number(t.fineAmount || 0)}`
      : ''
    const note = [periodLabel, breakdown].filter(Boolean).join(' · ')
    return { heading: 'Monthly Contribution', detail: t.member?.name ?? '—', note }
  }
  return { heading: t.title, detail: 'Expense', note: t.description ?? '' }
}

// Text that search looks through: e.g. "Rahul", "Birthday", "Contribution", "October" all match.
export function transactionSearchText(t) {
  const { heading, detail, note } = describeTransaction(t)
  return [heading, detail, note, t.title, t.type === 'CONTRIBUTION' ? 'contribution money in' : 'expense money out']
    .join(' ')
    .toLowerCase()
}
