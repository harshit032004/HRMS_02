import { useState } from 'react';
import api from '../../utils/api';

const PIPELINE_STAGES = ['Applied', 'Screening', 'Interview', 'Selected', 'Rejected'];

const STAGE_CONFIG = {
  Applied:   { color: 'bg-blue-50 dark:bg-blue-500/10',    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',    dot: 'bg-blue-400',   border: 'border-blue-200 dark:border-blue-500/20' },
  Screening: { color: 'bg-amber-50 dark:bg-amber-500/10',  badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400', dot: 'bg-amber-400',  border: 'border-amber-200 dark:border-amber-500/20' },
  Interview: { color: 'bg-purple-50 dark:bg-purple-500/10',badge: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',dot: 'bg-purple-400',border: 'border-purple-200 dark:border-purple-500/20' },
  Selected:  { color: 'bg-emerald-50 dark:bg-emerald-500/10', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400', dot: 'bg-emerald-400', border: 'border-emerald-200 dark:border-emerald-500/20' },
  Rejected:  { color: 'bg-red-50 dark:bg-red-500/10',      badge: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',        dot: 'bg-red-400',    border: 'border-red-200 dark:border-red-500/20' },
};

function CandidateCard({ candidate, onStatusChange, onEdit }) {
  const [updating, setUpdating] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const cfg = STAGE_CONFIG[candidate.status];

  const moveTo = async (newStatus) => {
    if (newStatus === candidate.status) return;
    setUpdating(true);
    try {
      await onStatusChange(candidate._id, newStatus);
    } finally {
      setUpdating(false);
      setShowActions(false);
    }
  };

  const initials = candidate.name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.color} p-3 transition-all duration-150 hover:shadow-sm`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{candidate.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{candidate.email}</p>
          </div>
        </div>
      </div>

      {/* Job badge */}
      {candidate.appliedJob && (
        <div className="mb-2">
          <span className="inline-block text-xs px-2 py-0.5 bg-white dark:bg-white/10 rounded-md text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10 truncate max-w-full">
            {candidate.appliedJob.title}
          </span>
        </div>
      )}

      {/* Phone */}
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{candidate.phone}</p>

      {/* Actions row */}
      <div className="flex items-center gap-2">
        {candidate.resumeLink && (
          <a
            href={candidate.resumeLink}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Resume ↗
          </a>
        )}
        <div className="relative ml-auto">
          <button
            onClick={() => setShowActions(!showActions)}
            disabled={updating}
            className="text-xs px-2 py-1 rounded-md bg-white dark:bg-white/10 border border-gray-200 
              dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 
              dark:hover:bg-white/15 transition-colors disabled:opacity-50"
          >
            {updating ? '...' : 'Move →'}
          </button>
          {showActions && (
            <div className="absolute right-0 bottom-8 z-10 bg-white dark:bg-[#1a2235] border border-gray-200 
              dark:border-white/10 rounded-lg shadow-lg py-1 min-w-32">
              {PIPELINE_STAGES.filter(s => s !== candidate.status).map(stage => (
                <button
                  key={stage}
                  onClick={() => moveTo(stage)}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 
                    hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${STAGE_CONFIG[stage].dot}`} />
                  {stage}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => onEdit(candidate)}
          className="text-xs px-2 py-1 rounded-md text-gray-400 dark:text-gray-500 hover:text-indigo-600 
            dark:hover:text-indigo-400 transition-colors"
        >
          Edit
        </button>
      </div>
    </div>
  );
}

export default function CandidatePipeline({ candidates, onStatusChange, onEdit }) {
  const byStage = (stage) => candidates.filter(c => c.status === stage);

  return (
    <div className="grid grid-cols-5 gap-3 min-w-0">
      {PIPELINE_STAGES.map(stage => {
        const stageCandidates = byStage(stage);
        const cfg = STAGE_CONFIG[stage];
        return (
          <div key={stage} className="flex flex-col gap-2 min-w-0">
            {/* Column header */}
            <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${cfg.color} border ${cfg.border}`}>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{stage}</span>
              </div>
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${cfg.badge}`}>
                {stageCandidates.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-2">
              {stageCandidates.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-400 dark:text-gray-600">
                  No candidates
                </div>
              ) : (
                stageCandidates.map(c => (
                  <CandidateCard
                    key={c._id}
                    candidate={c}
                    onStatusChange={onStatusChange}
                    onEdit={onEdit}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { PIPELINE_STAGES, STAGE_CONFIG };
