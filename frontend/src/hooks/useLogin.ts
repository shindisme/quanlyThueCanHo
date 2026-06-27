import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { loginSchema } from "../schemas/auth.schema"
import { useAuthStore } from "../stores/auth.store"
import { login } from "../services/authService"

interface LoginForm {
  email: string
  password: string
}

function resolveEmailFromUsername(username: string): string {
  return username.trim()
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
  const { setAuth } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginForm) {
    setIsLoading(true)
    try {
      const resolvedEmail = resolveEmailFromUsername(data.email)
      const result = await login(resolvedEmail, data.password)

      const decoded = parseJwt(result.token)
      let managedBuildingId: number | null = null
      let managedBuildingName: string | null = null

      if ((result.role === "MANAGER" || result.role === "STAFF") && decoded && decoded.userId) {
        try {
          const { getAllStaff } = await import("../services/staffService")
          const { getAllBuildings } = await import("../services/buildingService")

          const staffRes = await getAllStaff()
          const currentStaff = staffRes.data.find((s) => s.user_id === decoded.userId)

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

      setAuth(result.token, result.role, resolvedEmail, managedBuildingId, managedBuildingName)
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
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      const msg = err.response?.data?.error || "Đăng nhập thất bại!"
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    register,
    handleSubmit,
    onSubmit,
    errors,
    showPassword,
    setShowPassword,
    isLoading,
  }
}
