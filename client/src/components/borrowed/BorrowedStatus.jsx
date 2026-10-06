import Badge from '../Badge'

export default function BorrowedStatus({ status }) {
  return status === 'RETURNED' ? <Badge variant="success">Returned</Badge> : <Badge variant="warning">Borrowed</Badge>
}
