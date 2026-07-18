import { Plus, Users, Eye, Pencil, Trash2, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../../components/PageHeader";
import Button from "../../../../components/ui/Button";
import SearchInput from "../../../../components/ui/SearchInput";
import DataTable, { type Column } from "../../../../components/ui/DataTable";
import Pagination from "../../../../components/ui/Pagination";
import type { Tenant } from "../../../../types";
import { maskPhone, maskCCCD, formatApartmentDisplay } from "../../../../utils/string";
import { useTenantPage } from "../hooks/useTenantPage";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import Combobox from "../../../../components/ui/Combobox";

import TenantCreateModal from "../components/TenantCreateModal";
import TenantModifyModal from "../components/TenantModifyModal";
import TenantDeleteModal from "../components/TenantDeleteModal";
import TenantDetailModal from "../components/TenantDetailModal";

export default function TenantPage() {
  const navigate = useNavigate();

  const {
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    totalPages,
    createModal,
    modifyModal,
    editItem,
    setEditItem,
    deleteItem,
    setDeleteItem,
    viewItem,
    setViewItem,
    filtered,
    paginated,
    loadData,
    handleDelete,
    loading,
    role,
    selectedBuilding,
    setSelectedBuilding,
    selectedFloor,
    setSelectedFloor,
    selectedStatus,
    setSelectedStatus,
    availableFloors,
    buildings,
    deleting,
  } = useTenantPage();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner size={32} />
        <span className="text-sm text-gray-400 mt-2 font-sans">Đang tải danh sách người thuê...</span>
      </div>
    );
  }

  const columns: Column<Tenant>[] = [
    {
      key: "index",
      label: "STT",
      className: "w-4",
      render: (_, index: number) => <span className="font-semibold text-gray-800">{index + 1}</span>,
    },
    {
      key: "name",
      label: "Họ tên",
      sortValue: (t) => t.full_name,
      render: (t) => <span className="font-medium">{t.full_name}</span>,
    },
    {
      key: "apartment",
      label: "Căn hộ",
      sortValue: (t) => {
        const activeContract = t.contracts?.[0];
        if (!activeContract || !activeContract.apartment) return "Chưa thuê";
        return `${activeContract.apartment.building?.branch_name || ""} - P.${activeContract.apartment.room_number
          }`;
      },
      render: (t) => {
        const activeContract = t.contracts?.[0];
        if (!activeContract || !activeContract.apartment) {
          return <span className="text-gray-450 italic text-xs">Chưa thuê</span>;
        }
        const apt = activeContract.apartment;
        const bld = apt.building;
        const roomNum = formatApartmentDisplay(apt.room_number, apt.floor);
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-gray-800">{roomNum}</span>
            {role === "ADMIN" && bld?.branch_name && (
              <span className="text-[10px] font-semibold text-primary-600">{bld.branch_name}</span>
            )}
          </div>
        );
      },
    },
    {
      key: "phone",
      label: "Số điện thoại",
      sortValue: (t) => t.phone || "",
      render: (t) => (t.phone ? maskPhone(t.phone) : "-"),
    },
    {
      key: "citizen_id",
      label: "CCCD",
      sortValue: (t) => t.citizen_id,
      render: (t) => maskCCCD(t.citizen_id),
    },
    {
      key: "actions",
      label: "Chức năng",
      render: (t) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewItem(t)}
            className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer"
            title="Xem chi tiết"
          >
            <Eye size={16} />
          </button>
          {role !== "STAFF" && (
            <>
              <button
                onClick={() => {
                  setEditItem(t);
                  modifyModal.onOpen();
                }}
                className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer"
                title="Chỉnh sửa"
              >
                <Pencil size={16} />
              </button>
              {!t.contracts?.[0] && (
                <>
                  <button
                    onClick={() => {
                      const basePath = role === "ADMIN" ? "/admin" : "/manager";
                      navigate(`${basePath}/contracts`, {
                        state: { openCreateModal: true, tenantId: t.id },
                      });
                    }}
                    className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer"
                    title="Tạo hợp đồng"
                  >
                    <FileText size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteItem(t)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                    title="Xóa người thuê"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        title="Người thuê"
        subtitle="Quản lý thông tin người thuê"
        count={filtered.length}
        iconColor="linear-gradient(135deg, #8B5CF6, #A78BFA)"
        actions={
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <SearchInput
              value={search}
              onChange={(v) => {
                setSearch(v);
                setCurrentPage(1);
              }}
              placeholder="Tìm kiếm..."
              className="w-64 sm:w-80"
            />
            {role !== "STAFF" && (
              <Button onClick={createModal.onOpen}>
                <Plus size={18} /> Thêm người thuê
              </Button>
            )}
          </div>
        }
      />

      {/* Bộ lọc */}
      <div className="flex flex-col sm:flex-row gap-3 w-full font-sans">
        {role === "ADMIN" && (
          <Combobox
            options={buildings.map((b) => ({ value: String(b.id), label: b.branch_name }))}
            value={selectedBuilding}
            onChange={(val) => {
              setSelectedBuilding(val);
              setSelectedFloor("");
              setCurrentPage(1);
            }}
            placeholder="Tất cả tòa nhà"
            className="flex-1 min-w-0 w-full"
            triggerClassName="h-[42px] rounded-xl border-gray-300 px-4 py-2.5"
            clearable={true}
          />
        )}

        <Combobox
          options={availableFloors.map((fl) => ({ value: String(fl), label: `Tầng ${fl}` }))}
          value={selectedFloor}
          onChange={(val) => {
            setSelectedFloor(val);
            setCurrentPage(1);
          }}
          placeholder="Tất cả tầng"
          className="flex-1 min-w-0 w-full"
          triggerClassName="h-[42px] rounded-xl border-gray-300 px-4 py-2.5"
          clearable={true}
        />

        <Combobox
          options={[
            { value: "ACTIVE", label: "Đang thuê" },
            { value: "INACTIVE", label: "Ngừng thuê" },
          ]}
          value={selectedStatus}
          onChange={(val) => {
            setSelectedStatus(val);
            setCurrentPage(1);
          }}
          placeholder="Trạng thái"
          searchable={false}
          className="flex-1 min-w-0 w-full"
          triggerClassName="h-[42px] rounded-xl border-gray-300 px-4 py-2.5"
          clearable={true}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white rounded-xl border border-gray-200">
          <Users size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Không tìm thấy người thuê nào</p>
          <p className="text-sm text-gray-400 mt-1">Thử tìm kiếm với từ khóa khác</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* View Card for mobile */}
          <div className="grid grid-cols-1 gap-4 md:hidden font-sans">
            {paginated.map((t) => {
              const activeContract = t.contracts?.[0];
              const apt = activeContract?.apartment;
              const bld = apt?.building;
              return (
                <div key={t.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-800 text-base">{t.full_name}</span>
                  </div>

                  <div className="text-sm text-gray-500 space-y-1">
                    <p>
                      <span className="font-semibold text-gray-700">Số điện thoại:</span>{" "}
                      {t.phone ? maskPhone(t.phone) : "-"}
                    </p>
                    <p>
                      <span className="font-semibold text-gray-700">Căn hộ:</span>{" "}
                      {apt ? (
                        <>
                          <span className="font-bold text-gray-900">
                            {formatApartmentDisplay(apt.room_number, apt.floor)}
                          </span>{" "}
                          {role === "ADMIN" && bld?.branch_name && (
                            <span className="text-xs font-semibold text-purple-650">({bld.branch_name})</span>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-450 italic text-xs">Chưa thuê</span>
                      )}
                    </p>
                    <p>
                      <span className="font-semibold text-gray-700">CCCD:</span>{" "}
                      {maskCCCD(t.citizen_id)}
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => setViewItem(t)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-primary-600 hover:bg-primary-50 flex items-center gap-1 text-xs cursor-pointer"
                    >
                      <Eye size={14} /> Chi tiết
                    </button>
                    {role !== "STAFF" && (
                      <>
                        <button
                          onClick={() => {
                            setEditItem(t);
                            modifyModal.onOpen();
                          }}
                          className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-primary-600 hover:bg-primary-50 flex items-center gap-1 text-xs cursor-pointer"
                        >
                          <Pencil size={14} /> Sửa
                        </button>
                        {!t.contracts?.[0] && (
                          <>
                            <button
                              onClick={() => {
                                const basePath = role === "ADMIN" ? "/admin" : "/manager";
                                navigate(`${basePath}/contracts`, {
                                  state: { openCreateModal: true, tenantId: t.id },
                                });
                              }}
                              className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-primary-600 hover:bg-primary-50 flex items-center gap-1 text-xs cursor-pointer"
                            >
                              <FileText size={14} /> Ký HĐ
                            </button>
                            <button
                              onClick={() => setDeleteItem(t)}
                              className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1 text-xs cursor-pointer"
                            >
                              <Trash2 size={14} /> Xóa
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* View List for desktop */}
          <div className="hidden md:block">
            <DataTable columns={columns} data={paginated} />
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      )}

      {/* Modals */}
      <TenantCreateModal
        isOpen={createModal.isOpen}
        onClose={createModal.onClose}
        onSuccess={(newTenantId) => {
          loadData();
          if (newTenantId) {
            const basePath = role === "ADMIN" ? "/admin" : "/manager";
            navigate(`${basePath}/contracts`, {
              state: { openCreateModal: true, tenantId: newTenantId, isNewTenant: true },
            });
          }
        }}
      />

      <TenantModifyModal
        isOpen={modifyModal.isOpen}
        onClose={() => {
          modifyModal.onClose();
          setEditItem(null);
        }}
        onSuccess={loadData}
        editItem={editItem}
      />

      <TenantDeleteModal
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        tenant={deleteItem}
        loading={deleting}
      />

      <TenantDetailModal
        isOpen={!!viewItem}
        onClose={() => setViewItem(null)}
        tenant={viewItem}
      />
    </div>
  );
}
