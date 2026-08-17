import { createContext, useContext } from "react";

export interface PageRefreshContextValue {
  refreshKey: number;
  refreshPage: () => Promise<void>;
}

export const PageRefreshContext = createContext<PageRefreshContextValue | null>(null);

export function usePageRefresh() {
  const context = useContext(PageRefreshContext);

  if (!context) {
    throw new Error("usePageRefresh must be used within PageRefreshProvider");
  }

  return context;
}
