import { useQuery } from "@tanstack/react-query";
import { getAllUsersPage } from "../../../../services/authService";
import { QUERY_KEYS } from "../../../../constants/queryKeys";

export function useUsers() {
  return useQuery({
    queryKey: QUERY_KEYS.USERS,
    queryFn: () => getAllUsersPage(),
  });
}
