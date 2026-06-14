import { useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import Badge from "../../components/ui/Badge";
import { mockApartments } from "../../data/apartments";
import { mockBuildings } from "../../data/buildings";
import { APARTMENT_STATUS_LABELS, APARTMENT_STATUS_COLORS } from "../../constants/enums";
import { formatCurrency } from "../../utils/format";

// Trang danh sach can ho cho khach vang lai
export default function GuestApartmentListing() {
  const [search, setSearch] = useState("");
  const [priceFilter, setPriceFilter] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("");
  const [floorFilter, setFloorFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("AVAILABLE");

  // Lay danh sach tang cua toa nha duoc chon
  const floors = (() => {
    if (!buildingFilter) return [];
    const bApts = mockApartments.filter((a) => a.building_id === Number(buildingFilter));
    return [...new Set(bApts.map((a) => a.floor))].sort((a, b) => a - b);
  })();

  // Loc can ho
  const filtered = mockApartments.filter((a) => {
    const matchSearch =
      (a.room_number + " " + (a.description || "")).toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || a.status === statusFilter;
    const matchBuilding = !buildingFilter || a.building_id === Number(buildingFilter);
    const matchFloor = !floorFilter || a.floor === Number(floorFilter);
    let matchPrice = true;
    if (priceFilter === "low") matchPrice = a.rental_price <= 6000000;
    else if (priceFilter === "mid") matchPrice = a.rental_price > 6000000 && a.rental_price <= 15000000;
    else if (priceFilter === "high") matchPrice = a.rental_price > 15000000;
    return matchSearch && matchStatus && matchBuilding && matchFloor && matchPrice;
  });

  return (
    <div className="pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tieu de */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Danh sach can ho</h1>
          <p className="text-gray-500 mt-1">Tim can ho phu hop voi nhu cau cua ban</p>
        </div>

        {/* Bo loc */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tim kiem..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500"
            />
          </div>

          <select
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value)}
            className="px-4 py-3 rounded-xl border border-gray-300 text-sm bg-white cursor-pointer focus:outline-none focus:border-primary-500"
          >
            <option value="">Muc gia</option>
            <option value="low">Duoi 6 trieu</option>
            <option value="mid">6 - 15 trieu</option>
            <option value="high">Tren 15 trieu</option>
          </select>

          <select
            value={buildingFilter}
            onChange={(e) => {
              setBuildingFilter(e.target.value);
              setFloorFilter(""); // Reset floor when building changes
            }}
            className="px-4 py-3 rounded-xl border border-gray-300 text-sm bg-white cursor-pointer focus:outline-none focus:border-primary-500"
          >
            <option value="">Tất cả chi nhánh</option>
            {mockBuildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.branch_name} - {b.name.replace(/yuki\s*house\s*|yuki\s*/gi, "")}
              </option>
            ))}
          </select>

          <select
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
            disabled={!buildingFilter}
            className="px-4 py-3 rounded-xl border border-gray-300 text-sm bg-white cursor-pointer focus:outline-none focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="">Chọn tầng</option>
            {floors.map((floor) => (
              <option key={floor} value={floor}>Tầng {floor}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 rounded-xl border border-gray-300 text-sm bg-white cursor-pointer focus:outline-none focus:border-primary-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="AVAILABLE">Còn trống</option>
            <option value="RENTED">Đang thuê</option>
          </select>
        </div>

        {/* Ket qua */}
        <p className="text-sm text-gray-500 mb-4">{filtered.length} can ho</p>

        {/* Grid can ho */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((apt) => {
            const building = mockBuildings.find((b) => b.id === apt.building_id);
            return (
              <Link
                key={apt.id}
                to={`/apartments/${apt.id}`}
                className="bg-white rounded-2xl shadow-card overflow-hidden hover:shadow-card-hover transition-shadow"
              >
                <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-300 text-sm">Hinh anh can ho</span>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-800">P.{apt.room_number} - Tầng {apt.floor}</h3>
                    <Badge variant={APARTMENT_STATUS_COLORS[apt.status] as "success" | "info" | "warning"}>
                      {APARTMENT_STATUS_LABELS[apt.status]}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400">{building?.branch_name} - {building?.address_new || building?.address_old}</p>
                  <p className="text-sm text-gray-500 line-clamp-2 mt-2">{apt.description}</p>
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
                    <span className="text-sm text-gray-500">{apt.area} m2</span>
                    <span className="text-lg font-bold text-primary-600">{formatCurrency(apt.rental_price)}/thang</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400">Khong tim thay can ho phu hop</p>
          </div>
        )}
      </div>
    </div>
  );
}
