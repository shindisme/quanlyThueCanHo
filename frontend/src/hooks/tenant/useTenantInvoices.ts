import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as invoiceService from "../../services/invoiceService";

type SortKey = "invoice_code" | "billing_month" | "total" | "status" | "due_date";

export function useTenantInvoices() {
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "asc" | "desc" } | null>(null);

  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => invoiceService.getAllInvoices({ limit: 100 }),
  });
  const invoices = invoicesData?.data || [];

  const myInvoices = invoices;

  const requestSort = (key: SortKey) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  return {
    search,
    setSearch,
    sortConfig,
    requestSort,
    myInvoices,
    isLoading,
  };
}
