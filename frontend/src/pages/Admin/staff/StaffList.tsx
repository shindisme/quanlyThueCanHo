import { useState, useEffect } from "react";
import { Plus, Briefcase, Eye, Pencil, Trash2, Loader2, User, Building } from "lucide-react";
import PageHeader from "../../../components/ui/PageHeader";
import Button from "../../../components/ui/Button";
import SearchInput from "../../../components/ui/SearchInput";
import Badge from "../../../components/ui/Badge";
import DataTable, { type Column } from "../../../components/ui/DataTable";
import Pagination from "../../../components/ui/Pagination";
import { useAuthStore } from "../../../stores/auth.store";
import { mockUsers } from "../../../data/users";
import { toast } from "sonner";
import { removeVietnameseTones, maskPhone } from "../../../utils/format";
import type { Staff } from "../../../types";
import * as staffService from "../../../services/staffService";
import * as buildingService from "../../../services/buildingService";
import type { BuildingData } from "../../../services/buildingService";

import StaffCreateModal from "./components/StaffCreateModal";
import StaffModifyModal from "./components/StaffModifyModal";
import StaffDeleteModal from "./components/StaffDeleteModal";
import StaffDetailModal from "./components/StaffDetailModal";

export default function StaffList() {
  const { role, email } = useAuthStore();
  const currentUser = mockUsers.find((u) => u.email === email);
  const managerBuildingId = currentUser?.managedBuildingId;

  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [buildingFilter, setBuildingFilter] = useState<number | "">("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [editItem, setEditItem] = useState<Staff | null>(null);
  const [deleteItem, setDeleteItem] = useState<Staff | null>(null);
  const [viewItem, setViewItem] = useState<Staff | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const sRes = await staffService.getAllStaff();
      setStaffList(sRes.data);

      const bRes = await buildingService.getAllBuildings({ limit: 100 });
      setBuildings(bRes.data);
    } catch {
      toast.error("Không thể tải danh sách nhân viên");
    } finally {
      setLoading(false);
    }
  }

  // Lọc theo quyền của Manager: chỉ hiển thị nhân viên thuộc tòa nhà quản lý
  const displayStaff = (() => {
    if (role === "MANAGER" && managerBuildingId) {
      return staffList.filter((s) => s.building_id === managerBuildingId);
    }
    return staffList;
  })();

  // Lọc theo thanh tìm kiếm và bộ lọc dropdown
  const filtered = displayStaff.filter((s) => {
    const term = removeVietnameseTones(search);
    const nameNorm = removeVietnameseTones(s.full_name);
    const phoneNorm = removeVietnameseTones(s.phone || "");
    const matchSearch = nameNorm.includes(term) || phoneNorm.includes(term);

    const matchPosition = !positionFilter || s.position === positionFilter;
    const matchBuilding =
      buildingFilter === "" || s.building_id === Number(buildingFilter);

    return matchSearch && matchPosition && matchBuilding;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  async function handleDelete() {
    if (!deleteItem) return;
    try {
      await staffService.deleteStaff(deleteItem.id);
      toast.success("Đã xóa nhân viên thành công!");
      setDeleteItem(null);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Xóa nhân viên thất bại");
    }
  }

  function getBuildingName(bId: number | null): string {
    if (!bId) return "Chưa gán";
    return buildings.find((b) => b.id === bId)?.branch_name || `Tòa nhà #${bId}`;
  }

  const columns: Column<Staff>[] = [
    {
      key: "name",
      label: "Họ và tên",
      sortValue: (s) => s.full_name,
      render: (s) => <span className="font-semibold text-gray-800">{s.full_name}</span>,
    },
    {
      key: "phone",
      label: "Số điện thoại",
      sortValue: (s) => s.phone || "",
      render: (s) => (s.phone ? maskPhone(s.phone) : <span className="text-gray-400">-</span>),
    },
    {
      key: "position",
      label: "Chức vụ",
      sortValue: (s) => s.position,
      render: (s) => {
        const isManager = s.position === "Quản lý";
        return (
          <Badge variant={isManager ? "warning" : "info"}>
            {s.position}
          </Badge>
        );
      },
    },
    {
      key: "building",
      label: "Tòa nhà làm việc",
      sortValue: (s) => getBuildingName(s.building_id),
      render: (s) => {
        const bName = getBuildingName(s.building_id);
        return s.building_id ? (
          <div className="flex items-center gap-1.5 font-medium text-primary-600">
            <Building size={14} className="text-primary-500" />
            <span>{bName}</span>
          </div>
        ) : (
          <span className="text-gray-450 italic text-xs">Chưa gán</span>
        );
      },
    },
    {
      key: "account",
      label: "Tài khoản liên kết",
      sortValue: (s) => s.user?.username || "",
      render: (s) =>
        s.user?.username ? (
          <div className="flex items-center gap-1 text-gray-700">
            <User size={13} className="text-gray-400" />
            <span className="font-medium">@{s.user.username}</span>
          </div>
        ) : (
          <span className="text-gray-400 italic text-xs">-</span>
        ),
    },
    {
      key: "actions",
      label: "Chức năng",
      render: (s) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewItem(s)}
            className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer"
            title="Xem chi tiết"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => {
              setEditItem(s);
              setShowModifyModal(true);
            }}
            className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer"
            title="Chỉnh sửa"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => setDeleteItem(s)}
            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
            title="Xóa"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  const uniquePositions = [...new Set(staffList.map((s) => s.position))];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Briefcase}
        title="Nhân viên"
        subtitle="Quản lý danh sách nhân viên vận hành"
        count={filtered.length}
        iconColor="linear-gradient(135deg, #10B981, #059669)"
        actions={
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={18} /> Thêm nhân viên
          </Button>
        }
      />

      <div className="flex flex-col md:flex-row gap-3">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setCurrentPage(1);
          }}
          placeholder="Tìm theo họ tên hoặc SĐT..."
          className="max-w-md flex-1"
        />

        <div className="flex flex-wrap gap-2.5">
          <select
            value={positionFilter}
            onChange={(e) => {
              setPositionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm bg-white cursor-pointer focus:outline-none focus:border-primary-500"
          >
            <option value="">Tất cả chức vụ</option>
            {uniquePositions.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>

          {role !== "MANAGER" && (
            <select
              value={buildingFilter}
              onChange={(e) => {
                setBuildingFilter(e.target.value ? Number(e.target.value) : "");
                setCurrentPage(1);
              }}
              className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm bg-white cursor-pointer focus:outline-none focus:border-primary-500"
            >
              <option value="">Tất cả tòa nhà</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.branch_name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <DataTable columns={columns} data={paginated} />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Modals */}
      <StaffCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadData}
      />

      <StaffModifyModal
        isOpen={showModifyModal}
        onClose={() => {
          setShowModifyModal(false);
          setEditItem(null);
        }}
        onSuccess={loadData}
        editItem={editItem}
      />

      <StaffDeleteModal
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        staff={deleteItem}
      />

      <StaffDetailModal
        isOpen={!!viewItem}
        onClose={() => setViewItem(null)}
        staff={viewItem}
        buildingName={viewItem ? getBuildingName(viewItem.building_id) : "Chưa gán"}
      />
    </div>
  );
}
