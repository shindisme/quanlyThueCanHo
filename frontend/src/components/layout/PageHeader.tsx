import type { ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  count?: number;
  actions?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  count,
  actions,
  children,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 mb-8 md:mb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            {title}
            {count !== undefined && (
              <span className="text-sm font-normal text-gray-400">({count})</span>
            )}
          </h1>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>

        {actions && <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">{actions}</div>}
      </div>

      {children && <div className="w-full">{children}</div>}
    </div>
  );
}

export default PageHeader;
