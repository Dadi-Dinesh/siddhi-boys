import { useEffect, useId, useRef } from 'react'

// A centred pop-up window built on the browser's native <dialog> element,
// which handles focus and the Escape key for us.
//   <Modal open={open} title="Add Expense" onClose={() => setOpen(false)}> ...form... </Modal>
// While `busy` is true (e.g. saving), Escape/backdrop clicks are ignored.
export default function Modal({ open, title, onClose, busy = false, children }) {
  const dialogRef = useRef(null)
  const titleId = useId() // unique per modal, so several can exist on one page

  // Open/close the native dialog when `open` changes.
  useEffect(() => {
    const dialog = dialogRef.current
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  function close() {
    if (!busy) onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault() // Escape key: let React state decide, not the browser
        close()
      }}
      onClick={(e) => e.target === dialogRef.current && close()} // click on the dark backdrop
      className="m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 shadow-xl backdrop:bg-slate-900/40"
    >
      {/* Only render the contents while open, so forms start fresh each time */}
      {open && (
        <div className="p-6">
          <h2 id={titleId} className="text-lg font-semibold text-slate-900">
            {title}
          </h2>
          {children}
        </div>
      )}
    </dialog>
  )
}
