import { Link } from 'react-router-dom';

/**
 * Breadcrumb component
 *
 * Props:
 *   crumbs – array of { label, path? }
 *            The last item should omit `path` (current page).
 *            "Home" → /dashboard is always prepended automatically.
 *
 * Example:
 *   <Breadcrumb crumbs={[{ label: 'Employees', path: '/employees' }, { label: 'Harshit Verma' }]} />
 *   Renders: Home > Employees > Harshit Verma
 */
export default function Breadcrumb({ crumbs = [] }) {
  const all = [{ label: 'Home', path: '/dashboard' }, ...crumbs];

  return (
    <nav aria-label="breadcrumb" className="flex items-center flex-wrap gap-0.5 mb-4">
      {all.map((crumb, index) => {
        const isLast = index === all.length - 1;
        return (
          <span key={index} className="flex items-center gap-0.5">
            {/* Separator — skip before first item */}
            {index > 0 && (
              <svg
                className="w-3 h-3 text-gray-300 dark:text-gray-600 flex-shrink-0 mx-0.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            )}

            {isLast || !crumb.path ? (
              /* Current page — no link, primary color */
              <span
                className="text-[12px] font-medium text-indigo-600 dark:text-indigo-400 max-w-[200px] truncate"
                aria-current="page"
              >
                {crumb.label}
              </span>
            ) : (
              /* Ancestor — linked, muted color */
              <Link
                to={crumb.path}
                className="text-[12px] font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-150 max-w-[160px] truncate"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
