import { useState, useEffect } from "react";
import { Zap, Plus, Droplets } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import SearchInput from "../../components/ui/SearchInput";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

import { mockUtilityReadings } from "../../data/utilities";
import * as apartmentService from "../../services/apartments.service";
import * as buildingService from "../../services/buildings.service";
import type { ApartmentData } from "../../services/apartments.service";
import type { BuildingData } from "../../services/buildings.service";
import { useAuthStore } from "../../stores/auth.store";
import { mockUsers } from "../../data/users";

interface UtilityRecord {
  id: number;
  apartment_id: number;
  month: number;
  year: number;
  electric_old: number;
  electric_new: number;
  water_old: number;
  water_new: number;
  recorded_by: number;
  created_at: string;
}

export default function UtilityList() {
  const { role, email } = useAuthStore();
  const currentUser = mockUsers.find((u) => u.email === email);
  const managerBuildingId = currentUser?.managedBuildingId;

  const [readings, setReadings] = useState<UtilityRecord[]>(mockUtilityReadings as UtilityRecord[]);
  const [apartments, setApartments] = useState<ApartmentData[]>([]);
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterBuilding, setFilterBuilding] = useState<number | undefined>(
    role === "MANAGER" ? managerBuildingId : undefined
  );
  const [selectedFormFloor, setSelectedFormFloor] = useState<number | undefined>();

  // Form nhập chỉ số
  const [formData, setFormData] = useState({
    apartment_id: 0,
    electric_new: 0,
    water_new: 0,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  useEffect(() => {
    // Load danh sách căn hộ & tòa nhà cho dropdown
    buildingService.getAllBuildings().then((r) => setBuildings(r.data)).catch(() => { });
    apartmentService.getAllApartments({ limit: 1000 }).then((r) => setApartments(r.data)).catch(() => { });
  }, []);

  // Lấy tên căn hộ
  function getApartmentLabel(aptId: number) {
    const apt = apartments.find((a) => a.id === aptId);
    if (!apt) return `#${aptId}`;
    const bld = buildings.find((b) => b.id === apt.building_id);
    return `P.${apt.room_number} T${apt.floor} - ${bld?.branch_name || ""}`;
  }

  // Lọc theo tòa nhà & tìm kiếm
  const filtered = readings.filter((r) => {
    const apt = apartments.find((a) => a.id === r.apartment_id);
    if (filterBuilding && apt?.building_id !== filterBuilding) return false;
    if (search) {
      const label = getApartmentLabel(r.apartment_id).toLowerCase();
      return label.includes(search.toLowerCase());
    }
    return true;
  });

  // Chart data
  const chartData = filtered.slice(0, 10).map((r) => ({
    name: getApartmentLabel(r.apartment_id).split(" - ")[0],
    electric: r.electric_new - r.electric_old,
    water: r.water_new - r.water_old,
  }));

  // Tìm chỉ số cũ (lần nhập trước) cho căn hộ đã chọn
  function getLastReading(aptId: number) {
    const prev = readings
      .filter((r) => r.apartment_id === aptId)
      .sort((a, b) => b.year * 100 + b.month - (a.year * 100 + a.month));
    return prev[0] || null;
  }

  function handleSelectApartment(aptId: number) {
    const last = getLastReading(aptId);
    setFormData({
      ...formData,
      apartment_id: aptId,
      electric_new: last?.electric_new || 0,
      water_new: last?.water_new || 0,
    });
  }

  function handleSave() {
    if (!formData.apartment_id) {
      toast.error("Vui lòng chọn căn hộ");
      return;
    }
    const last = getLastReading(formData.apartment_id);

    // Validate
    if (formData.electric_new < (last?.electric_new || 0)) {
      toast.error("Chỉ số điện mới phải lớn hơn chỉ số cũ");
      return;
    }
    if (formData.water_new < (last?.water_new || 0)) {
      toast.error("Chỉ số nước mới phải lớn hơn chỉ số cũ");
      return;
    }

    // Tạo record mới (mock - chờ backend API)
    const newRecord: UtilityRecord = {
      id: Date.now(),
      apartment_id: formData.apartment_id,
      month: formData.month,
      year: formData.year,
      electric_old: last?.electric_new || 0,
      electric_new: formData.electric_new,
      water_old: last?.water_new || 0,
      water_new: formData.water_new,
      recorded_by: 1,
      created_at: new Date().toISOString(),
    };

    setReadings([newRecord, ...readings]);
    toast.success("Đã lưu chỉ số điện nước");
    setShowForm(false);
    setSelectedFormFloor(undefined);
    setFormData({
      apartment_id: 0, electric_new: 0, water_new: 0,
      month: new Date().getMonth() + 1, year: new Date().getFullYear(),
    });
  }

  // Lọc apartment theo tòa nhà
  const filteredApartments = filterBuilding
    ? apartments.filter((a) => a.building_id === filterBuilding)
    : apartments;

  // Lấy các tầng duy nhất của tòa nhà được chọn
  const formFloors = (() => {
    if (!filterBuilding) return [];
    const buildingApts = apartments.filter((a) => a.building_id === filterBuilding);
    const floors = buildingApts.map((a) => a.floor);
    return [...new Set(floors)].sort((a, b) => a - b);
  })();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Zap}
        title="Điện nước"
        subtitle="Quản lý và nhập chỉ số tiêu thụ điện nước"
        count={readings.length}
        iconColor="linear-gradient(135deg, #F59E0B, #FBBF24)"
        actions={
          role !== "ADMIN" && (
            <Button onClick={() => setShowForm(true)}>
              <Plus size={18} /> Nhập chỉ số
            </Button>
          )
        }
      />

      {/* Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo phòng..." className="max-w-xs" />
        {role !== "MANAGER" ? (
          <select
            value={filterBuilding || ""}
            onChange={(e) => setFilterBuilding(e.target.value ? Number(e.target.value) : undefined)}
            className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:border-primary-500"
          >
            <option value="">Tất cả chi nhánh</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.branch_name} - {b.name.replace(/yuki\s*house\s*|yuki\s*/gi, "")}
              </option>
            ))}
          </select>
        ) : (
          <div className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm bg-gray-50 text-gray-500 font-medium">
            Chi nhánh: {buildings.find(b => b.id === filterBuilding)?.branch_name || "Đang tải..."}
          </div>
        )}
      </div>

      {/* Biểu đồ */}
      <Card>
        <h3 className="font-semibold text-gray-800 mb-4">Biểu đồ tiêu thụ</h3>
        <ResponsiveContainer width="100%" height={250} debounce={150}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
            <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
            <Tooltip />
            <Bar dataKey="electric" fill="#F59E0B" name="Điện (kWh)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="water" fill="#3B82F6" name="Nước (m³)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Bảng chỉ số */}
      <div className="premium-table-container">
        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Căn hộ</th>
                <th>Kỳ</th>
                <th>Điện cũ</th>
                <th>Điện mới</th>
                <th>Tiêu thụ điện</th>
                <th>Nước cũ</th>
                <th>Nước mới</th>
                <th>Tiêu thụ nước</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="font-medium">{getApartmentLabel(r.apartment_id)}</td>
                  <td>Tháng {r.month}/{r.year}</td>
                  <td className="text-gray-600">{r.electric_old} kWh</td>
                  <td className="text-gray-600">{r.electric_new} kWh</td>
                  <td>
                    <span className="font-semibold text-warning-600">
                      <Zap size={14} className="inline mr-1" />
                      {r.electric_new - r.electric_old} kWh
                    </span>
                  </td>
                  <td className="text-gray-600">{r.water_old} m³</td>
                  <td className="text-gray-600">{r.water_new} m³</td>
                  <td>
                    <span className="font-semibold text-info-600">
                      <Droplets size={14} className="inline mr-1" />
                      {r.water_new - r.water_old} m³
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-500">
                    Chưa có dữ liệu điện nước
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal nhập chỉ số */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Nhập chỉ số điện nước"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowForm(false)}>Hủy</Button>
            <Button onClick={handleSave}>Lưu chỉ số</Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Chọn chi nhánh */}
            <div className="col-span-12 sm:col-span-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Chi nhánh *</label>
              <select
                value={filterBuilding || ""}
                onChange={(e) => {
                  setFilterBuilding(e.target.value ? Number(e.target.value) : undefined);
                  setSelectedFormFloor(undefined);
                  setFormData({ ...formData, apartment_id: 0 });
                }}
                disabled={role === "MANAGER"}
                className="premium-select w-full rounded-xl disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="">Chọn chi nhánh</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.branch_name} - {b.name.replace(/yuki\s*house\s*|yuki\s*/gi, "")}
                  </option>
                ))}
              </select>
            </div>

            {/* Chọn Tầng */}
            <div className="col-span-12 sm:col-span-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tầng *</label>
              <select
                value={selectedFormFloor || ""}
                onChange={(e) => {
                  setSelectedFormFloor(e.target.value ? Number(e.target.value) : undefined);
                  setFormData({ ...formData, apartment_id: 0 });
                }}
                disabled={!filterBuilding}
                className="premium-select w-full rounded-xl disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="">Chọn tầng</option>
                {formFloors.map((floor) => (
                  <option key={floor} value={floor}>Tầng {floor}</option>
                ))}
              </select>
            </div>

            {/* Chọn căn hộ */}
            <div className="col-span-12 sm:col-span-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Căn hộ *</label>
              <select
                value={formData.apartment_id}
                onChange={(e) => handleSelectApartment(Number(e.target.value))}
                disabled={!selectedFormFloor}
                className="premium-select w-full rounded-xl disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value={0}>Chọn căn hộ</option>
                {filteredApartments
                  .filter((a) => a.floor === selectedFormFloor)
                  .map((apt) => (
                    <option key={apt.id} value={apt.id}>
                      P.{apt.room_number} ({apt.area}m²)
                    </option>
                  ))}
              </select>
            </div>

            {/* Kỳ */}
            <div className="col-span-6 sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tháng</label>
              <select
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })}
                className="premium-select w-full rounded-xl"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                ))}
              </select>
            </div>
            <div className="col-span-6 sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Năm</label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                className="premium-input rounded-xl"
              />
            </div>

            {/* Chỉ số cũ (tự động) */}
            {formData.apartment_id > 0 && (
              <>
                <div className="col-span-12">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Chỉ số cũ (tự động từ lần nhập trước)</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">Điện cũ: </span>
                        <span className="font-semibold text-warning-600">
                          {getLastReading(formData.apartment_id)?.electric_new || 0} kWh
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Nước cũ: </span>
                        <span className="font-semibold text-info-600">
                          {getLastReading(formData.apartment_id)?.water_new || 0} m³
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Chỉ số mới */}
            <div className="col-span-12 sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Zap size={14} className="inline text-warning-500 mr-1" />
                Chỉ số điện mới (kWh) *
              </label>
              <input
                type="number"
                value={formData.electric_new || ""}
                onChange={(e) => setFormData({ ...formData, electric_new: Number(e.target.value) })}
                className="premium-input rounded-xl"
                min={0}
              />
              {formData.apartment_id > 0 && formData.electric_new > 0 && (
                <p className="text-xs text-warning-600 mt-1">
                  Tiêu thụ: {formData.electric_new - (getLastReading(formData.apartment_id)?.electric_new || 0)} kWh
                </p>
              )}
            </div>
            <div className="col-span-12 sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Droplets size={14} className="inline text-info-500 mr-1" />
                Chỉ số nước mới (m³) *
              </label>
              <input
                type="number"
                value={formData.water_new || ""}
                onChange={(e) => setFormData({ ...formData, water_new: Number(e.target.value) })}
                className="premium-input rounded-xl"
                min={0}
              />
              {formData.apartment_id > 0 && formData.water_new > 0 && (
                <p className="text-xs text-info-600 mt-1">
                  Tiêu thụ: {formData.water_new - (getLastReading(formData.apartment_id)?.water_new || 0)} m³
                </p>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
