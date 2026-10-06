import { CheckCircle2, MinusCircle, Pencil, UserCheck, UserX } from 'lucide-react'
import ActionLabel from '../ActionLabel'
import Badge from '../Badge'
import Button from '../Button'

export function MemberStatusBadge({ isActive }) {
  return isActive ? (
    <Badge variant="success" icon={CheckCircle2}>
      Active
    </Badge>
  ) : (
    <Badge icon={MinusCircle}>Inactive</Badge>
  )
}

// Edit + Activate/Deactivate buttons, shared by the table (desktop) and cards (phones).
// compact: icon-only below 1280px (used in the table).
export function MemberActions({ member, busy, onEdit, onDeactivate, onActivate, size = 'sm', compact = false, className = '' }) {
  const label = (text) =>
    compact ? (
      <ActionLabel text={text} title={member.name} />
    ) : (
      <>
        {text}
        <span className="sr-only"> {member.name}</span>
      </>
    )
  return (
    <div className={className}>
      <Button size={size} variant="secondary" onClick={() => onEdit(member)} disabled={busy} title={`Edit ${member.name}`}>
        <Pencil size={14} aria-hidden="true" />
        {label('Edit')}
      </Button>
      {member.isActive ? (
        <Button
          size={size}
          variant="danger-outline"
          onClick={() => onDeactivate(member)}
          loading={busy}
          loadingText="Updating..."
          title={`Deactivate ${member.name}`}
        >
          <UserX size={14} aria-hidden="true" />
          {label('Deactivate')}
        </Button>
      ) : (
        <Button
          size={size}
          variant="secondary"
          onClick={() => onActivate(member)}
          loading={busy}
          loadingText="Updating..."
          title={`Activate ${member.name}`}
        >
          <UserCheck size={14} aria-hidden="true" />
          {label('Activate')}
        </Button>
      )}
    </div>
  )
}
