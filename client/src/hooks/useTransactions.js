import { getTransactions } from '../services/transactionService'
import { getDashboardSummary } from '../services/dashboardService'
import { useLoad } from './useLoad'

// Ledger rows + the fund totals. Totals come from the same dashboard summary API
// the dashboard uses, so both pages always show the same balance.
async function loadLedger() {
  const [items, summary] = await Promise.all([getTransactions(), getDashboardSummary()])
  return {
    items,
    totalCollected: summary.totalCollected, // all PAID contributions (base + fines)
    totalExpenses: summary.totalExpenses, // all expenses
    currentlyBorrowed: summary.currentlyBorrowed, // borrowed and not yet returned
    balance: summary.currentBalance, // available balance, worked out by the backend
  }
}

export function useTransactions() {
  return useLoad(loadLedger)
}
