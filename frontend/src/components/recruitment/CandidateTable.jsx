import { STAGE_CONFIG } from './CandidatePipeline';

export default function CandidateTable({ candidates, onStatusChange, onEdit, onDelete }) {
  if (candidates.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 dark:text-gray-600">
        <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="text-sm">No candidates found</p>
      </div>
    );
  }

  const NEXT_STATUS = {
    Applied:   'Screening',
    Screening: 'Interview',
    Interview: 'Selected',
    Selected:  null,
    Rejected:  null,
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 dark:border-white/5">
            {['Candidate', 'Applied For', 'Contact', 'Status', 'Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-white/5">
          {candidates.map(candidate => {
            const cfg = STAGE_CONFIG[candidate.status];
            const nextStatus = NEXT_STATUS[candidate.status];
            const initials = candidate.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

            return (
              <tr key={candidate._id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                {/* Candidate info */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {initials}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{candidate.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{candidate.email}</p>
                    </div>
                  </div>
                </td>

                {/* Applied job */}
                <td className="px-4 py-3">
                  <p className="text-gray-700 dark:text-gray-300">{candidate.appliedJob?.title || '—'}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{candidate.appliedJob?.department || ''}</p>
                </td>

                {/* Contact */}
                <td className="px-4 py-3">
                  <p className="text-gray-700 dark:text-gray-300">{candidate.phone}</p>
                  {candidate.resumeLink && (
                    <a
                      href={candidate.resumeLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      View Resume ↗
                    </a>
                  )}
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {candidate.status}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {nextStatus && (
                      <button
                        onClick={() => onStatusChange(candidate._id, nextStatus)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 
                          text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 
                          font-medium transition-colors"
                      >
                        → {nextStatus}
                      </button>
                    )}
                    <button
                      onClick={() => onStatusChange(candidate._id, 'Rejected')}
                      disabled={candidate.status === 'Rejected'}
                      className="text-xs px-2.5 py-1 rounded-lg text-red-500 dark:text-red-400 
                        hover:bg-red-50 dark:hover:bg-red-500/10 font-medium transition-colors 
                        disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => onEdit(candidate)}
                      className="text-xs px-2.5 py-1 rounded-lg text-gray-500 dark:text-gray-400 
                        hover:bg-gray-100 dark:hover:bg-white/5 font-medium transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(candidate._id)}
                      className="text-xs px-2.5 py-1 rounded-lg text-gray-400 dark:text-gray-600 
                        hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 
                        transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
