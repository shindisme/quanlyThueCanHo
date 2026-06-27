import { useState, useEffect, useCallback } from "react";
import { Zap, Plus, Pencil, Trash2, Loader2, Calendar, Sparkles, Eye } from "lucide-react";
import PageHeader from "../../../components/PageHeader";
import Button from "../../../components/ui/Button";
import SearchInput from "../../../components/ui/SearchInput";
import Combobox from "../../../components/ui/Combobox";
import Pagination from "../../../components/ui/Pagination";
import Modal from "../../../components/ui/Modal";
import Input from "../../../components/ui/Input";
import { toast } from "sonner";

import { useAuthStore } from "../../../stores/auth.store";
import * as utilityService from "../../../services/utilityService";
import type { UtilityReadingData } from "../../../services/utilityService";
import * as buildingService from "../../../services/buildingService";
import type { BuildingData } from "../../../services/buildingService";
import * as apartmentService from "../../../services/apartmentService";
import type { ApartmentData } from "../../../services/apartmentService";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../../components/ui/Table";
import { useSort } from "../../../hooks/useSort";
import { removeVietnameseTones, formatDate } from "../../../utils/format";

export default function UtilityList() {
  const { role, managedBuildingId } = useAuthStore();
  const isWritable = role === "MANAGER" || role === "STAFF";

  const [readings, setReadings] = useState<UtilityReadingData[]>([]);
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [apartments, setApartments] = useState<ApartmentData[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [filterBuilding, setFilterBuilding] = useState<string>("");
  const [filterMonth, setFilterMonth] = useState<string>("");
  const [filterYear, setFilterYear] = useState<string>("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<UtilityReadingData | null>(null);
  const [saving, setSaving] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);

  // Form State
  const [formBuildingId, setFormBuildingId] = useState<string>("");
  const [formFloor, setFormFloor] = useState<string>("");
  const [formApartmentId, setFormApartmentId] = useState<string>("");
  const [formMonth, setFormMonth] = useState<number>(new Date().getMonth() + 1);
  const [formYear, setFormYear] = useState<number>(new Date().getFullYear());
  const [formElectricOld, setFormElectricOld] = useState<string>("");
  const [formElectricNew, setFormElectricNew] = useState<string>("");
  const [formWaterOld, setFormWaterOld] = useState<string>("");
  const [formWaterNew, setFormWaterNew] = useState<string>("");

  // Fetch all initial data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch utility readings
      const readingsParams: any = { limit: 1000 };
      if (role !== "ADMIN" && managedBuildingId) {
        readingsParams.building_id = managedBuildingId;
      }
      const readingsRes = await utilityService.getAllUtilityReadings(readingsParams);
      setReadings(readingsRes.data || []);

      // Fetch buildings
      const bRes = await buildingService.getAllBuildings({ limit: 100 });
      setBuildings(bRes.data || []);

      // Fetch apartments
      const aptParams: any = { limit: 1000 };
      if (role !== "ADMIN" && managedBuildingId) {
        aptParams.building_id = managedBuildingId;
      }
      const aptRes = await apartmentService.getAllApartments(aptParams);
      setApartments(aptRes.data || []);

    } catch (error) {
      toast.error("Không thể tải dữ liệu điện nước");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [role, managedBuildingId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  useEffect(() => {
    if (role !== "ADMIN" && managedBuildingId) {
      setFilterBuilding(String(managedBuildingId));
    }
  }, [role, managedBuildingId]);

  useEffect(() => {
    if (formApartmentId && !editItem && showModal) {
      const aptReadings = readings
        .filter((r) => r.apartment_id === Number(formApartmentId))
        .sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return b.month - a.month;
        });

      if (aptReadings.length > 0) {
        setFormElectricOld(String(aptReadings[0].electric_new));
        setFormWaterOld(String(aptReadings[0].water_new));
      } else {
        setFormElectricOld("0");
        setFormWaterOld("0");
      }
    }
  }, [formApartmentId, editItem, showModal, readings]);

  // Open modal for Create/Update/View
  const handleOpenModal = (item: UtilityReadingData | null = null, viewOnly = false) => {
    setIsViewOnly(viewOnly);
    setEditItem(item);
    if (item) {
      setFormBuildingId(String(item.apartment?.building_id || ""));
      setFormFloor(String(item.apartment?.floor || ""));
      setFormApartmentId(String(item.apartment_id));
      setFormMonth(item.month);
      setFormYear(item.year);
      setFormElectricOld(String(item.electric_old));
      setFormElectricNew(String(item.electric_new));
      setFormWaterOld(String(item.water_old));
      setFormWaterNew(String(item.water_new));
    } else {
      const defaultBId = role !== "ADMIN" && managedBuildingId ? String(managedBuildingId) : "";
      setFormBuildingId(defaultBId);
      setFormFloor("");
      setFormApartmentId("");
      setFormMonth(new Date().getMonth() + 1);
      setFormYear(new Date().getFullYear());
      setFormElectricOld("");
      setFormElectricNew("");
      setFormWaterOld("");
      setFormWaterNew("");
    }
    setShowModal(true);
  };

  // Delete utility reading
  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bản ghi điện nước này?")) return;
    try {
      await utilityService.deleteUtilityReading(id);
      toast.success("Xóa chỉ số điện nước thành công");
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể xóa bản ghi");
    }
  };

  // Submit form (Save / Update)
  const handleSave = async () => {
    if (!formApartmentId) {
      toast.error("Vui lòng chọn căn hộ");
      return;
    }
    if (!formElectricNew || !formWaterNew) {
      toast.error("Vui lòng nhập đầy đủ chỉ số mới");
      return;
    }

    const electricNew = Number(formElectricNew);
    const electricOld = Number(formElectricOld);
    const waterNew = Number(formWaterNew);
    const waterOld = Number(formWaterOld);

    if (electricNew < electricOld) {
      toast.error("Chỉ số điện mới không được nhỏ hơn chỉ số cũ");
      return;
    }
    if (waterNew < waterOld) {
      toast.error("Chỉ số nước mới không được nhỏ hơn chỉ số cũ");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        apartment_id: Number(formApartmentId),
        month: formMonth,
        year: formYear,
        electric_old: electricOld,
        electric_new: electricNew,
        water_old: waterOld,
        water_new: waterNew,
      };

      if (editItem) {
        await utilityService.updateUtilityReading(editItem.id, payload);
        toast.success("Cập nhật chỉ số điện nước thành công");
      } else {
        await utilityService.createUtilityReading(payload);
        toast.success("Ghi chỉ số điện nước thành công");
      }
      setShowModal(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gặp lỗi khi lưu chỉ số");
    } finally {
      setSaving(false);
    }
  };

  // Filter logic
  const filtered = readings.filter((r) => {
    const term = removeVietnameseTones(search);
    const roomNorm = removeVietnameseTones(r.apartment?.room_number || "");
    const buildingNorm = removeVietnameseTones(r.apartment?.building?.branch_name || "");
    const staffNorm = removeVietnameseTones(r.staff?.full_name || "");

    const matchesSearch = roomNorm.includes(term) || buildingNorm.includes(term) || staffNorm.includes(term);
    const matchesBuilding = !filterBuilding || r.apartment?.building_id === Number(filterBuilding);
    const matchesMonth = !filterMonth || r.month === Number(filterMonth);
    const matchesYear = !filterYear || r.year === Number(filterYear);

    return matchesSearch && matchesBuilding && matchesMonth && matchesYear;
  });

  const { items: sortedReadings, requestSort, getSortIcon } = useSort(filtered);

  // Pagination slice
  const totalPages = Math.ceil(filtered.length / pageSize);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedReadings = sortedReadings.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getMonthOptions = () => {
    return Array.from({ length: 12 }).map((_, idx) => ({
      value: String(idx + 1),
      label: `Tháng ${idx + 1}`,
    }));
  };

  const getYearOptions = () => {
    const startYear = 2024;
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = startYear; y <= currentYear + 1; y++) {
      years.push({ value: String(y), label: `Năm ${y}` });
    }
    return years.reverse();
  };

  // Options for modal apartment picker
  const filteredApartments = apartments.filter((apt) => {
    if (role !== "ADMIN" && managedBuildingId) {
      return apt.building_id === managedBuildingId;
    }
    return true;
  });

  const buildingOptions = buildings.map((b) => ({
    value: String(b.id),
    label: b.branch_name,
  }));

  const floorOptions = (() => {
    if (!formBuildingId) return [];
    const b = buildings.find((x) => x.id === Number(formBuildingId));
    if (!b) return [];
    return Array.from({ length: b.total_floors }, (_, i) => ({
      value: String(i + 1),
      label: `Tầng ${i + 1}`,
    }));
  })();

  const modalApartmentOptions = apartments
    .filter((apt) => {
      const matchBuilding = !formBuildingId || apt.building_id === Number(formBuildingId);
      const matchFloor = !formFloor || apt.floor === Number(formFloor);
      return matchBuilding && matchFloor;
    })
    .map((apt) => ({
      value: String(apt.id),
      label: `P.${apt.floor}${apt.room_number}`,
    }));

  if (loading && readings.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        icon={Zap}
        title="Điện nước"
        subtitle="Quản lý và ghi chỉ số tiêu thụ điện nước"
        count={filtered.length}
        iconColor="linear-gradient(135deg, #10B981, #34D399)"
        actions={
          isWritable && (
            <Button onClick={() => handleOpenModal(null)}>
              <Plus size={18} /> Ghi chỉ số mới
            </Button>
          )
        }
      />

      {/* Filter Options */}
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:items-center">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setCurrentPage(1); }}
          placeholder="Tìm phòng, tòa nhà, người ghi..."
          className="flex-1 max-w-md w-full sm:w-72"
        />

        {role === "ADMIN" && (
          <Combobox
            options={buildings.map((b) => ({ value: String(b.id), label: b.branch_name }))}
            value={filterBuilding}
            onChange={(val) => { setFilterBuilding(val); setCurrentPage(1); }}
            placeholder="Tất cả chi nhánh"
            className="w-full sm:w-48"
            triggerClassName="h-10 border-gray-300"
            clearable={true}
          />
        )}

        <Combobox
          options={getMonthOptions()}
          value={filterMonth}
          onChange={(val) => { setFilterMonth(val); setCurrentPage(1); }}
          placeholder="Tất cả tháng"
          searchable={false}
          className="w-full sm:w-36"
          triggerClassName="h-10 border-gray-300"
          clearable={true}
        />

        <Combobox
          options={getYearOptions()}
          value={filterYear}
          onChange={(val) => { setFilterYear(val); setCurrentPage(1); }}
          placeholder="Tất cả năm"
          searchable={false}
          className="w-full sm:w-36"
          triggerClassName="h-10 border-gray-300"
          clearable={true}
        />
      </div>

      <div className="border border-gray-200 overflow-hidden bg-white shadow-sm">
        <Table className="compact">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">STT</TableHead>
              <TableHead onClick={() => requestSort("apartment.building.branch_name")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                Chi nhánh {getSortIcon("apartment.building.branch_name")}
              </TableHead>
              <TableHead onClick={() => requestSort("apartment.room_number")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                Căn hộ {getSortIcon("apartment.room_number")}
              </TableHead>
              <TableHead className="text-center">Tháng / Năm</TableHead>
              <TableHead className="text-right font-semibold text-emerald-600 bg-emerald-50/30">Điện dùng (kWh)</TableHead>
              <TableHead className="text-right font-semibold text-blue-600 bg-blue-50/30">Nước dùng (m³)</TableHead>
              <TableHead>Người ghi</TableHead>
              <TableHead>Ngày ghi</TableHead>
              <TableHead className="text-center w-28">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedReadings.map((r, index) => {
              const electricOld = Number(r.electric_old);
              const electricNew = Number(r.electric_new);
              const electricDiff = electricNew - electricOld;

              const waterOld = Number(r.water_old);
              const waterNew = Number(r.water_new);
              const waterDiff = waterNew - waterOld;

              return (
                <TableRow key={r.id}>
                  <TableCell className="text-center text-gray-500 font-medium">
                    {(currentPage - 1) * pageSize + index + 1}
                  </TableCell>
                  <TableCell className="font-semibold text-gray-800">
                    {r.apartment?.building?.branch_name || "Yuki House"}
                  </TableCell>
                  <TableCell className="font-semibold text-[#3f6ad8]">
                    P.{r.apartment?.floor}{r.apartment?.room_number}
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {r.month}/{r.year}
                  </TableCell>
                  <TableCell className="text-right font-bold text-emerald-650 bg-emerald-50/20 font-mono">{electricDiff}</TableCell>
                  <TableCell className="text-right font-bold text-blue-650 bg-blue-50/20 font-mono">{waterDiff}</TableCell>
                  <TableCell className="font-medium text-gray-700">{r.staff?.full_name || "Hệ thống"}</TableCell>
                  <TableCell className="text-xs text-gray-500">{formatDate(r.created_at)}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleOpenModal(r, true)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                        title="Xem chi tiết"
                      >
                        <Eye size={15} />
                      </button>
                      {isWritable && (
                        <>
                          <button
                            onClick={() => handleOpenModal(r, false)}
                            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg cursor-pointer"
                            title="Sửa chỉ số"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="p-1.5 text-gray-400 hover:text-red-650 hover:bg-red-50 rounded-lg cursor-pointer"
                            title="Xóa bản ghi"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-16 text-gray-500">
                  <Sparkles size={48} className="mx-auto mb-3 text-gray-300" />
                  Không tìm thấy chỉ số điện nước nào
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

      {/* Write/Edit/View Reading Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={isViewOnly ? "Chi tiết chỉ số điện nước" : editItem ? "Cập nhật chỉ số điện nước" : "Ghi chỉ số điện nước mới"}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowModal(false)}>{isViewOnly ? "Đóng" : "Hủy"}</Button>
            {!isViewOnly && (
              <Button onClick={handleSave} isLoading={saving}>Lưu thông tin</Button>
            )}
          </>
        }
      >
        <div className="space-y-5">
          {/* Building selection*/}
          {role === "ADMIN" && (
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Chi nhánh / Tòa nhà *</label>
              <Combobox
                options={buildingOptions}
                value={formBuildingId}
                onChange={(val) => {
                  setFormBuildingId(val);
                  setFormFloor("");
                  setFormApartmentId("");
                }}
                disabled={isViewOnly || !!editItem}
                placeholder="Chọn chi nhánh"
                searchPlaceholder="Tìm kiếm chi nhánh..."
                triggerClassName="h-10 border-gray-300"
                clearable={false}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Floor selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Tầng *</label>
              <Combobox
                options={floorOptions}
                value={formFloor}
                onChange={(val) => {
                  setFormFloor(val);
                  setFormApartmentId("");
                }}
                disabled={isViewOnly || !!editItem || !formBuildingId}
                placeholder={formBuildingId ? "Chọn tầng" : "Chọn tòa nhà trước"}
                searchable={false}
                triggerClassName="h-10 border-gray-300"
                clearable={false}
              />
            </div>

            {/* Room selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Căn hộ / Phòng *</label>
              <Combobox
                options={modalApartmentOptions}
                value={formApartmentId}
                onChange={(val) => setFormApartmentId(val)}
                disabled={isViewOnly || !!editItem || !formFloor}
                placeholder={formFloor ? "Chọn phòng" : "Chọn tầng trước"}
                searchPlaceholder="Tìm phòng..."
                triggerClassName="h-10 border-gray-300"
                clearable={false}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Tháng ghi *</label>
              <Combobox
                options={getMonthOptions()}
                value={String(formMonth)}
                onChange={(val) => setFormMonth(Number(val))}
                disabled={isViewOnly || !!editItem}
                placeholder="Chọn tháng"
                searchable={false}
                triggerClassName="h-10 border-gray-300"
                clearable={false}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Năm ghi *</label>
              <Combobox
                options={getYearOptions()}
                value={String(formYear)}
                onChange={(val) => setFormYear(Number(val))}
                disabled={isViewOnly || !!editItem}
                placeholder="Chọn năm"
                searchable={false}
                triggerClassName="h-10 border-gray-300"
                clearable={false}
              />
            </div>
          </div>

          {/* Electric readings */}
          <div className="bg-emerald-50/25 p-4 border border-emerald-100 rounded-lg space-y-4">
            <h4 className="font-bold text-emerald-800 text-sm flex items-center gap-1.5">
              <Zap size={16} /> Chỉ số Điện (kWh)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Chỉ số điện cũ"
                type="number"
                value={formElectricOld}
                onChange={(e) => setFormElectricOld(e.target.value)}
                disabled={isViewOnly}
                placeholder="Nhập số điện cũ"
              />
              <Input
                label="Chỉ số điện mới *"
                type="number"
                value={formElectricNew}
                onChange={(e) => setFormElectricNew(e.target.value)}
                disabled={isViewOnly}
                placeholder="Nhập số điện mới"
              />
            </div>
            {formElectricNew && (
              <p className="text-xs text-emerald-700 font-semibold text-right">
                Điện năng sử dụng: {Math.max(0, Number(formElectricNew) - Number(formElectricOld))} kWh
              </p>
            )}
          </div>

          {/* Water readings */}
          <div className="bg-blue-50/25 p-4 border border-blue-100 rounded-lg space-y-4">
            <h4 className="font-bold text-blue-800 text-sm flex items-center gap-1.5">
              <Calendar size={16} /> Chỉ số Nước (m³)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Chỉ số nước cũ"
                type="number"
                value={formWaterOld}
                onChange={(e) => setFormWaterOld(e.target.value)}
                disabled={isViewOnly}
                placeholder="Nhập số nước cũ"
              />
              <Input
                label="Chỉ số nước mới *"
                type="number"
                value={formWaterNew}
                onChange={(e) => setFormWaterNew(e.target.value)}
                disabled={isViewOnly}
                placeholder="Nhập số nước mới"
              />
            </div>
            {formWaterNew && (
              <p className="text-xs text-blue-700 font-semibold text-right">
                Lượng nước sử dụng: {Math.max(0, Number(formWaterNew) - Number(formWaterOld))} m³
              </p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
