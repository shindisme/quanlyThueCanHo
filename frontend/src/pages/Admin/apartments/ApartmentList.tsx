import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Loader2, Home, Star, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../components/ui/PageHeader";
import Button from "../../../components/ui/Button";
import SearchInput from "../../../components/ui/SearchInput";
import Badge from "../../../components/ui/Badge";
import Pagination from "../../../components/ui/Pagination";
import { toast } from "sonner";

import * as apartmentService from "../../../services/apartmentService";
import * as buildingService from "../../../services/buildingService";
import type { ApartmentData } from "../../../services/apartmentService";
import type { BuildingData } from "../../../services/buildingService";
import { useAuthStore } from "../../../stores/auth.store";

import { useSort } from "../../../hooks/useSort";
import { formatApartmentDisplay } from "../../../utils/format";

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
  const { role, managedBuildingId } = useAuthStore();

  const [apartments, setApartments] = useState<ApartmentData[]>([]);
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFeatured, setFilterFeatured] = useState("");
  const [filterBuilding, setFilterBuilding] = useState<number | undefined>(
    role === "MANAGER" ? (managedBuildingId || undefined) : undefined
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [editItem, setEditItem] = useState<ApartmentData | null>(null);
  const [deleteItem, setDeleteItem] = useState<ApartmentData | null>(null);
  const [featuredIds, setFeaturedIds] = useState<number[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Lấy danh sách tòa nhà 
  useEffect(() => {
    buildingService.getAllBuildings().then((result) => {
      setBuildings(result.data);
    }).catch(() => { });

    const stored = localStorage.getItem("featured-apartment-ids");
    if (stored) {
      try {
        setFeaturedIds(JSON.parse(stored));
      } catch { /* empty */ }
    }
  }, []);

  function toggleFeatured(id: number) {
    let updated: number[];
    if (featuredIds.includes(id)) {
      updated = featuredIds.filter((fid) => fid !== id);
      toast.success("Đã bỏ nổi bật căn hộ");
    } else {
      if (featuredIds.length >= 6) {
        toast.warning("Chỉ được phép đặt tối đa 6 căn hộ nổi bật");
        return;
      }
      updated = [...featuredIds, id];
      toast.success("Đã đặt làm nổi bật trên trang chủ");
    }
    setFeaturedIds(updated);
    localStorage.setItem("featured-apartment-ids", JSON.stringify(updated));
  }

  useEffect(() => {
    fetchApartments();
  }, [filterBuilding]);

  async function fetchApartments() {
    try {
      setLoading(true);
      const result = await apartmentService.getAllApartments({
        building_id: filterBuilding,
        limit: 100,
      });
      setApartments(result.data);
    } catch {
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }

  const filtered = apartments.filter((apt) => {
    if (search) {
      const s = search.toLowerCase();
      const roomMatch = apt.room_number.toLowerCase().includes(s);
      const floorMatch = `tầng ${apt.floor}`.includes(s) || String(apt.floor).includes(s);
      const buildingName = buildings.find((b) => b.id === apt.building_id)?.branch_name.toLowerCase() || "";
      const buildingMatch = buildingName.includes(s);
      if (!roomMatch && !floorMatch && !buildingMatch) {
        return false;
      }
    }

    if (filterStatus && apt.status !== filterStatus) {
      return false;
    }

    if (filterFeatured === "featured" && !featuredIds.includes(apt.id)) {
      return false;
    }
    if (filterFeatured === "non-featured" && featuredIds.includes(apt.id)) {
      return false;
    }

    return true;
  });

  const { items: sortedApartments, requestSort, getSortIcon } = useSort(filtered);

  const totalCount = filtered.length;
  const totalPages = Math.ceil(totalCount / pageSize);

  const paginatedApartments = sortedApartments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  function getStatusBadge(status: string) {
    const map: Record<string, { label: string; variant: string }> = {
      AVAILABLE: { label: "Còn trống", variant: "success" },
      RENTED: { label: "Đang thuê", variant: "info" },
      MAINTENANCE: { label: "Bảo trì", variant: "warning" },
    };
    const s = map[status] || { label: status, variant: "gray" };
    return <Badge variant={s.variant as any}>{s.label}</Badge>;
  }

  async function handleDelete() {
    if (!deleteItem) return;
    try {
      await apartmentService.deleteApartment(deleteItem.id);
      toast.success("Đã xóa căn hộ");
      setDeleteItem(null);
      fetchApartments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Xóa thất bại");
    }
  }

  function formatPrice(price: number) {
    return new Intl.NumberFormat("vi-VN").format(price) + " đ";
  }

  if (loading && apartments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        icon={Home}
        title="Căn hộ"
        subtitle="Quản lý danh sách căn hộ"
        count={totalCount}
        iconColor="linear-gradient(135deg, #3B82F6, #60A5FA)"
        actions={
          <Button onClick={() => setShowCreateModal(true)}><Plus size={18} /> Thêm căn hộ</Button>
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
          <select
            value={filterBuilding || ""}
            onChange={(e) => { setFilterBuilding(e.target.value ? Number(e.target.value) : undefined); setCurrentPage(1); }}
            className="flex-1 min-w-0 px-4 py-2.5 rounded-xl border border-gray-300 text-sm bg-white focus:outline-none focus:border-primary-500 h-[42px]"
          >
            <option value="">Tất cả chi nhánh</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>{b.branch_name}</option>
            ))}
          </select>
        )}
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
          className="flex-1 min-w-0 px-4 py-2.5 rounded-xl border border-gray-300 text-sm bg-white focus:outline-none focus:border-primary-500 h-[42px]"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="AVAILABLE">Còn trống</option>
          <option value="RENTED">Đang thuê</option>
          <option value="MAINTENANCE">Bảo trì</option>
        </select>
        {role === "ADMIN" && (
          <select
            value={filterFeatured}
            onChange={(e) => { setFilterFeatured(e.target.value); setCurrentPage(1); }}
            className="flex-1 min-w-0 px-4 py-2.5 rounded-xl border border-gray-300 text-sm bg-white focus:outline-none focus:border-primary-500 h-[42px]"
          >
            <option value="">Tất cả nổi bật</option>
            <option value="featured">Nổi bật</option>
            <option value="non-featured">Không nổi bật</option>
          </select>
        )}
      </div>
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm mt-6">
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
                PN {getSortIcon("bedrooms")}
              </TableHead>
              <TableHead onClick={() => requestSort("bathrooms")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                PT {getSortIcon("bathrooms")}
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
            {paginatedApartments.map((apt) => (
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
                <TableCell className="text-gray-650">{apt.bedrooms}</TableCell>
                <TableCell className="text-gray-650">{apt.bathrooms}</TableCell>
                <TableCell className="font-semibold text-gray-850">{formatPrice(apt.rental_price)}</TableCell>
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
                    <button onClick={() => { setEditItem(apt); setShowModifyModal(true); }}
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
            ))}
            {paginatedApartments.length === 0 && (
              <TableRow>
                <TableCell colSpan={role === "ADMIN" ? 8 : 7} className="text-center py-12 text-gray-500">
                  <Home size={48} className="mx-auto mb-3 text-gray-300" />
                  Không tìm thấy căn hộ nào
                </TableCell>
              </TableRow>
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
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchApartments}
        buildings={buildings}
        role={role}
        managerBuildingId={managedBuildingId || undefined}
      />

      <ApartmentModifyModal
        isOpen={showModifyModal}
        onClose={() => { setShowModifyModal(false); setEditItem(null); }}
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
