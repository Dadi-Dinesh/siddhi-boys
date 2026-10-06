import { useCallback, useEffect, useRef, useState } from 'react'

// A page-level message ("Expense added successfully.", or an error).
// Success messages hide themselves after 4 seconds; errors stay until dismissed.
//   const { flash, showFlash, clearFlash } = useFlash()
//   {flash && <Alert variant={flash.variant} onClose={clearFlash}>{flash.text}</Alert>}
export function useFlash() {
  const [flash, setFlash] = useState(null)
  const timer = useRef()

  const showFlash = useCallback((variant, text) => {
    clearTimeout(timer.current)
    setFlash({ variant, text })
    if (variant === 'success') timer.current = setTimeout(() => setFlash(null), 4000)
  }, [])

  const clearFlash = useCallback(() => {
    clearTimeout(timer.current)
    setFlash(null)
  }, [])

  useEffect(() => () => clearTimeout(timer.current), []) // stop the timer if the page closes

  return { flash, showFlash, clearFlash }
}
