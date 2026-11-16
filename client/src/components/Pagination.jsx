import React from 'react';

/**
 * Reusable Pagination Component
 * Completely independent of specific API field names
 */
export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalRecords = 0,
  pageSize = 10,
  hasPreviousPage = false,
  hasNextPage = false,
  onPageChange,
}) {
  if (totalRecords === 0) return null;

  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  return (
    <div className="pagination">
      <div className="pagination-info">
        Showing <strong>{startRecord}</strong>–<strong>{endRecord}</strong> of <strong>{totalRecords}</strong> records
        {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
      </div>

      <div className="pagination-actions">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={!hasPreviousPage || currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          &larr; Previous
        </button>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={!hasNextPage || currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next &rarr;
        </button>
      </div>
    </div>
  );
}
