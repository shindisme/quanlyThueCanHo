import type { ReactNode } from "react";
import RefreshButton from "../ui/RefreshButton";

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
    <div className="mb-6 flex min-w-0 flex-col gap-4 md:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-baseline gap-2 text-xl font-bold text-gray-800 sm:text-2xl">
            {title}
            {count !== undefined && (
              <span className="text-sm font-normal text-gray-400">({count})</span>
            )}
          </h1>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>

        <div className="flex w-full min-w-0 flex-wrap items-center gap-3 sm:w-auto">
          <RefreshButton />
          {actions}
        </div>
      </div>

      {children && <div className="w-full">{children}</div>}
    </div>
  );
}

export default PageHeader;
