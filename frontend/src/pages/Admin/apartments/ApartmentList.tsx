import { Plus, Pencil, Trash2, Home, Star, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../components/PageHeader";
import Button from "../../../components/ui/Button";
import SearchInput from "../../../components/ui/SearchInput";
import Badge from "../../../components/ui/Badge";
import Pagination from "../../../components/ui/Pagination";
import Combobox from "../../../components/ui/Combobox";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";

import { useApartmentList } from "../../../hooks/useApartmentList";
import { formatApartmentDisplay } from "../../../utils/string";
import { formatCurrency } from "../../../utils/currency";

import ApartmentCreateModal from "./components/ApartmentCreateModal";
import ApartmentModifyModal from "./components/ApartmentModifyModal";
import ApartmentDeleteModal from "./components/ApartmentDeleteModal";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../../components/ui/Table";

export default function ApartmentList() {
  const navigate = useNavigate();
  const {
    role,
    search,
    setSearch,
    filterStatus,
    setFilterStatus,
    filterFeatured,
    setFilterFeatured,
    filterBuilding,
    setFilterBuilding,
    createModal,
    modifyModal,
    editItem,
    setEditItem,
    deleteItem,
    setDeleteItem,
    featuredIds,
    buildings,
    loading,
    fetchApartments,
    toggleFeatured,
    filtered,
    managedBuildingId,
    requestSort,
    getSortIcon,
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedApartments,
    handleDelete,
  } = useApartmentList();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner size={36} />
        <span className="text-sm text-gray-400 mt-2 font-sans">Đang tải danh sách căn hộ...</span>
      </div>
    );
  }

  function getStatusBadge(status: string) {
    const map: Record<string, { label: string; variant: string }> = {
      AVAILABLE: { label: "Còn trống", variant: "success" },
      RENTED: { label: "Đang thuê", variant: "info" },
      MAINTENANCE: { label: "Bảo trì", variant: "warning" },
    };
    const s = map[status] || { label: status, variant: "gray" };
    return <Badge variant={s.variant as "success" | "info" | "warning" | "gray"}>{s.label}</Badge>;
  }



  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        icon={Home}
        title="Căn hộ"
        subtitle="Quản lý danh sách căn hộ"
        count={filtered.length}
        iconColor="linear-gradient(135deg, #3B82F6, #60A5FA)"
        actions={
          <Button onClick={createModal.onOpen}><Plus size={18} /> Thêm căn hộ</Button>
        }
      />
      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setCurrentPage(1); }}
          placeholder="Tìm kiếm..."
          className="flex-1 min-w-0 w-full"
        />
        {role !== "MANAGER" && (
          <Combobox
            options={buildings.map((b) => ({ value: String(b.id), label: b.branch_name }))}
            value={filterBuilding ? String(filterBuilding) : ""}
            onChange={(val) => {
              setFilterBuilding(val ? Number(val) : undefined);
              setCurrentPage(1);
            }}
            placeholder="Tất cả chi nhánh"
            className="flex-1 min-w-0 w-full"
            triggerClassName="h-[42px] rounded-xl border-gray-300 px-4 py-2.5"
            clearable={true}
          />
        )}
        <Combobox
          options={[
            { value: "AVAILABLE", label: "Còn trống" },
            { value: "RENTED", label: "Đang thuê" },
            { value: "MAINTENANCE", label: "Bảo trì" }
          ]}
          value={filterStatus}
          onChange={(val) => {
            setFilterStatus(val);
            setCurrentPage(1);
          }}
          placeholder="Tất cả trạng thái"
          searchable={false}
          className="flex-1 min-w-0 w-full"
          triggerClassName="h-[42px] rounded-xl border-gray-300 px-4 py-2.5"
          clearable={true}
        />
        {role === "ADMIN" && (
          <Combobox
            options={[
              { value: "featured", label: "Nổi bật" },
              { value: "non-featured", label: "Không nổi bật" }
            ]}
            value={filterFeatured}
            onChange={(val) => {
              setFilterFeatured(val);
              setCurrentPage(1);
            }}
            placeholder="Tất cả nổi bật"
            searchable={false}
            className="flex-1 min-w-0 w-full"
            triggerClassName="h-[42px] rounded-xl border-gray-300 px-4 py-2.5"
            clearable={true}
          />
        )}
      </div>
      <div className="border border-gray-200 overflow-hidden bg-white shadow-sm mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => requestSort("room_number")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                Phòng {getSortIcon("room_number")}
              </TableHead>
              <TableHead onClick={() => requestSort("area")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                Diện tích {getSortIcon("area")}
              </TableHead>
              <TableHead onClick={() => requestSort("bedrooms")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                P.Ngủ {getSortIcon("bedrooms")}
              </TableHead>
              <TableHead onClick={() => requestSort("bathrooms")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                P.Tắm {getSortIcon("bathrooms")}
              </TableHead>
              <TableHead onClick={() => requestSort("rental_price")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                Giá thuê {getSortIcon("rental_price")}
              </TableHead>
              <TableHead onClick={() => requestSort("status")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                Trạng thái {getSortIcon("status")}
              </TableHead>
              {role === "ADMIN" && (
                <TableHead className="text-center w-24">Nổi bật</TableHead>
              )}
              <TableHead className="text-right">Chức năng</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedApartments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={role === "ADMIN" ? 8 : 7} className="text-center py-12 text-gray-500">
                  <Home size={48} className="mx-auto mb-3 text-gray-300" />
                  Không tìm thấy căn hộ nào
                </TableCell>
              </TableRow>
            ) : (
              paginatedApartments.map((apt) => (
                <TableRow key={apt.id}>
                  <TableCell className="font-semibold text-primary-600">
                    {formatApartmentDisplay(
                      apt.room_number,
                      apt.floor,
                      role || undefined,
                      buildings.find((b) => b.id === apt.building_id)?.branch_name
                    )}
                  </TableCell>
                  <TableCell className="text-gray-600">{apt.area} m²</TableCell>
                  <TableCell className="text-gray-655">{apt.bedrooms}</TableCell>
                  <TableCell className="text-gray-655">{apt.bathrooms}</TableCell>
                  <TableCell className="font-semibold text-gray-855">{formatCurrency(apt.rental_price)}</TableCell>
                  <TableCell>{getStatusBadge(apt.status)}</TableCell>
                  {role === "ADMIN" && (
                    <TableCell className="text-center">
                      <button
                        onClick={() => toggleFeatured(apt.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${featuredIds.includes(apt.id)
                          ? "text-amber-500 hover:text-amber-600"
                          : "text-gray-300 hover:text-gray-400"
                          }`}
                        title={featuredIds.includes(apt.id) ? "Bỏ nổi bật" : "Bật nổi bật"}
                      >
                        <Star size={18} fill={featuredIds.includes(apt.id) ? "currentColor" : "none"} />
                      </button>
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => navigate(`/${role?.toLowerCase()}/apartments/${apt.id}`)}
                        className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer" title="Xem chi tiết">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => { setEditItem(apt); modifyModal.onOpen(); }}
                        className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer" title="Sửa">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => { setDeleteItem(apt); }}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer" title="Xóa">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      )}

      {/* Modals */}
      <ApartmentCreateModal
        isOpen={createModal.isOpen}
        onClose={createModal.onClose}
        onSuccess={fetchApartments}
        buildings={buildings}
        role={role}
        managerBuildingId={managedBuildingId || undefined}
      />

      <ApartmentModifyModal
        isOpen={modifyModal.isOpen}
        onClose={() => { modifyModal.onClose(); setEditItem(null); }}
        onSuccess={fetchApartments}
        editItem={editItem}
        buildings={buildings}
        role={role}
      />

      <ApartmentDeleteModal
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        apartment={deleteItem}
      />
    </div>
  );
}
