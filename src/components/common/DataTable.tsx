import React from 'react';

export interface Column<T> {
  key: string;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyText?: string;
  emptyIcon?: string;
  rowKey: keyof T;
  selectedIds?: string[];
  onSelect?: (id: string) => void;
  onSelectAll?: () => void;
  onRowClick?: (row: T) => void;
}

function DataTable<T extends Record<string, any>>({
  columns, data, loading, emptyText = 'No data found', emptyIcon = '📦',
  rowKey, selectedIds, onSelect, onSelectAll, onRowClick,
}: DataTableProps<T>) {
  const allSelected = data.length > 0 && selectedIds?.length === data.length;
  const someSelected = selectedIds && selectedIds.length > 0 && !allSelected;

  if (loading) {
    return (
      <div className="empty-state">
        <div className="spinner spinner-lg" />
        <p className="empty-text">Loading...</p>
      </div>
    );
  }

  if (!loading && data.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">{emptyIcon}</div>
        <p className="empty-text">{emptyText}</p>
        <p className="empty-sub">No records match your filters</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {onSelect && (
              <th style={{ width: 40 }}>
                <div
                  className={`checkbox ${allSelected ? 'checked' : someSelected ? 'inter' : ''}`}
                  onClick={onSelectAll}
                  style={{ cursor: 'pointer' }}
                >
                  {allSelected ? '✓' : someSelected ? '−' : ''}
                </div>
              </th>
            )}
            {columns.map((col) => (
              <th key={col.key} style={col.width ? { width: col.width } : {}}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const id = String(row[rowKey]);
            const isSelected = selectedIds?.includes(id);
            return (
              <tr
                key={id}
                onClick={() => onRowClick?.(row)}
                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
              >
                {onSelect && (
                  <td onClick={(e) => { e.stopPropagation(); onSelect(id); }}>
                    <div className={`checkbox ${isSelected ? 'checked' : ''}`}>
                      {isSelected ? '✓' : ''}
                    </div>
                  </td>
                )}
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
