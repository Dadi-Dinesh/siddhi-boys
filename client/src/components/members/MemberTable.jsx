import Avatar from '../Avatar'
import { formatDate } from '../../utils/format'
import { MemberActions, MemberStatusBadge } from './MemberStatus'

// Desktop view. Click a name to see that member's details and payment history.
export default function MemberTable({ members, busyId, onView, onEdit, onDeactivate, onActivate }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <th scope="col" className="w-14 py-3 px-3 text-center font-medium">Photo</th>
            <th scope="col" className="py-3 px-3 font-medium">Name</th>
            <th scope="col" className="py-3 px-3 font-medium">Phone</th>
            <th scope="col" className="py-3 px-3 font-medium">Username / Email</th>
            <th scope="col" className="w-28 py-3 px-3 font-medium">Status</th>
            <th scope="col" className="py-3 pl-3 pr-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {members.map((m) => {
            const phoneDisplay = m.phoneNumber || m.phone
            return (
              <tr key={m.id} className={`hover:bg-slate-50/50 ${m.isActive ? '' : 'text-slate-500'}`}>
                <td className="py-3 px-3 text-center">
                  <div className="flex justify-center">
                    <Avatar src={m.profileImageUrl} name={m.name} size="sm" />
                  </div>
                </td>
                <td className="py-3 px-3 font-medium">
                  <button
                    type="button"
                    onClick={() => onView(m)}
                    className="max-w-full truncate text-left font-medium text-slate-900 hover:text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  >
                    {m.name}
                  </button>
                </td>
                <td className="py-3 px-3 tabular-nums text-slate-600">
                  {phoneDisplay ? (
                    <span className="font-medium text-slate-800">{phoneDisplay}</span>
                  ) : (
                    <span className="text-slate-400 italic">Not added</span>
                  )}
                </td>
                <td className="truncate py-3 px-3 text-slate-600" title={m.email}>
                  {m.email}
                </td>
                <td className="py-3 px-3">
                  <MemberStatusBadge isActive={m.isActive} />
                </td>
                <td className="py-3 pl-3 pr-3">
                  <MemberActions
                    member={m}
                    busy={busyId === m.id}
                    onEdit={onEdit}
                    onDeactivate={onDeactivate}
                    onActivate={onActivate}
                    compact
                    className="flex justify-end gap-2"
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
