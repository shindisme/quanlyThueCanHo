import { ArrowRight, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import type { Role } from "../../../../constants/enums";

interface ProfileInfoTabProps {
  displayName: string;
  email: string;
  phone: string;
  role: Role | null;
  roleLabel: string;
  canEdit: boolean;
  staffBuildingName?: string;
  staffPosition?: string;
  occupantCount: number;
  maxOccupants: number;
  hasActiveContract: boolean;
  onEdit: () => void;
}

export default function ProfileInfoTab(props: ProfileInfoTabProps) {
  return (
    <div className="animate-in fade-in duration-300">
      <div className="space-y-6">
        <div className="space-y-4 border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-gray-800">Chi tiết tài khoản</h3>
            {props.canEdit && (
              <button type="button" onClick={props.onEdit} className="flex cursor-pointer items-center gap-1 px-2.5 py-1 text-xs font-semibold text-violet-600 transition-colors hover:bg-violet-50 hover:text-violet-700">
                <Pencil size={12} /> Cập nhật
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Info label="Họ và tên hiển thị" value={props.displayName} />
            <Info label={props.role === "TENANT" ? "Địa chỉ email" : "Tên đăng nhập"} value={props.email || "Chưa khai báo"} />
            <Info label="Số điện thoại liên hệ" value={props.phone || "Chưa cập nhật"} />
            <Info label="Vai trò hệ thống" value={props.roleLabel} />
            {(props.role === "STAFF" || props.role === "MANAGER") && (
              <>
                <Info label="Chi nhánh phụ trách" value={props.staffBuildingName || "Chưa phân công"} />
                <Info label="Vị trí công tác" value={props.staffPosition || props.roleLabel} />
              </>
            )}
          </div>
        </div>

        {props.role === "TENANT" && props.hasActiveContract && (
          <div className="flex flex-col items-start justify-between gap-4 bg-indigo-600 p-6 shadow-md sm:flex-row sm:items-center">
            <div className="space-y-1">
              <span className="inline-flex bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white">Cư dân cùng ở</span>
              <h4 className="text-lg font-bold text-white">Khai báo người ở cùng</h4>
              <p className="max-w-md text-xs text-white/80">
                Hiện có <strong className="text-white">{props.occupantCount + 1}</strong> / <strong className="text-white">{props.maxOccupants} người</strong> trong căn hộ (đã gồm bạn).
              </p>
            </div>
            <Link to="/tenant/occupants" className="flex shrink-0 cursor-pointer items-center gap-2 bg-white px-4 py-2.5 text-xs font-bold text-indigo-700 shadow-sm transition-colors hover:bg-gray-50">
              Quản lý danh sách <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gray-100 bg-gray-50/70 p-3.5">
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-gray-800">{value}</p>
    </div>
  );
}
