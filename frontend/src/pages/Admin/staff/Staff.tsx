import { Plus, Briefcase, Eye, Pencil, Trash2 } from "lucide-react";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import PageHeader from "../../../components/PageHeader";
import Button from "../../../components/ui/Button";
import SearchInput from "../../../components/ui/SearchInput";
import Badge from "../../../components/ui/Badge";
import DataTable, { type Column } from "../../../components/ui/DataTable";
import Pagination from "../../../components/ui/Pagination";
import Combobox from "../../../components/ui/Combobox";
import { maskPhone } from "../../../utils/string";
import type { Staff } from "../../../types";

import StaffCreateModal from "./components/StaffCreateModal";
import StaffModifyModal from "./components/StaffModifyModal";
import StaffDeleteModal from "./components/StaffDeleteModal";
import StaffDetailModal from "./components/StaffDetailModal";
import { useStaffList } from "../../../hooks/admin/useStaffList";

export default function Staff() {
  const {
    role,
    buildings,
    staffList,
    loading,
    search,
    setSearch,
    positionFilter,
    setPositionFilter,
    buildingFilter,
    setBuildingFilter,
    currentPage,
    setCurrentPage,
    totalPages,
    paginated,
    showCreateModal,
    setShowCreateModal,
    showModifyModal,
    setShowModifyModal,
    editItem,
    setEditItem,
    deleteItem,
    setDeleteItem,
    viewItem,
    setViewItem,
    filtered,
    handleDelete,
    getBuildingName,
    loadData,
  } = useStaffList();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner size={36} />
        <span className="text-sm text-gray-400 mt-2 font-sans">Đang tải danh sách nhân viên...</span>
      </div>
    );
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
          <span className="font-medium text-primary-600">{bName}</span>
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
          <span className="font-medium text-gray-700">{s.user.username}</span>
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
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <SearchInput
              value={search}
              onChange={(v) => {
                setSearch(v);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo họ tên hoặc SĐT..."
              className="w-64 sm:w-80"
            />
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus size={18} /> Thêm nhân viên
            </Button>
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <Combobox
          options={uniquePositions.map((pos) => ({ value: pos, label: pos }))}
          value={positionFilter}
          onChange={(val) => {
            setPositionFilter(val);
            setCurrentPage(1);
          }}
          placeholder="Tất cả chức vụ"
          searchable={false}
          className="w-full sm:w-44"
          triggerClassName="h-10 rounded-xl border-gray-300"
          clearable={true}
        />

        {role !== "MANAGER" && (
          <Combobox
            options={buildings.map((b) => ({ value: String(b.id), label: b.branch_name }))}
            value={buildingFilter ? String(buildingFilter) : ""}
            onChange={(val) => {
              setBuildingFilter(val ? Number(val) : "");
              setCurrentPage(1);
            }}
            placeholder="Tất cả tòa nhà"
            searchPlaceholder="Tìm tòa nhà..."
            className="w-full sm:w-48"
            triggerClassName="h-10 rounded-xl border-gray-300"
            clearable={true}
          />
        )}
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
