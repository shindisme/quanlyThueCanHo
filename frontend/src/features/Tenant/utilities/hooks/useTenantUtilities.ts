import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../../constants/queryKeys";
import { useDebounce } from "../../../../hooks/useDebounce";
import { usePagination } from "../../../../hooks/usePagination";
import { useSort } from "../../../../hooks/useSort";
import * as contractService from "../../../../services/contractService";
import * as utilityService from "../../../../services/utilityService";
import type { UtilityReadingData } from "../../../../types";
import { removeVietnameseTones } from "../../../../utils/string";

export function useTenantUtilities() {
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const contractsQuery = useQuery({
    queryKey: queryKeys.contracts.list({ scope: "tenant", status: "ACTIVE" }),
    queryFn: () => contractService.getAllPage({ status: "ACTIVE" }),
    select: (response) => response.data,
  });
  const activeContract = contractsQuery.data?.[0] ?? null;

  const readingsQuery = useQuery({
    queryKey: queryKeys.utilities.tenantList({
      contractId: activeContract?.id,
      month: monthFilter,
      year: yearFilter,
    }),
    queryFn: () => utilityService.getMyUtilityReadingsPage({
      month: monthFilter ? Number(monthFilter) : undefined,
      year: yearFilter ? Number(yearFilter) : undefined,
    }),
    enabled: Boolean(activeContract),
  });
  const readings = useMemo(() => readingsQuery.data ?? [], [readingsQuery.data]);
  const filteredReadings = useMemo(() => {
    const keyword = removeVietnameseTones(debouncedSearch.trim().toLowerCase());
    if (!keyword) return readings;
    return readings.filter((reading) =>
      removeVietnameseTones(
        [`thang ${reading.month}`, reading.year, reading.staff?.full_name]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
      ).includes(keyword)
    );
  }, [debouncedSearch, readings]);

  const { items: sortedReadings, requestSort, sortConfig } = useSort<UtilityReadingData>(
    filteredReadings,
    { key: "period", direction: "desc" },
    {
      period: (reading) => reading.year * 100 + reading.month,
      electric_consumption: (reading) => reading.electric_consumption ?? 0,
      water_consumption: (reading) => reading.water_consumption ?? 0,
      staff_name: (reading) => reading.staff?.full_name ?? "",
    }
  );
  const { currentPage, setCurrentPage, totalPages, startIdx, endIdx } = usePagination({
    totalItems: sortedReadings.length,
    initialPageSize: 10,
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, monthFilter, setCurrentPage, yearFilter]);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = new Set(readings.map((reading) => reading.year));
    years.add(currentYear);
    return Array.from(years)
      .sort((a, b) => b - a)
      .map((year) => ({ value: String(year), label: `Năm ${year}` }));
  }, [readings]);

  return {
    apartment: activeContract?.apartment || readings[0]?.apartment || null,
    readings: sortedReadings.slice(startIdx, endIdx),
    readingCount: filteredReadings.length,
    activeContract,
    isLoading: contractsQuery.isLoading || (Boolean(activeContract) && readingsQuery.isLoading),
    error: contractsQuery.error || readingsQuery.error,
    refetch: async () => {
      await Promise.all([contractsQuery.refetch(), readingsQuery.refetch()]);
    },
    search,
    setSearch,
    monthFilter,
    setMonthFilter,
    yearFilter,
    setYearFilter,
    yearOptions,
    requestSort,
    sortConfig,
    currentPage,
    setCurrentPage,
    totalPages,
    startIdx,
  };
}
