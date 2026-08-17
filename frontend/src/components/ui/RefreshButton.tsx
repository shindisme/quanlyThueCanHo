import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { cn } from "../../lib/utils";

interface RefreshButtonProps {
  className?: string;
  title?: string;
}

export default function RefreshButton({
  className,
  title = "Làm mới",
}: RefreshButtonProps) {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      await queryClient.refetchQueries({ type: "active" });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleRefresh}
      disabled={isRefreshing}
      aria-label={title}
      title={title}
      className={cn(
        "p-2.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer disabled:cursor-wait disabled:opacity-60",
        className,
      )}
    >
      <RefreshCw
        size={20}
        aria-hidden="true"
        className={cn("transition-transform", isRefreshing && "animate-spin text-primary-600")}
      />
    </button>
  );
}

