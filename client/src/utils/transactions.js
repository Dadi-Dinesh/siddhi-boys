// Display helpers for ledger rows (shared by the table and the phone cards).

// What each row says, based on the fields the API provides.
//   Contribution → "Monthly Contribution" · "Rahul" · "October 2026 (Base: ₹100 + Fine: ₹20)"
//   Expense      → "Birthday Cake" · "Expense" · "Cake for Rahul's birthday"
//   Borrowed     → "Borrowed" · "Rahul" · "Personal emergency"
//   Returned     → "Borrowed Returned" · "Rahul" · "Personal emergency"
export function describeTransaction(t) {
  if (t.type === 'BORROWED') return { heading: 'Borrowed', detail: t.member?.name ?? '—', note: t.description ?? '' }
  if (t.type === 'BORROW_RETURN') return { heading: 'Borrowed Returned', detail: t.member?.name ?? '—', note: t.description ?? '' }
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

const TYPE_SEARCH_WORDS = {
  CONTRIBUTION: 'contribution money in',
  EXPENSE: 'expense money out',
  BORROWED: 'borrowed money out',
  BORROW_RETURN: 'borrowed returned money in',
}

// Short label for the kind of row, e.g. in the dashboard's recent list.
export function transactionTypeLabel(t) {
  return { CONTRIBUTION: 'Contribution', EXPENSE: 'Expense', BORROWED: 'Borrowed', BORROW_RETURN: 'Borrowed Returned' }[t.type] ?? ''
}

// Text that search looks through: e.g. "Rahul", "Birthday", "Contribution", "October" all match.
export function transactionSearchText(t) {
  const { heading, detail, note } = describeTransaction(t)
  return [heading, detail, note, t.title, TYPE_SEARCH_WORDS[t.type] ?? '']
    .join(' ')
    .toLowerCase()
}
