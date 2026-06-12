import { Navigate } from "react-router-dom";
import { useAuthStore } from "../stores/auth.store";

export default function ProtectedRoute(
    { children, }: { children: React.ReactNode; }
) {
    const token = useAuthStore((state) => state.token);

    if (!token) {
        return <Navigate to='/login' />;
    }
    return children;
}