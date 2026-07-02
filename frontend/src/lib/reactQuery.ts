import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false, // Không auto tải lại khi chuyển tab
            retry: 1,                    // gọi API lỗi thì chi gọi lại 1 lần
            staleTime: 5000,
        },
    },
});
