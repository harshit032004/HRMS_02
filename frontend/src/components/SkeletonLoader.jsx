/**
 * SkeletonLoader — Reusable shimmer skeleton for Radian HRMS
 *
 * Props:
 *   variant   "card" | "table" | "text"   (default: "card")
 *   rows      number   — used by "table" to control row count (default: 5)
 *   cols      number   — used by "table" to control col count (default: 6)
 *   className string   — extra Tailwind classes appended to the root element
 */

const cx = (...cls) => cls.filter(Boolean).join(' ');

/* ─── Base shimmer bar ──────────────────────────────────────────── */
function ShimmerBar({ className = '', style = {} }) {
  return (
    <div
      className={cx('relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800/70', className)}
      style={style}
    >
      {/* Sweeping highlight overlay */}
      <div className="shimmer-sweep absolute inset-0" />
    </div>
  );
}

/* ─── card variant ──────────────────────────────────────────────── */
function SkeletonCard({ className = '' }) {
  return (
    <div
      className={cx(
        'bg-white dark:bg-[#111827] rounded-2xl p-5',
        'border border-gray-100 dark:border-white/5',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: label + value + sub */}
        <div className="flex-1 space-y-2.5 min-w-0">
          <ShimmerBar className="h-2.5 w-24" />
          <ShimmerBar className="h-7 w-14" />
          <ShimmerBar className="h-2 w-20" />
        </div>
        {/* Right: icon square */}
        <ShimmerBar className="w-10 h-10 rounded-xl flex-shrink-0" />
      </div>
    </div>
  );
}

/* ─── table variant ─────────────────────────────────────────────── */
// Column widths (px) that mirror the real employee / goals tables
const COL_WIDTHS = [44, 160, 100, 100, 72, 72];

function SkeletonTable({ rows = 5, cols = 6, className = '' }) {
  const widths = COL_WIDTHS.slice(0, cols);

  return (
    <div
      className={cx(
        'bg-white dark:bg-[#111827] rounded-2xl',
        'border border-gray-100 dark:border-white/5 overflow-hidden',
        className
      )}
    >
      {/* Card header bar */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center gap-4">
        <ShimmerBar className="h-4 w-36" />
        <ShimmerBar className="h-4 w-24 ml-auto" />
      </div>

      {/* Skeleton rows */}
      <div className="divide-y divide-gray-50 dark:divide-white/[0.03]">
        {[...Array(rows)].map((_, rowIdx) => (
          <div
            key={rowIdx}
            className="px-5 py-3.5 flex items-center gap-5"
          >
            {widths.map((w, colIdx) => (
              <ShimmerBar
                key={colIdx}
                className="h-4 flex-shrink-0"
                style={{ width: w }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── text variant ──────────────────────────────────────────────── */
function SkeletonText({ className = '' }) {
  return <ShimmerBar className={cx('h-4 w-28 inline-block', className)} />;
}

/* ─── Public export ─────────────────────────────────────────────── */
export default function SkeletonLoader({
  variant = 'card',
  rows = 5,
  cols = 6,
  className = '',
}) {
  if (variant === 'table') return <SkeletonTable rows={rows} cols={cols} className={className} />;
  if (variant === 'text')  return <SkeletonText className={className} />;
  return <SkeletonCard className={className} />;
}
