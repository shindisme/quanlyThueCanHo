import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PageRefreshContext } from "./pageRefresh";

export function PageRefreshProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshPage = useCallback(async () => {
    await queryClient.refetchQueries({ type: "active" });
    setRefreshKey((currentKey) => currentKey + 1);
  }, [queryClient]);

  const value = useMemo(
    () => ({ refreshKey, refreshPage }),
    [refreshKey, refreshPage],
  );

  return (
    <PageRefreshContext.Provider value={value}>
      {children}
    </PageRefreshContext.Provider>
  );
}
