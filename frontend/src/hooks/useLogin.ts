import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { loginSchema } from "../schemas/auth.schema"
import { useAuthStore } from "../stores/auth.store"
import { login } from "../services/authService"
import { getRoleHomeRoute } from "../constants"
import { getApiErrorMessage } from "../utils/apiError"

interface LoginForm {
  username: string
  password: string
}

export function useLogin() {
  const navigate = useNavigate()
  const { token, role, setAuth } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (token && role) {
      navigate(getRoleHomeRoute(role), { replace: true })
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
    onSuccess: (result, variables) => {
      const username = variables.username.trim()
      setAuth(result.token, result.role, username)
      toast.success("Đăng nhập thành công!")
      navigate(getRoleHomeRoute(result.role))
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Đăng nhập thất bại!"))
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
