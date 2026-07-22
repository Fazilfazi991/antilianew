interface PaginationProps {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}

function getPageNumbers(page: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 6) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (page <= 3) {
    return [1, 2, 3, 'ellipsis', totalPages];
  }

  if (page >= totalPages - 2) {
    return [1, 'ellipsis', totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, 'ellipsis', page, 'ellipsis', totalPages];
}

export function Pagination({ page, totalPages, onPage }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(page, totalPages);

  return (
    <nav className="mt-12 flex flex-col items-center gap-4" aria-label="Properties pagination">
      <p className="font-label-caps text-label-caps text-outline uppercase tracking-[0.1em]">
        Page {page} of {totalPages}
      </p>

      <div className="flex max-w-full flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="inline-flex h-10 items-center rounded-full border border-surface-variant px-4 font-label-caps text-label-caps uppercase tracking-[0.08em] text-on-surface-variant transition-colors hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-35 sm:h-12 sm:px-6"
        >
          Previous
        </button>

        {pages.map((item, i) => (
          item === 'ellipsis' ? (
            <span
              key={`ellipsis-${i}`}
              className="inline-flex h-10 min-w-8 items-center justify-center font-label-caps text-label-caps text-outline sm:h-12 sm:min-w-10"
            >
              ...
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPage(item)}
              aria-current={item === page ? 'page' : undefined}
              className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full font-label-caps text-label-caps transition-colors sm:h-12 sm:min-w-12 ${
                item === page
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-primary hover:bg-surface-container-high'
              }`}
            >
              {item}
            </button>
          )
        ))}

        <button
          type="button"
          onClick={() => onPage(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="inline-flex h-10 items-center rounded-full border border-surface-variant px-4 font-label-caps text-label-caps uppercase tracking-[0.08em] text-primary transition-colors hover:border-primary hover:bg-surface-container disabled:pointer-events-none disabled:opacity-35 sm:h-12 sm:px-6"
        >
          Next
        </button>
      </div>
    </nav>
  );
}
