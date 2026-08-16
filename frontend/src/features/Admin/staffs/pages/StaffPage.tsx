import { Plus, Eye, Pencil, Trash2 } from "lucide-react";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import PageHeader from "../../../../components/layout/PageHeader";
import Button from "../../../../components/ui/Button";
import SearchInput from "../../../../components/ui/SearchInput";
import Badge from "../../../../components/ui/Badge";
import DataTable, { type Column } from "../../../../components/ui/DataTable";
import Pagination from "../../../../components/ui/Pagination";
import Combobox from "../../../../components/ui/Combobox";
import { maskPhone } from "../../../../utils/string";
import type { Staff } from "../../../../types";
import { getTableRowNumber } from "../../../../utils/table";

import StaffCreateModal from "../components/StaffCreateModal";
import StaffModifyModal from "../components/StaffModifyModal";
import StaffDeleteModal from "../components/StaffDeleteModal";
import StaffDetailModal from "../components/StaffDetailModal";
import { useStaffPage } from "../hooks/useStaffPage";

export default function StaffPage() {
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
    startIdx,
    paginated,
    requestSort,
    sortConfig,
    createModal,
    modifyModal,
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
    deleting,
  } = useStaffPage();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100">
        <LoadingSpinner size={36} />
        <span className="text-sm text-gray-400 mt-2 font-sans">Đang tải danh sách nhân viên...</span>
      </div>
    );
  }

  const columns: Column<Staff>[] = [
    {
      key: "index",
      label: "STT",
      className: "w-4",
      preserveRenderIndex: true,
      render: (_, index) => (
        <span className="font-semibold text-gray-800">{getTableRowNumber(index, startIdx, filtered.length, sortConfig)}</span>
      ),
    },
    {
      key: "name",
      label: "Họ và tên",
      sortable: false,
      sortValue: (s) => s.full_name,
      render: (s) => <span className="font-semibold text-gray-800">{s.full_name}</span>,
    },
    {
      key: "phone",
      label: "Số điện thoại",
      sortable: false,
      sortValue: (s) => s.phone || "",
      render: (s) => (s.phone ? maskPhone(s.phone) : <span className="text-gray-400">-</span>),
    },
    {
      key: "position",
      label: "Chức vụ",
      sortable: false,
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
      sortable: false,
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
      sortable: false,
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
              modifyModal.onOpen();
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
        title="Nhân viên"
        subtitle="Quản lý danh sách nhân viên vận hành"
        count={filtered.length}
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
            <Button onClick={createModal.onOpen}>
              <Plus size={18} /> Thêm nhân viên
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-12 gap-3 w-full font-sans">
        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Combobox
            options={uniquePositions.map((pos) => ({ value: pos, label: pos }))}
            value={positionFilter}
            onChange={(val) => {
              setPositionFilter(val);
              setCurrentPage(1);
            }}
            placeholder="Tất cả chức vụ"
            searchable={false}
            className="w-full"
            triggerClassName="h-10 rounded-xl border-gray-300"
            clearable={true}
          />
        </div>

        {role !== "MANAGER" && (
          <div className="col-span-12 sm:col-span-6 md:col-span-3">
            <Combobox
              options={buildings.map((b) => ({ value: String(b.id), label: b.branch_name }))}
              value={buildingFilter ? String(buildingFilter) : ""}
              onChange={(val) => {
                setBuildingFilter(val ? Number(val) : "");
                setCurrentPage(1);
              }}
              placeholder="Tất cả tòa nhà"
              searchPlaceholder="Tìm tòa nhà..."
              className="w-full"
              triggerClassName="h-10 rounded-xl border-gray-300"
              clearable={true}
            />
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        data={paginated}
        sortConfig={sortConfig}
        onSort={(key) => { requestSort(key); setCurrentPage(1); }}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Modals */}
      <StaffCreateModal
        isOpen={createModal.isOpen}
        onClose={createModal.onClose}
        onSuccess={loadData}
      />

      <StaffModifyModal
        isOpen={modifyModal.isOpen}
        onClose={() => {
          modifyModal.onClose();
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
        loading={deleting}
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
