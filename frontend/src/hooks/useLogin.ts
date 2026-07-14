import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { loginSchema } from "../schemas/auth.schema"
import { useAuthStore } from "../stores/auth.store"
import { login } from "../services/authService"

interface LoginForm {
  username: string
  password: string
}

function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
        })
        .join("")
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

export function useLogin() {
  const navigate = useNavigate()
  const { token, role, setAuth } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (token) {
      const redirectPath =
        role === "ADMIN"
          ? "/admin/dashboard"
          : role === "MANAGER" || role === "STAFF"
            ? "/manager/dashboard"
            : "/tenant/home"
      navigate(redirectPath, { replace: true })
    }
  }, [token, role, navigate])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const loginMutation = useMutation({
    mutationFn: (data: LoginForm) => login(data.username.trim(), data.password),
    onSuccess: async (result, variables) => {
      const username = variables.username.trim()
      const decoded = parseJwt(result.token)
      const userId = decoded ? (decoded.userId ? Number(decoded.userId) : (decoded.sub ? Number(decoded.sub) : null)) : null
      let managedBuildingId: number | null = null
      let managedBuildingName: string | null = null

      if ((result.role === "MANAGER" || result.role === "STAFF") && userId) {
        try {
          const { getAllStaff } = await import("../services/staffService")
          const { getAllBuildings } = await import("../services/buildingService")

          const staffRes = await getAllStaff()
          const currentStaff = staffRes.data.find((s) => s.user_id === userId)

          if (currentStaff && currentStaff.building_id) {
            managedBuildingId = currentStaff.building_id

            // Get building name
            const buildingsRes = await getAllBuildings()
            const currentBld = buildingsRes.data.find((b) => b.id === managedBuildingId)
            if (currentBld) {
              managedBuildingName = currentBld.branch_name
            }
          }
        } catch (err) {
          console.error("Lỗi khi lấy thông tin tòa nhà quản lý:", err)
        }
      }

      setAuth(result.token, result.role, username, managedBuildingId, managedBuildingName)
      toast.success("Đăng nhập thành công!")

      switch (result.role) {
        case "ADMIN":
          navigate("/admin/dashboard")
          break
        case "MANAGER":
        case "STAFF":
          navigate("/manager/dashboard")
          break
        case "TENANT":
          navigate("/tenant/home")
          break
        default:
          navigate("/")
      }
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } };
      const msg = err.response?.data?.error || "Đăng nhập thất bại!"
      toast.error(msg)
    }
  })

  const handleLogin = (data: LoginForm) => {
    loginMutation.mutate(data)
  }

  return {
    register,
    handleSubmit,
    handleLogin,
    errors,
    showPassword,
    setShowPassword,
    isPending: loginMutation.isPending,
  }
}
