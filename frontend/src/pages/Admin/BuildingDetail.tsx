import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, MapPin, Layers, Building2, Home, Pencil, Loader2, BedDouble, Bath } from "lucide-react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { toast } from "sonner";

import * as buildingService from "../../services/buildings.service";
import * as apartmentService from "../../services/apartments.service";
import type { BuildingData } from "../../services/buildings.service";
import type { ApartmentData } from "../../services/apartments.service";

export default function BuildingDetail() {
  const { id } = useParams();
  const [building, setBuilding] = useState<BuildingData | null>(null);
  const [apartments, setApartments] = useState<ApartmentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchData();
  }, [id]);

  async function fetchData() {
    try {
      setLoading(true);
      const [bData, aResult] = await Promise.all([
        buildingService.getBuildingById(Number(id)),
        apartmentService.getAllApartments({ building_id: Number(id), limit: 200 }),
      ]);
      setBuilding(bData);
      setApartments(aResult.data);
    } catch {
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  if (!building) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">Không tìm thấy tòa nhà</p>
        <Link to="/admin/buildings" className="text-primary-600 hover:underline text-sm">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const rentedCount = apartments.filter((a) => a.status === "RENTED").length;
  const availableCount = apartments.filter((a) => a.status === "AVAILABLE").length;
  const occupancyRate = apartments.length > 0 ? Math.round((rentedCount / apartments.length) * 100) : 0;

  function formatPrice(price: number) {
    return new Intl.NumberFormat("vi-VN").format(price) + " đ";
  }

  function getStatusBadge(status: string) {
    const map: Record<string, { label: string; variant: string }> = {
      AVAILABLE: { label: "Còn trống", variant: "success" },
      RENTED: { label: "Đang thuê", variant: "info" },
      MAINTENANCE: { label: "Bảo trì", variant: "warning" },
    };
    const s = map[status] || { label: status, variant: "gray" };
    return <Badge variant={s.variant as any}>{s.label}</Badge>;
  }

  return (
    <div className="space-y-6">
      <Link
        to="/admin/buildings"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft size={16} /> Quay lại danh sách tòa nhà
      </Link>

      {/* Thông tin chính */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-80 h-56 bg-gray-100 rounded-2xl flex items-center justify-center flex-shrink-0">
          <Building2 size={48} className="text-gray-300" />
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {building.branch_name} - {building.name.replace(/yuki\s*house\s*|yuki\s*/gi, "")}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={building.status === "ACTIVE" ? "success" : "gray"}>
                  {building.status === "ACTIVE" ? "Hoạt động" : "Ngừng"}
                </Badge>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Pencil size={14} /> Chỉnh sửa
            </Button>
          </div>

          <div className="space-y-2 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-gray-400 flex-shrink-0" />
              <span>{building.address_new || building.address_old}</span>
            </div>
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-gray-400 flex-shrink-0" />
              <span>{building.total_floors} tầng</span>
            </div>
          </div>

          {building.description && (
            <p className="text-sm text-gray-500 leading-relaxed">{building.description}</p>
          )}

          {/* Thống kê */}
          <div className="grid grid-cols-12 gap-4 mt-6">
            <div className="col-span-6 md:col-span-3 bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-gray-800">{apartments.length}</p>
              <p className="text-xs text-gray-400">Tổng căn hộ</p>
            </div>
            <div className="col-span-6 md:col-span-3 bg-success-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-success-600">{rentedCount}</p>
              <p className="text-xs text-gray-400">Đang thuê</p>
            </div>
            <div className="col-span-6 md:col-span-3 bg-warning-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-warning-600">{availableCount}</p>
              <p className="text-xs text-gray-400">Còn trống</p>
            </div>
            <div className="col-span-6 md:col-span-3 bg-primary-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-primary-600">{occupancyRate}%</p>
              <p className="text-xs text-gray-400">Lấp đầy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Danh sách căn hộ */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Danh sách căn hộ ({apartments.length})
        </h3>
        <div className="grid grid-cols-12 gap-6">
          {apartments.map((apt) => (
            <Link
              key={apt.id}
              to={`/admin/apartments/${apt.id}`}
              className="col-span-12 sm:col-span-6 lg:col-span-4 xl:col-span-3 block"
            >
              <Card className="hover:shadow-card-hover transition-shadow cursor-pointer h-full">
                <div className="w-full h-28 bg-gray-100 rounded-xl mb-3 flex items-center justify-center">
                  <Home size={24} className="text-gray-300" />
                </div>
                <div className="flex items-start justify-between mb-1">
                  <p className="font-semibold text-gray-800 text-sm">
                    P.{apt.room_number} - T{apt.floor}
                  </p>
                  {getStatusBadge(apt.status)}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                  <span>{apt.area} m²</span>
                  <span className="flex items-center gap-0.5"><BedDouble size={12} /> {apt.bedrooms}</span>
                  <span className="flex items-center gap-0.5"><Bath size={12} /> {apt.bathrooms}</span>
                </div>
                <p className="font-semibold text-primary-600 text-sm">{formatPrice(apt.rental_price)}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
