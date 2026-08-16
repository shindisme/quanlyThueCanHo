import React, { useCallback, useMemo, useState } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

export interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

export function useSort<T>(
  items: T[],
  initialConfig: SortConfig | null = null,
  customExtractors?: Record<string, (item: T) => unknown>
) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(initialConfig);

  const sortedItems = useMemo(() => {
    const safeItems = Array.isArray(items) ? items : [];
    if (!sortConfig) return safeItems;

    const getNestedValue = (obj: T, path: string): unknown => {
      if (customExtractors && customExtractors[path]) {
        try {
          return customExtractors[path](obj);
        } catch {
          return undefined;
        }
      }
      if (!obj) return undefined;
      // STT is a presentation column, so use the stable entity id when users
      // request sorting by it. This keeps the behaviour consistent across all
      // tables without duplicating an extractor in every feature.
      if (path === "index" && typeof obj === "object") {
        const record = obj as Record<string, unknown>;
        return record.id ?? record.created_at;
      }
      return path.split(".").reduce<unknown>((acc, part) => {
        if (acc && typeof acc === "object" && part in acc) {
          return (acc as Record<string, unknown>)[part];
        }
        return undefined;
      }, obj);
    };

    const sorted = [...safeItems].sort((a, b) => {
      const aVal = getNestedValue(a, sortConfig.key);
      const bVal = getNestedValue(b, sortConfig.key);

      const aMissing = aVal === undefined || aVal === null;
      const bMissing = bVal === undefined || bVal === null;
      if (aMissing && bMissing) return 0;
      if (aMissing) return 1;
      if (bMissing) return -1;

      if (typeof aVal === "boolean" && typeof bVal === "boolean") {
        if (aVal === bVal) return 0;
        return sortConfig.direction === "asc"
          ? (aVal ? 1 : -1)
          : (bVal ? 1 : -1);
      }

      const isNumA = typeof aVal === "number" || (typeof aVal === "string" && aVal.trim() !== "" && !isNaN(Number(aVal)));
      const isNumB = typeof bVal === "number" || (typeof bVal === "string" && bVal.trim() !== "" && !isNaN(Number(bVal)));

      if (isNumA && isNumB) {
        const aNum = Number(aVal);
        const bNum = Number(bVal);
        return sortConfig.direction === "asc" ? aNum - bNum : bNum - aNum;
      }

      // Mặc định so sánh chuỗi
      const aStr = String(aVal).trim().toLowerCase();
      const bStr = String(bVal).trim().toLowerCase();
      return sortConfig.direction === "asc"
        ? aStr.localeCompare(bStr, "vi")
        : bStr.localeCompare(aStr, "vi");
    });

    return sorted;
  }, [items, sortConfig, customExtractors]);

  const requestSort = useCallback((key: string) => {
    setSortConfig((current) => ({
      key,
      direction: current?.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  const getSortIcon = useCallback((key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return React.createElement(ChevronsUpDown, { size: 14, className: "inline-block ml-1 text-gray-300 align-middle shrink-0" });
    }
    return sortConfig.direction === "asc"
      ? React.createElement(ChevronUp, { size: 14, className: "inline-block ml-1 text-primary-600 align-middle shrink-0 font-bold" })
      : React.createElement(ChevronDown, { size: 14, className: "inline-block ml-1 text-primary-600 align-middle shrink-0 font-bold" });
  }, [sortConfig]);

  return { items: sortedItems, requestSort, getSortIcon, sortConfig, setSortConfig };
}
