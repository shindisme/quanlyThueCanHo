import { useMemo } from "react";
import { Eye, Pencil, RotateCcw, Trash2 } from "lucide-react";
import Badge, { type BadgeVariant } from "../../../../components/ui/Badge";
import DataTable, { type Column } from "../../../../components/ui/DataTable";
import type { User, Staff } from "../../../../types";

interface UserListProps {
  users: User[];
  staff: Staff[];
  isAdmin: boolean;
  startIdx?: number;
  totalItems?: number;
  getUserFullName: (u: User) => string;
  getUserBranch: (u: User) => string;
  onViewDetail: (u: User) => void;
  onModify: (u: User) => void;
  onResetPassword: (u: User) => void;
  onDelete: (u: User) => void;
  sortConfig?: { key: string; direction: "asc" | "desc" } | null;
  onSort?: (key: string) => void;
}

export default function UserList({
  users,
  staff,
  isAdmin,
  startIdx = 0,
  totalItems,
  getUserFullName,
  getUserBranch,
  onViewDetail,
  onModify,
  onResetPassword,
  onDelete,
  sortConfig,
  onSort,
}: UserListProps) {
  const staffMap = useMemo(() => {
    const map = new Map<number, Staff>();
    staff.forEach((s) => {
      if (s.user_id) map.set(s.user_id, s);
      if (s.user?.id) map.set(s.user.id, s);
    });
    return map;
  }, [staff]);

  const columns: Column<User>[] = useMemo(() => {
    function getRoleBadge(user: User) {
      let label: string = user.role;
      let variant: BadgeVariant = "gray";

      if (user.role === "ADMIN") {
        label = "Admin";
        variant = "danger";
      } else if (user.role === "TENANT") {
        label = "Người thuê";
        variant = "info";
      } else if (user.role === "MANAGER" || user.role === "STAFF") {
        const match = staffMap.get(user.id);
        label = match ? match.position : user.role === "MANAGER" ? "Quản lý" : "Nhân viên";
        variant = user.role === "MANAGER" ? "warning" : "success";
      }

      return <Badge variant={variant}>{label}</Badge>;
    }

    return [
      {
        key: "index",
        label: "STT",
        className: "w-4",
        sortValue: (u) => (u.created_at ? new Date(u.created_at).getTime() : u.id || 0),
        render: (_, index: number) => {
          const isDesc = sortConfig?.key === "index" && sortConfig?.direction === "desc";
          const displayStt = isDesc && totalItems ? totalItems - (startIdx + index) : startIdx + index + 1;
          return <span className="font-semibold text-gray-800 w-2">{displayStt}</span>;
        },
      },
      {
        key: "fullName",
        label: "Họ và tên",
        sortValue: (u) => getUserFullName(u),
        render: (u) => <span className="font-medium text-gray-700">{getUserFullName(u)}</span>,
      },
      {
        key: "username",
        label: "Tên tài khoản",
        sortValue: (u) => u.username,
        render: (u) => <span className="font-semibold text-gray-800">{u.username}</span>,
      },
      {
        key: "role",
        label: "Vai trò",
        sortValue: (u) => (u.role === "ADMIN" ? "1_Admin" : u.role === "MANAGER" ? "2_Quản lý" : u.role === "STAFF" ? "3_Nhân viên" : "4_Người thuê"),
        render: (u) => getRoleBadge(u),
      },
      {
        key: "branch",
        label: "Chi nhánh",
        sortValue: (u) => {
          const branch = getUserBranch(u);
          if (!branch || branch === "-" || branch === "Chưa phân công" || branch === "Không" || branch === "Trống") {
            return "zzz_Trống";
          }
          return branch;
        },
        render: (u) => {
          const branch = getUserBranch(u);
          if (!branch || branch === "-" || branch === "Chưa phân công" || branch === "Không" || branch === "Trống") {
            return <span className="text-gray-400 italic font-normal">Trống</span>;
          }
          return <span className="font-medium text-primary-600">{branch}</span>;
        },
      },
      {
        key: "status",
        label: "Trạng thái",
        sortValue: (u) => (u.status === "ACTIVE" ? "1_Hoạt động" : "2_Tạm khóa"),
        render: (u) => (
          <Badge variant={u.status === "ACTIVE" ? "success" : "gray"}>
            {u.status === "ACTIVE" ? "Hoạt động" : "Tạm khóa"}
          </Badge>
        ),
      },
      {
        key: "actions",
        label: "Chức năng",
        className: "text-right",
        isAction: true,
        render: (u) => (
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => onViewDetail(u)}
              className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer transition-colors"
              title="Xem chi tiết"
            >
              <Eye size={16} />
            </button>
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => onModify(u)}
                  className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer transition-colors"
                  title="Chỉnh sửa tài khoản"
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => onResetPassword(u)}
                  className="p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 cursor-pointer transition-colors"
                  title="Đặt lại mật khẩu"
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(u)}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                  title="Xóa tài khoản"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        ),
      },
    ];
  }, [isAdmin, staffMap, startIdx, totalItems, sortConfig, getUserFullName, getUserBranch, onViewDetail, onModify, onResetPassword, onDelete]);

  return (
    <DataTable
      columns={columns}
      data={users}
      sortConfig={sortConfig}
      onSort={onSort}
      emptyMessage="Không tìm thấy tài khoản nào"
    />
  );
}
