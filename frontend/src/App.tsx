import { Suspense } from "react";
import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/reactQuery";
import router from "./routes";
import { Toaster } from "sonner";
import LoadingSpinner from "./components/ui/LoadingSpinner";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense
        fallback={(
          <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <LoadingSpinner size={32} />
          </div>
        )}
      >
        <RouterProvider router={router} />
      </Suspense>
      <Toaster position="top-right" richColors duration={2000} />
    </QueryClientProvider>
  );
}
