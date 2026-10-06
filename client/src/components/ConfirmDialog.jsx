import Button from './Button'
import Modal from './Modal'

// Reusable "Are you sure?" dialog. Used instead of window.confirm().
//
// <ConfirmDialog open={open} title="Delete expense?" confirmLabel="Delete"
//   onConfirm={handleDelete} onCancel={() => setOpen(false)} loading={deleting}>
//   This can't be undone.
// </ConfirmDialog>
export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = 'Confirm',
  confirmVariant = 'primary',
  loading = false,
  loadingText = 'Please wait...',
  onConfirm,
  onCancel,
}) {
  return (
    <Modal open={open} title={title} onClose={onCancel} busy={loading}>
      <div className="mt-2 text-sm text-slate-600">{children}</div>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button variant={confirmVariant} onClick={onConfirm} loading={loading} loadingText={loadingText}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
