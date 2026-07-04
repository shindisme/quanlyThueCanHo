import { useNavigate } from "react-router-dom";
import { Plus, Building2, User, Eye, Pencil, Trash2 } from "lucide-react";
import PageHeader from "../../../components/PageHeader";
import Button from "../../../components/ui/Button";
import SearchInput from "../../../components/ui/SearchInput";
import Badge from "../../../components/ui/Badge";
import Pagination from "../../../components/ui/Pagination";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";

import BuildingCreateModal from "./components/BuildingCreateModal";
import BuildingModifyModal from "./components/BuildingModifyModal";
import BuildingDeleteModal from "./components/BuildingDeleteModal";
import { useBuildingList } from "../../../hooks/admin/useBuildingList";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../../components/ui/Table";

export default function BuildingList() {
  const navigate = useNavigate();
  const {
    role,
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    showCreateModal,
    setShowCreateModal,
    showModifyModal,
    setShowModifyModal,
    editItem,
    setEditItem,
    deleteItem,
    setDeleteItem,
    loading,
    totalCount,
    totalPages,
    filtered,
    sortedBuildings,
    requestSort,
    getSortIcon,
    handleDelete,
    fetchBuildings,
  } = useBuildingList();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner size={36} />
        <span className="text-sm text-gray-400 mt-2 font-sans">Đang tải danh sách tòa nhà...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        icon={Building2}
        title="Tòa nhà"
        subtitle="Quản lý danh sách tòa nhà"
        count={role === "MANAGER" ? filtered.length : totalCount}
        actions={
          role === "ADMIN" && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus size={18} /> Thêm tòa nhà
            </Button>
          )
        }
      />

      {/* Tìm kiếm & Bộ lọc */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setCurrentPage(1); }}
          placeholder="Tìm kiếm theo tên, địa chỉ..."
          className="w-full sm:max-w-md"
        />
        {/* <Select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setCurrentPage(1); }}
          className="w-full sm:w-48"
          placeholder="Tất cả trạng thái"
          options={[
            { value: "ACTIVE", label: "Đang hoạt động" },
            { value: "INACTIVE", label: "Tạm ngưng" },
          ]}
        /> */}
      </div>

      {/* Danh sách */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white rounded-lg border border-gray-200">
          <Building2 size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Không tìm thấy tòa nhà nào</p>
          <p className="text-sm text-gray-400 mt-1">Thử tìm kiếm với từ khóa khác</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* View Card */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {sortedBuildings.map((building) => (
              <div key={building.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className="font-semibold text-primary-600 cursor-pointer text-base hover:underline"
                    onClick={() => navigate(`/admin/buildings/${building.id}`)}
                  >
                    {building.branch_name}
                  </span>
                  <Badge variant={building.status === "ACTIVE" ? "success" : "gray"}>
                    {building.status === "ACTIVE" ? "Hoạt động" : "Ngừng"}
                  </Badge>
                </div>

                <div className="text-sm text-gray-500 space-y-1">
                  <p>
                    <span className="font-semibold text-gray-700">Địa chỉ:</span> {building.address_new}
                  </p>
                  <p className="flex items-center gap-1">
                    <span className="font-semibold text-gray-700">Quản lý bởi:</span>
                    {building.manager ? (
                      <span className="inline-flex items-center gap-1 text-primary-600 font-medium">
                        <User size={12} />
                        {building.manager.fullName || building.manager.username}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic text-xs">Chưa bàn giao</span>
                    )}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => navigate(`/admin/buildings/${building.id}`)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-primary-600 hover:bg-primary-50 flex items-center gap-1 text-xs cursor-pointer"
                  >
                    <Eye size={14} /> Chi tiết
                  </button>
                  {role === "ADMIN" && (
                    <>
                      <button
                        onClick={() => { setEditItem(building); setShowModifyModal(true); }}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-primary-600 hover:bg-primary-50 flex items-center gap-1 text-xs cursor-pointer"
                      >
                        <Pencil size={14} /> Sửa
                      </button>
                      <button
                        onClick={() => setDeleteItem(building)}
                        className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1 text-xs cursor-pointer"
                      >
                        <Trash2 size={14} /> Xóa
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* View List */}
          <div className="hidden md:block border border-gray-200 overflow-hidden bg-white shadow-xl rounded-none">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => requestSort("branch_name")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                    Tên chi nhánh {getSortIcon("branch_name")}
                  </TableHead>
                  <TableHead onClick={() => requestSort("address_new")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                    Địa chỉ {getSortIcon("address_new")}
                  </TableHead>
                  <TableHead onClick={() => requestSort("manager.fullName")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                    Quản lý bởi {getSortIcon("manager.fullName")}
                  </TableHead>
                  <TableHead onClick={() => requestSort("status")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                    Trạng thái {getSortIcon("status")}
                  </TableHead>
                  <TableHead className="text-right">Chức năng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedBuildings.map((building) => (
                  <TableRow key={building.id}>
                    <TableCell className="font-semibold text-primary-600">
                      <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/admin/buildings/${building.id}`)}>
                        <span>{building.branch_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      <span className="block max-w-xs truncate" title={building.address_new}>
                        {building.address_new}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {building.manager ? (
                        <div className="flex items-center gap-1.5 font-medium text-primary-600">
                          <User size={13} />
                          <span>{building.manager.fullName || building.manager.username}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-xs">Không</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={building.status === "ACTIVE" ? "success" : "gray"}>
                        {building.status === "ACTIVE" ? "Hoạt động" : "Ngừng"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => navigate(`/admin/buildings/${building.id}`)}
                          className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer" title="Xem chi tiết">
                          <Eye size={16} />
                        </button>
                        {role === "ADMIN" && (
                          <>
                            <button onClick={() => { setEditItem(building); setShowModifyModal(true); }}
                              className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer" title="Sửa">
                              <Pencil size={16} />
                            </button>
                            <button onClick={() => setDeleteItem(building)}
                              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer" title="Xóa">
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Phân trang */}
      {(role === "MANAGER" ? 1 : totalPages) > 1 && (
        <Pagination currentPage={currentPage} totalPages={role === "MANAGER" ? 1 : totalPages} onPageChange={setCurrentPage} />
      )}

      {/* Modal */}
      <BuildingCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchBuildings}
      />

      <BuildingModifyModal
        isOpen={showModifyModal}
        onClose={() => { setShowModifyModal(false); setEditItem(null); }}
        onSuccess={fetchBuildings}
        editItem={editItem}
      />

      <BuildingDeleteModal
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        building={deleteItem}
      />
    </div>
  );
}
