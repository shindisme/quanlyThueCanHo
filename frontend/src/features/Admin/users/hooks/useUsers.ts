import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../../../constants/queryKeys";
import { authService } from "../../../../services";
import type { User } from "../../../../types";

export function useUsers() {
  return useQuery({
    queryKey: QUERY_KEYS.USERS,
    queryFn: () => authService.getAllPage(),
    select: (res) => (res?.data || []) as User[],
  });
}
