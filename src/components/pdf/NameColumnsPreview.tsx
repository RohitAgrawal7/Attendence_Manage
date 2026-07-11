import type { ReactNode } from 'react';

interface NameColumnsPreviewProps {
  heading: string;
  headers: string[];
  rows: string[][];
  /** optional header override (e.g. Sunday 1..4) */
  headerLabels?: string[];
  footer?: ReactNode;
}

export function NameColumnsPreview({
  heading,
  headers,
  rows,
  headerLabels,
  footer,
}: NameColumnsPreviewProps) {
  const cols = headers.length;
  const safeHeaderLabels = headerLabels && headerLabels.length === cols ? headerLabels : headers;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {heading}
      </p>

      <div className="overflow-x-auto">
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(140px, 1fr))` }}
        >
          {safeHeaderLabels.map((label, colIdx) => (
            <div key={`${label}-${colIdx}`} className="min-w-[140px]">
              <p className="mb-2 text-sm font-bold text-primary">{label}</p>
              <div className="h-64 overflow-auto rounded-xl border border-gray-200 bg-gray-50/40 p-2">
                {rows.length === 0 ? (
                  <p className="text-sm text-gray-400">No names</p>
                ) : (
                  <ul className="space-y-1">
                    {rows.map((r, i) => {
                      const name = r[colIdx] ?? '';
                      if (!name) return null;
                      return (
                        <li key={`${colIdx}-${i}`} className="text-sm text-gray-800">
                          {name}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {footer ? <div className="mt-2">{footer}</div> : null}
    </div>
  );
}

