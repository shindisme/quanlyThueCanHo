import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../../../constants/queryKeys";
import { authService } from "../../../../services";

export function useUsers() {
  return useQuery({
    queryKey: QUERY_KEYS.USERS,
    queryFn: () => authService.getAllPage(),
  });
}
