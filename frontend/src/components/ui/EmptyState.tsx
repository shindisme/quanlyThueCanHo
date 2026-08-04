import React from "react";
import { Inbox } from "lucide-react";
import { cn } from "../../lib/utils";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({
  title = "Không có dữ liệu",
  description = "Chưa có dữ liệu nào để hiển thị.",
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center bg-white border border-gray-200 rounded-none", className)}>
      <div className="mb-3 text-gray-300">
        {icon || <Inbox size={48} />}
      </div>
      <p className="font-medium text-gray-600 text-base mb-1">{title}</p>
      <p className="text-sm text-gray-400 max-w-sm mb-2">{description}</p>
      {action}
    </div>
  );
}
