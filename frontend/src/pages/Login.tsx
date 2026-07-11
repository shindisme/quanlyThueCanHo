import { Eye, EyeOff, User, Lock, Building2 } from "lucide-react"
import Button from "../components/ui/Button"
import { useLogin } from "../hooks/useLogin"

export default function Login() {
  const {
    register,
    handleSubmit,
    handleLogin,
    errors,
    showPassword,
    setShowPassword,
    isPending,
  } = useLogin()

  return (
    <div className="min-h-screen flex">
      {/* Left side - form đăng nhập */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-t-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)" }}>
              <Building2 size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">YuKi House</h1>
              <p className="text-xs text-gray-400">Quản lý cho thuê căn hộ</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(handleLogin)} className="space-y-5">
            {/* Username */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1.5 font-sans">
                <User size={18} className="inline-block text-gray-400 mr-2" />
                Tên đăng nhập
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Nhập tên đăng nhập"
                  {...register("email")}
                  className={`premium-input rounded-xl pl-11!
                    ${errors.email ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20" : ""}`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-danger-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1.5 font-sans">
                <Lock size={18} className="inline-block text-gray-400 mr-2" />
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu"
                  {...register("password")}
                  className={`premium-input rounded-xl pl-11! pr-12!
                    ${errors.password ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-danger-500">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              isLoading={isPending}
              className="w-full py-3 text-base"
              size="lg"
            >
              Đăng nhập
            </Button>
          </form>
        </div>
      </div>

      {/* Right side */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 40%, #4C1D95 100%)" }}>
        <div className="absolute top-20 left-20 w-72 h-72 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #A78BFA, transparent)" }} />
        <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #C4B5FD, transparent)" }} />
        <div className="absolute top-1/3 right-1/4 w-48 h-48 rounded-3xl rotate-45 opacity-10 bg-white" />
        <div className="relative z-10 text-center text-white px-12 max-w-lg">
          <div className="w-20 h-20 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-8 backdrop-blur-sm border border-white/20">
            <Building2 size={40} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4 capitalize font-sans">
            Hệ thống quản lý căn hộ thông minh
          </h2>
        </div>
      </div>
    </div>
  )
}