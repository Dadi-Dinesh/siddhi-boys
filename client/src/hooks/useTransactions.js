import { getTransactions } from '../services/transactionService'
import { getDashboardSummary } from '../services/dashboardService'
import { useLoad } from './useLoad'

// Ledger rows + the fund totals. Totals come from the same dashboard summary API
// the dashboard uses, so both pages always show the same balance.
async function loadLedger() {
  const [items, summary] = await Promise.all([getTransactions(), getDashboardSummary()])
  return {
    items,
    moneyIn: summary.totalCollected, // all PAID contributions
    moneyOut: summary.totalExpenses, // all expenses
    balance: summary.currentBalance, // moneyIn − moneyOut, worked out by the backend
  }
}

export function useTransactions() {
  return useLoad(loadLedger)
}
