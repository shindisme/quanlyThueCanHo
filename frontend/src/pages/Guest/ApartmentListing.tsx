import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, Loader2 } from "lucide-react";
import Badge from "../../components/ui/Badge";
import Combobox from "../../components/ui/Combobox";
import { APARTMENT_STATUS_LABELS, APARTMENT_STATUS_COLORS } from "../../constants/enums";
import { formatCurrency, formatApartmentDisplay, removeVietnameseTones } from "../../utils/format";
import * as buildingService from "../../services/buildingService";
import * as apartmentService from "../../services/apartmentService";
import type { BuildingData } from "../../services/buildingService";
import type { ApartmentData } from "../../services/apartmentService";

import type { ApartmentImage } from "../../types";

function getApartmentThumbnail(apt: ApartmentData): string {
  if (apt && apt.images && Array.isArray(apt.images) && apt.images.length > 0) {
    const thumb = (apt.images as ApartmentImage[]).find((img) => img.is_thumbnail);
    if (thumb) return thumb.image_url;
    return apt.images[0].image_url;
  }
  return "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80";
}

export default function GuestApartmentListing() {
  const [searchParams] = useSearchParams();
  const searchParamVal = searchParams.get("search") || "";

  const [search, setSearch] = useState(searchParamVal);
  const [prevSearchParamVal, setPrevSearchParamVal] = useState(searchParamVal);
  if (searchParamVal !== prevSearchParamVal) {
    setSearch(searchParamVal);
    setPrevSearchParamVal(searchParamVal);
  }
  const [priceFilter, setPriceFilter] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("");
  const [floorFilter, setFloorFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("AVAILABLE");

  // API State
  const [apartments, setApartments] = useState<ApartmentData[]>([]);
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [loading, setLoading] = useState(true);

  // Load buildings once on mount
  useEffect(() => {
    buildingService.getAllBuildings({ limit: 100 }).then((res) => {
      setBuildings(res.data);
      if (res.data && res.data.length > 0) {
        setBuildingFilter(String(res.data[0].id));
      }
    }).catch(() => {
      setBuildings([]);
    });
  }, []);

  // Fetch apartments when selected building changes
  useEffect(() => {
    async function fetchApartmentsForBuilding() {
      try {
        setLoading(true);
        const bId = buildingFilter ? Number(buildingFilter) : undefined;
        const [res1, res2] = await Promise.all([
          apartmentService.getAllApartments({
            building_id: bId,
            limit: 100,
            page: 1,
          }),
          apartmentService.getAllApartments({
            building_id: bId,
            limit: 100,
            page: 2,
          })
        ]);
        const combined = [...res1.data, ...res2.data];
        const unique = combined.filter((a, index, self) => self.findIndex(t => t.id === a.id) === index);
        setApartments(unique);
      } catch {
        setApartments([]);
      } finally {
        setLoading(false);
      }
    }

    fetchApartmentsForBuilding();
  }, [buildingFilter]);

  // Lay danh sach tang cua toa nha duoc chon
  const floors = (() => {
    if (!buildingFilter) return [];
    const building = buildings.find((b) => b.id === Number(buildingFilter));
    if (!building) return [];
    return Array.from({ length: building.total_floors }, (_, i) => i + 1);
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
        <div className="flex flex-col sm:flex-row gap-3 w-full mb-8">
          <div className="relative flex-1 min-w-[200px] h-[42px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500 h-[42px] bg-white text-gray-800"
            />
          </div>

          <Combobox
            options={[
              { value: "low", label: "Dưới 6 triệu" },
              { value: "mid", label: "Từ 6 - 15 triệu" },
              { value: "high", label: "Trên 15 triệu" }
            ]}
            value={priceFilter}
            onChange={(val) => setPriceFilter(val)}
            placeholder="Mức giá"
            searchable={false}
            className="flex-1 min-w-[150px]"
            triggerClassName="h-[42px] rounded-xl border-gray-300 px-4 py-2.5"
            clearable={true}
          />

          <Combobox
            options={buildings.map((b) => ({ value: String(b.id), label: b.branch_name }))}
            value={buildingFilter}
            onChange={(val) => {
              setBuildingFilter(val);
              setFloorFilter("");
            }}
            placeholder="Tất cả chi nhánh"
            searchPlaceholder="Tìm chi nhánh..."
            className="flex-1 min-w-[160px]"
            triggerClassName="h-[42px] rounded-xl border-gray-300 px-4 py-2.5"
            clearable={true}
          />

          <Combobox
            options={floors.map((f) => ({ value: String(f), label: `Tầng ${f}` }))}
            value={floorFilter}
            onChange={(val) => setFloorFilter(val)}
            disabled={!buildingFilter}
            placeholder="Tầng"
            searchPlaceholder="Tìm tầng..."
            className="flex-1 min-w-[150px]"
            triggerClassName="h-[42px] rounded-xl border-gray-300 px-4 py-2.5"
            clearable={true}
          />

          <Combobox
            options={[
              { value: "AVAILABLE", label: "Còn trống" },
              { value: "RENTED", label: "Đang thuê" }
            ]}
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            placeholder="Tất cả trạng thái"
            searchable={false}
            className="flex-1 min-w-[150px]"
            triggerClassName="h-[42px] rounded-xl border-gray-300 px-4 py-2.5"
            clearable={true}
          />
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
              {[...filtered]
                .sort((a, b) => {
                  if (a.floor !== b.floor) {
                    return a.floor - b.floor;
                  }
                  return String(a.room_number).localeCompare(String(b.room_number), undefined, { numeric: true });
                })
                .map((apt) => {
                const building = buildings.find((b) => b.id === apt.building_id);
                return (
                  <Link
                    key={apt.id}
                    to={`/apartments/${apt.id}`}
                    className="bg-white rounded-2xl shadow-card overflow-hidden hover:shadow-card-hover transition-shadow block group border border-gray-100"
                  >
                    <div className="w-full h-48 bg-gray-100 overflow-hidden relative">
                      <img
                        src={getApartmentThumbnail(apt)}
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
