import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../../constants/queryKeys";
import { authService } from "../../../../services";
import type { User } from "../../../../types";

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users.all,
    queryFn: () => authService.getAllPage(),
    select: (res) => (res?.data || []) as User[],
  });
}
