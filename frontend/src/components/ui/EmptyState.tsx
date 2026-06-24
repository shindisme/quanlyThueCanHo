import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export default function EmptyState({
  title = "Khong co du lieu",
  description = "Chua co du lieu nao de hien thi.",
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-gray-300">
        {icon || <Inbox size={48} />}
      </div>
      <h3 className="text-lg font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-sm text-gray-400 mb-4 max-w-sm">{description}</p>
      {action}
    </div>
  );
}
