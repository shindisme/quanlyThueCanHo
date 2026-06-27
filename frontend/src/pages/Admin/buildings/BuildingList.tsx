import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Loader2, Building2, User, Eye, Pencil, Trash2 } from "lucide-react";
import PageHeader from "../../../components/ui/PageHeader";
import Button from "../../../components/ui/Button";
import SearchInput from "../../../components/ui/SearchInput";
import Badge from "../../../components/ui/Badge";
import Pagination from "../../../components/ui/Pagination";
import { toast } from "sonner";


import * as buildingService from "../../../services/buildingService";
import type { BuildingData } from "../../../services/buildingService";

import BuildingCreateModal from "./components/BuildingCreateModal";
import BuildingModifyModal from "./components/BuildingModifyModal";
import BuildingDeleteModal from "./components/BuildingDeleteModal";
import { useAuthStore } from "../../../stores/auth.store";
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
  const { role, managedBuildingId } = useAuthStore();
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [editItem, setEditItem] = useState<BuildingData | null>(null);
  const [deleteItem, setDeleteItem] = useState<BuildingData | null>(null);

  const [status] = useState<string>("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  const fetchBuildings = useCallback(async () => {
    try {
      const result = await buildingService.getAllBuildings({
        page: currentPage,
        limit: pageSize,
        search: search || undefined,
        status: status || undefined,
      });
      setBuildings(result.data);
      setTotalPages(result.pagination.totalPages);
      setTotalCount(result.pagination.total);
    } catch {
      toast.error("Không thể tải danh sách tòa nhà");
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, status, pageSize]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const result = await buildingService.getAllBuildings({
          page: currentPage,
          limit: pageSize,
          search: search || undefined,
          status: status || undefined,
        });
        if (active) {
          setBuildings(result.data);
          setTotalPages(result.pagination.totalPages);
          setTotalCount(result.pagination.total);
        }
      } catch {
        toast.error("Không thể tải danh sách tòa nhà");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    load();
    return () => { active = false; };
  }, [currentPage, search, status, pageSize]);

  const filtered = role === "MANAGER"
    ? buildings.filter((b) => b.id === managedBuildingId)
    : buildings;

  async function handleDelete() {
    if (!deleteItem) return;
    try {
      await buildingService.deleteBuilding(deleteItem.id);
      toast.success(`Đã xóa tòa nhà "${deleteItem.name}"`);
      setDeleteItem(null);
      fetchBuildings();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || "Xóa thất bại");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary-600" size={32} />
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
        <div className="border border-gray-200 overflow-hidden bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên chi nhánh</TableHead>
                <TableHead>Địa chỉ</TableHead>
                <TableHead>Quản lý bởi</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Chức năng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((building) => (
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
