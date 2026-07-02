import { Plus, Users, Eye, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../components/PageHeader";
import Button from "../../../components/ui/Button";
import SearchInput from "../../../components/ui/SearchInput";
import Badge from "../../../components/ui/Badge";
import DataTable, { type Column } from "../../../components/ui/DataTable";
import Pagination from "../../../components/ui/Pagination";
import type { Tenant } from "../../../types";
import { maskPhone, maskCCCD } from "../../../utils/string";
import { useTenantList } from "../../../hooks/useTenantList";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";

import TenantCreateModal from "./components/TenantCreateModal";
import TenantModifyModal from "./components/TenantModifyModal";
import TenantDeleteModal from "./components/TenantDeleteModal";
import TenantDetailModal from "./components/TenantDetailModal";

// Danh sách người thuê
export default function TenantList() {
  const navigate = useNavigate();

  const {
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    totalPages,
    startIdx,
    endIdx,
    createModal,
    modifyModal,
    editItem,
    setEditItem,
    deleteItem,
    setDeleteItem,
    viewItem,
    setViewItem,
    filtered,
    loadData,
    handleDelete,
    loading,
    role,
  } = useTenantList();

  const paginated = filtered.slice(startIdx, endIdx);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner size={32} />
        <span className="text-sm text-gray-400 mt-2 font-sans">Đang tải danh sách người thuê...</span>
      </div>
    );
  }

  const columns: Column<Tenant>[] = [
    { key: "name", label: "Họ tên", sortValue: (t) => t.full_name, render: (t) => <span className="font-medium">{t.full_name}</span> },
    { key: "phone", label: "Số điện thoại", sortValue: (t) => t.phone || "", render: (t) => t.phone ? maskPhone(t.phone) : "-" },
    {
      key: "apartment",
      label: "Căn hộ",
      sortValue: (t) => {
        const activeContract = t.contracts?.[0];
        if (!activeContract || !activeContract.apartment) return "Chưa thuê";
        return `${activeContract.apartment.building?.branch_name || ""} - P.${activeContract.apartment.room_number}`;
      },
      render: (t) => {
        const activeContract = t.contracts?.[0];
        if (!activeContract || !activeContract.apartment) {
          return <span className="text-gray-400 italic text-xs">Chưa thuê</span>;
        }
        const apt = activeContract.apartment;
        const bld = apt.building;
        return (
          <div className="text-xs">
            <span className="font-semibold text-primary-600 block">{bld?.branch_name || "YuKi House"}</span>
            <span className="text-gray-500">P.{apt.floor}{apt.room_number}</span>
          </div>
        );
      }
    },
    { key: "citizen_id", label: "CCCD", sortValue: (t) => t.citizen_id, render: (t) => maskCCCD(t.citizen_id) },
    {
      key: "verified",
      label: "Xác thực",
      sortValue: (t) => t.is_verified,
      render: (t) => (
        <Badge variant={t.is_verified ? "success" : "warning"}>
          {t.is_verified ? "Đã xác thực" : "Chưa xác thực"}
        </Badge>
      ),
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
          <button
            onClick={() => setDeleteItem(t)}
            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
            title="Xóa"
          >
            <Trash2 size={16} />
          </button>
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
          <Button onClick={createModal.onOpen}>
            <Plus size={18} /> Thêm người thuê
          </Button>
        }
      />

      <SearchInput
        value={search}
        onChange={(v) => { setSearch(v); setCurrentPage(1); }}
        placeholder="Tìm kiếm..."
        className="max-w-md"
      />

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white rounded-xl border border-gray-200">
          <Users size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Không tìm thấy người thuê nào</p>
          <p className="text-sm text-gray-400 mt-1">Thử tìm kiếm với từ khóa khác</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* View Card */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {paginated.map((t) => {
              const activeContract = t.contracts?.[0];
              const apt = activeContract?.apartment;
              const bld = apt?.building;
              return (
                <div key={t.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-800 text-base">
                      {t.full_name}
                    </span>
                    <Badge variant={t.is_verified ? "success" : "warning"}>
                      {t.is_verified ? "Đã xác thực" : "Chưa xác thực"}
                    </Badge>
                  </div>

                  <div className="text-sm text-gray-500 space-y-1">
                    <p>
                      <span className="font-semibold text-gray-700">Số điện thoại:</span> {t.phone ? maskPhone(t.phone) : "-"}
                    </p>
                    <p>
                      <span className="font-semibold text-gray-700">Căn hộ:</span>{" "}
                      {apt ? (
                        <span className="text-primary-600 font-semibold">
                          {bld?.branch_name || "YuKi House"} - P.{apt.floor}{apt.room_number}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic text-xs">Chưa thuê</span>
                      )}
                    </p>
                    <p>
                      <span className="font-semibold text-gray-700">CCCD:</span> {maskCCCD(t.citizen_id)}
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => setViewItem(t)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-primary-600 hover:bg-primary-50 flex items-center gap-1 text-xs cursor-pointer"
                    >
                      <Eye size={14} /> Chi tiết
                    </button>
                    <button
                      onClick={() => {
                        setEditItem(t);
                        modifyModal.onOpen();
                      }}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-primary-600 hover:bg-primary-50 flex items-center gap-1 text-xs cursor-pointer"
                    >
                      <Pencil size={14} /> Sửa
                    </button>
                    <button
                      onClick={() => setDeleteItem(t)}
                      className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1 text-xs cursor-pointer"
                    >
                      <Trash2 size={14} /> Xóa
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* View List */}
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
            navigate(`${basePath}/contracts`, { state: { openCreateModal: true, tenantId: newTenantId } });
          }
        }}
      />

      <TenantModifyModal
        isOpen={modifyModal.isOpen}
        onClose={() => { modifyModal.onClose(); setEditItem(null); }}
        onSuccess={loadData}
        editItem={editItem}
      />

      <TenantDeleteModal
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        tenant={deleteItem}
      />

      <TenantDetailModal
        isOpen={!!viewItem}
        onClose={() => setViewItem(null)}
        tenant={viewItem}
      />
    </div>
  );
}
