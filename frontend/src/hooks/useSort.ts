import React, { useState, useMemo } from "react";
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
    if (!sortConfig) return items;

    const getNestedValue = (obj: T, path: string): unknown => {
      if (customExtractors && customExtractors[path]) {
        try {
          return customExtractors[path](obj);
        } catch {
          return undefined;
        }
      }
      if (!obj) return undefined;
      return path.split(".").reduce<unknown>((acc, part) => {
        if (acc && typeof acc === "object" && part in acc) {
          return (acc as Record<string, unknown>)[part];
        }
        return undefined;
      }, obj);
    };

    const sorted = [...items].sort((a, b) => {
      const aVal = getNestedValue(a, sortConfig.key);
      const bVal = getNestedValue(b, sortConfig.key);

      // Handle null/undefined values
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      // Handle boolean
      if (typeof aVal === "boolean" && typeof bVal === "boolean") {
        if (aVal === bVal) return 0;
        return sortConfig.direction === "asc"
          ? (aVal ? 1 : -1)
          : (bVal ? 1 : -1);
      }

      // Only compare as number if both are actual numbers or non-empty numeric strings
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

  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key) {
      direction = sortConfig.direction === "asc" ? "desc" : "asc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return React.createElement(ChevronsUpDown, { size: 14, className: "inline-block ml-1 text-gray-300 align-middle shrink-0" });
    }
    return sortConfig.direction === "asc"
      ? React.createElement(ChevronUp, { size: 14, className: "inline-block ml-1 text-primary-600 align-middle shrink-0 font-bold" })
      : React.createElement(ChevronDown, { size: 14, className: "inline-block ml-1 text-primary-600 align-middle shrink-0 font-bold" });
  };

  return { items: sortedItems, requestSort, getSortIcon, sortConfig, setSortConfig };
}
