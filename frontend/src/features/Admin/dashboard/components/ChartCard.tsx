interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export default function ChartCard({ title, subtitle, children, action }: ChartCardProps) {
  return (
    <section className="flex h-full flex-col justify-between rounded-none border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div>
        <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-gray-900">{title}</h3>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
        <div>{children}</div>
      </div>
    </section>
  );
}
