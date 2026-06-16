import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, Loader2 } from "lucide-react";
import Badge from "../../components/ui/Badge";
import { mockApartments } from "../../data/apartments";
import { mockBuildings } from "../../data/buildings";
import { APARTMENT_STATUS_LABELS, APARTMENT_STATUS_COLORS } from "../../constants/enums";
import { formatCurrency, formatApartmentDisplay, removeVietnameseTones } from "../../utils/format";
import * as buildingService from "../../services/buildingService";
import * as apartmentService from "../../services/apartmentService";
import type { BuildingData } from "../../services/buildingService";
import type { ApartmentData } from "../../services/apartmentService";

function getApartmentThumbnail(aptId: number): string {
  const stored = localStorage.getItem(`apartment-${aptId}-images`);
  if (stored) {
    try {
      const images = JSON.parse(stored);
      const thumb = images.find((img: any) => img.is_thumbnail);
      if (thumb) return thumb.image_url;
      if (images.length > 0) return images[0].image_url;
    } catch {
      // ignore
    }
  }
  return "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80";
}

export default function GuestApartmentListing() {
  const [searchParams] = useSearchParams();
  const searchParamVal = searchParams.get("search") || "";

  const [search, setSearch] = useState(searchParamVal);
  const [priceFilter, setPriceFilter] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("");
  const [floorFilter, setFloorFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("AVAILABLE");

  // API State
  const [apartments, setApartments] = useState<ApartmentData[]>([]);
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      buildingService.getAllBuildings({ limit: 100 }),
      apartmentService.getAllApartments({ limit: 1000 })
    ]).then(([bRes, aRes]) => {
      setBuildings(bRes.data);
      setApartments(aRes.data);
    }).catch(() => {
      setBuildings(mockBuildings);
      setApartments(mockApartments as any);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (searchParamVal !== undefined) {
      setSearch(searchParamVal);
    }
  }, [searchParamVal]);

  // Lay danh sach tang cua toa nha duoc chon
  const floors = (() => {
    if (!buildingFilter) return [];
    const bApts = apartments.filter((a) => a.building_id === Number(buildingFilter));
    return [...new Set(bApts.map((a) => a.floor))].sort((a, b) => a - b);
  })();

  // Loc can ho
  const filtered = apartments.filter((a) => {
    const building = buildings.find((b) => b.id === a.building_id);
    const term = removeVietnameseTones(search);
    const roomNorm = removeVietnameseTones(a.room_number);
    const descNorm = removeVietnameseTones(a.description || "");
    const buildingNameNorm = removeVietnameseTones(building?.name || "");
    const branchNameNorm = removeVietnameseTones(building?.branch_name || "");
    const addressNewNorm = removeVietnameseTones(building?.address_new || "");
    const addressOldNorm = removeVietnameseTones(building?.address_old || "");

    const matchSearch =
      roomNorm.includes(term) ||
      descNorm.includes(term) ||
      buildingNameNorm.includes(term) ||
      branchNameNorm.includes(term) ||
      addressNewNorm.includes(term) ||
      addressOldNorm.includes(term);

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
    <div className="pt-20 pb-16 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tieu de */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Danh sách căn hộ</h1>
          <p className="text-gray-500 mt-1">Tìm căn hộ phù hợp với nhu cầu của bạn</p>
        </div>

        {/* Bo loc */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500"
            />
          </div>

          <select
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value)}
            className="px-4 py-3 rounded-xl border border-gray-300 text-sm bg-white cursor-pointer focus:outline-none focus:border-primary-500"
          >
            <option value="">Mức giá</option>
            <option value="low">Dưới 6 triệu</option>
            <option value="mid">Từ 6 - 15 triệu</option>
            <option value="high">Trên 15 triệu</option>
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
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.branch_name}
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

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-primary-600" size={32} />
          </div>
        ) : (
          <>
            {/* Ket qua */}
            <p className="text-sm text-gray-500 mb-4">{filtered.length} căn hộ</p>

            {/* Grid can ho */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((apt) => {
                const building = buildings.find((b) => b.id === apt.building_id);
                return (
                  <Link
                    key={apt.id}
                    to={`/apartments/${apt.id}`}
                    className="bg-white rounded-2xl shadow-card overflow-hidden hover:shadow-card-hover transition-shadow block group border border-gray-100"
                  >
                    <div className="w-full h-48 bg-gray-100 overflow-hidden relative">
                      <img
                        src={getApartmentThumbnail(apt.id)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        alt="Ảnh căn hộ"
                      />
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-800 group-hover:text-primary-600 transition-colors">
                          {formatApartmentDisplay(apt.room_number, apt.floor, "ADMIN", building?.branch_name)}
                        </h3>
                        <Badge variant={APARTMENT_STATUS_COLORS[apt.status as keyof typeof APARTMENT_STATUS_COLORS] as "success" | "info" | "warning"}>
                          {APARTMENT_STATUS_LABELS[apt.status as keyof typeof APARTMENT_STATUS_LABELS]}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{building?.address_new || building?.address_old}</p>
                      <p className="text-sm text-gray-500 line-clamp-2 mt-2">{apt.description}</p>
                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
                        <span className="text-sm text-gray-500">{apt.area} m²</span>
                        <span className="text-lg font-bold text-primary-600">{formatCurrency(apt.rental_price)}/tháng</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-16">
                <p className="text-gray-400">Không tìm thấy căn hộ phù hợp</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
