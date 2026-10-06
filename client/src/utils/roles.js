// Where each role "lives" in the app. Frontend role checks are only for
// navigation/UX — the backend is what actually enforces permissions.
export function homePathFor(role) {
  return role === 'ADMIN' ? '/admin' : '/member'
}

export function roleLabel(role) {
  return role === 'ADMIN' ? 'Administrator' : 'Member'
}
