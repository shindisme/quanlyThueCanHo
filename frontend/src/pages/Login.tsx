import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { loginSchema } from "../schemas/auth.schema";
import { useAuthStore } from "../stores/auth.store";
import { findUserByCredentials } from "../data/users";
import Button from "../components/common/ui/Button";

// Du lieu form login
interface LoginForm {
  email: string;
  password: string;
}

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginForm) {
    setIsLoading(true);

    // Gia lap thoi gian goi API
    await new Promise((r) => setTimeout(r, 800));

    // Tim user trong mock data
    const user = findUserByCredentials(data.email, data.password);

    if (!user) {
      toast.error("Email hoac mat khau khong chinh xac!");
      setIsLoading(false);
      return;
    }

    // Luu thong tin dang nhap
    const mockToken = "mock-jwt-token-" + user.id;
    setAuth(mockToken, user);

    toast.success("Dang nhap thanh cong!");

    // Chuyen huong theo role
    switch (user.role) {
      case "ADMIN":
        navigate("/admin/dashboard");
        break;
      case "MANAGER":
        navigate("/manager/dashboard");
        break;
      case "TENANT":
        navigate("/tenant/home");
        break;
      default:
        navigate("/");
    }

    setIsLoading(false);
  }

  return (
    <div className="min-h-screen flex bg-background">


      {/* Left side */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-primary-600 relative overflow-hidden">
        {/* Image */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary-500 rounded-full opacity-30" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary-700 rounded-full opacity-20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary-400 rounded-3xl rotate-45 opacity-20" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center text-white px-12 max-w-lg">
          <h2 className="text-3xl font-bold mb-4">
            Hệ thống quản lý cho thuê căn hộ YuKi Home
          </h2>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1/6 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">

            <div>
              <h1 className="text-2xl font-bold text-primary-600">YuKi Home</h1>
              <p className="text-xs font-bold text-black">
                Quản lý cho thuê căn hộ
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  {...register("email")}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors ${errors.email ? "border-danger-500" : "border-gray-300"
                    }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-danger-500">{errors.email.message}</p>
              )}
            </div>

            {/* Mat khau */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Mat khau
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhap mat khau"
                  {...register("password")}
                  className={`w-full pl-10 pr-12 py-3 rounded-xl border text-sm bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors ${errors.password ? "border-danger-500" : "border-gray-300"
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-danger-500">{errors.password.message}</p>
              )}
            </div>

            {/* Ghi nho & Quen mat khau */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600">Ghi nho dang nhap</span>
              </label>
              <button type="button" className="text-sm text-primary-600 hover:underline cursor-pointer">
                Quen mat khau?
              </button>
            </div>

            {/* Nut dang nhap */}
            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full py-3"
              size="lg"
            >
              Dang nhap
            </Button>
          </form>

          {/* Tai khoan demo */}
          <div className="mt-8 p-4 bg-primary-50 rounded-xl">
            <p className="text-xs font-medium text-primary-700 mb-2">Tai khoan demo:</p>
            <div className="space-y-1 text-xs text-primary-600">
              <p>Admin: admin@dukihome.vn</p>
              <p>Manager: manager.a@dukihome.vn</p>
              <p>Tenant: an.nguyen@gmail.com</p>
              <p className="text-gray-400 mt-1">Mat khau: bat ky</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}