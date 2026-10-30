import { catalogHref, type MonsterFilters } from "@/lib/queries/filters";

export function Pagination({
  filters,
  page,
  pageCount,
}: {
  filters: MonsterFilters;
  page: number;
  pageCount: number;
}) {
  if (pageCount <= 1) {
    return null;
  }
  return (
    <nav className="flex items-center justify-between gap-3 text-sm" aria-label="分頁">
      {page > 1 ? (
        <a className="rounded border border-line px-3 py-2" href={catalogHref(filters, page - 1)}>
          上一頁
        </a>
      ) : (
        <span />
      )}
      <span className="text-muted">
        {page} / {pageCount}
      </span>
      {page < pageCount ? (
        <a className="rounded border border-line px-3 py-2" href={catalogHref(filters, page + 1)}>
          下一頁
        </a>
      ) : (
        <span />
      )}
    </nav>
  );
}
