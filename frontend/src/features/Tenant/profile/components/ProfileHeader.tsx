import { Home, Lock, Pencil, Phone, User } from "lucide-react";
import Badge from "../../../../components/ui/Badge";
import { ROLE_CONFIG, type Role } from "../../../../constants";

export type ProfileTab = "info" | "security";

interface ProfileHeaderProps {
  displayName: string;
  phone: string;
  role: Role | null;
  residenceLabel?: string;
  assignmentLabel?: string;
  canEdit: boolean;
  activeTab: ProfileTab;
  onEdit: () => void;
  onTabChange: (tab: ProfileTab) => void;
}

export default function ProfileHeader({
  displayName,
  phone,
  role,
  residenceLabel,
  assignmentLabel,
  canEdit,
  activeTab,
  onEdit,
  onTabChange,
}: ProfileHeaderProps) {
  const roleConfig = ROLE_CONFIG[role || "TENANT"];
  const contextLabel = role === "TENANT" ? residenceLabel : role === "MANAGER" || role === "STAFF" ? assignmentLabel : undefined;

  return (
    <div className="space-y-6 overflow-hidden border border-gray-200 bg-white p-6 shadow-md">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-5">
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center bg-[#6366F1] text-3xl font-extrabold text-white shadow-xl ring-4 ring-white"
            style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">{displayName}</h2>
              <Badge variant={roleConfig.badge}>{roleConfig.label}</Badge>
            </div>
            <p className="flex items-center gap-2 text-xs text-gray-500">
              <Phone size={14} className="text-gray-400" /> {phone || "Chưa cập nhật số điện thoại"}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {contextLabel && (
            <div className="flex items-center gap-3 border border-violet-100 bg-violet-50/70 p-3">
              <div className="flex h-10 w-10 items-center justify-center bg-violet-600 text-white"><Home size={18} /></div>
              <div className="text-xs">
                <p className="font-semibold text-gray-600">{role === "TENANT" ? "Căn hộ hiện tại" : "Chi nhánh phụ trách"}</p>
                <p className="mt-0.5 font-bold text-violet-600">{contextLabel}</p>
              </div>
            </div>
          )}
          {canEdit && (
            <button type="button" onClick={onEdit} className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-xs font-bold text-violet-700 shadow-sm transition-colors hover:bg-violet-100">
              <Pencil size={14} /> Chỉnh sửa hồ sơ
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-8 overflow-x-auto border-t border-gray-200 pt-2 text-sm font-medium">
        <TabButton active={activeTab === "info"} onClick={() => onTabChange("info")} icon={User} label="Thông tin cá nhân" />
        <TabButton active={activeTab === "security"} onClick={() => onTabChange("security")} icon={Lock} label="Đổi mật khẩu & Bảo mật" />
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof User; label: string }) {
  return (
    <button type="button" onClick={onClick} className={`flex cursor-pointer items-center gap-2 whitespace-nowrap border-b-2 py-3.5 transition-colors ${active ? "border-violet-600 font-bold text-violet-600" : "border-transparent text-gray-500 hover:text-gray-800"}`}>
      <Icon size={16} /> {label}
    </button>
  );
}
