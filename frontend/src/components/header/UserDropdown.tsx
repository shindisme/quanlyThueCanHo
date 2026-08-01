import { useNavigate } from "react-router-dom";
import { User, LogOut, ChevronDown } from "lucide-react";
import { useAuthStore } from "../../stores/auth.store";
import { useHeaderUser } from "./hooks/useHeaderUser";
import Avatar from "../ui/Avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/DropdownMenu";

export function UserDropdown() {
  const { role, logout } = useAuthStore();
  const navigate = useNavigate();
  const { userFullName, accountUsername, roleLabel } = useHeaderUser();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleProfileClick = () => {
    const profilePath =
      role === "STAFF" || role === "MANAGER"
        ? "/manager/profile"
        : `/${(role || "TENANT").toLowerCase()}/profile`;
    navigate(profilePath);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2.5 p-1.5 pr-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-left">
        <Avatar name={userFullName} className="w-9 h-9 border border-gray-300 shrink-0" />
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-gray-800 leading-tight">{userFullName}</p>
          <p className="text-[11px] text-gray-400">{roleLabel}</p>
        </div>
        <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56 mt-2">
        {/* User info */}
        <div className="px-3 py-2 border-b border-gray-100 mb-1">
          <p className="text-sm font-semibold text-gray-800">{userFullName}</p>
          <p className="text-xs text-gray-400 mt-0.5">{accountUsername}</p>
        </div>

        {/* Menu items */}
        <DropdownMenuItem onClick={handleProfileClick} className="gap-3 px-3 py-2 cursor-pointer">
          <User size={16} className="text-gray-400" />
          Hồ sơ cá nhân
        </DropdownMenuItem>

        <div className="h-px bg-gray-100 my-1" />

        <DropdownMenuItem
          onClick={handleLogout}
          className="gap-3 px-3 py-2 text-danger-600 hover:bg-danger-50 hover:text-danger-700"
        >
          <LogOut size={16} />
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserDropdown;
