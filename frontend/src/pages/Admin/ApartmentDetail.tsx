import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, MapPin, Maximize2, DollarSign, BedDouble, Bath, Layers, Pencil, Home, Loader2 } from "lucide-react";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { toast } from "sonner";

import * as apartmentService from "../../services/apartments.service";
import type { ApartmentData } from "../../services/apartments.service";

export default function ApartmentDetail() {
  const { id } = useParams();
  const [apartment, setApartment] = useState<ApartmentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchData();
  }, [id]);

  async function fetchData() {
    try {
      setLoading(true);
      const data = await apartmentService.getApartmentById(Number(id));
      setApartment(data);
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

  if (!apartment) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">Không tìm thấy căn hộ</p>
        <Link to="/admin/apartments" className="text-primary-600 hover:underline text-sm">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

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
        to="/admin/apartments"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft size={16} /> Quay lại danh sách căn hộ
      </Link>

      {/* Thông tin chính */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-96 h-64 bg-gray-100 rounded-2xl flex items-center justify-center shrink-0">
          <Home size={48} className="text-gray-300" />
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Phòng {apartment.room_number} - Tầng {apartment.floor}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                {getStatusBadge(apartment.status)}
                {apartment.building && (
                  <span className="text-sm text-gray-400">{apartment.building.name}</span>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Pencil size={14} /> Chỉnh sửa
            </Button>
          </div>

          <div className="space-y-2 text-sm text-gray-600 mb-4">
            {apartment.building?.address_new && (
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-gray-400" />
                <span>{apartment.building.address_new}</span>
              </div>
            )}
          </div>

          <p className="text-2xl font-bold text-primary-600 mb-4">
            {formatPrice(apartment.rental_price)}
            <span className="text-sm text-gray-400 font-normal">/tháng</span>
          </p>

          {/* Thông số */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <Maximize2 size={18} className="text-primary-600 mx-auto mb-1" />
              <p className="text-sm font-semibold text-gray-800">{apartment.area} m²</p>
              <p className="text-xs text-gray-400">Diện tích</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <Layers size={18} className="text-info-600 mx-auto mb-1" />
              <p className="text-sm font-semibold text-gray-800">Tầng {apartment.floor}</p>
              <p className="text-xs text-gray-400">Vị trí</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <BedDouble size={18} className="text-purple-600 mx-auto mb-1" />
              <p className="text-sm font-semibold text-gray-800">{apartment.bedrooms}</p>
              <p className="text-xs text-gray-400">Phòng ngủ</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <Bath size={18} className="text-cyan-600 mx-auto mb-1" />
              <p className="text-sm font-semibold text-gray-800">{apartment.bathrooms}</p>
              <p className="text-xs text-gray-400">Phòng tắm</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <DollarSign size={18} className="text-success-600 mx-auto mb-1" />
              <p className="text-sm font-semibold text-gray-800">{formatPrice(apartment.rental_price)}</p>
              <p className="text-xs text-gray-400">Giá thuê</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mô tả */}
      {apartment.description && (
        <Card>
          <h3 className="font-semibold text-gray-800 mb-2">Mô tả</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{apartment.description}</p>
        </Card>
      )}

      {/* Placeholder cho hợp đồng - sẽ kết nối khi có API */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold text-gray-800 mb-4">Người thuê hiện tại</h3>
          <p className="text-sm text-gray-400">Chưa có dữ liệu hợp đồng (chờ API)</p>
        </Card>

        <Card>
          <h3 className="font-semibold text-gray-800 mb-4">Lịch sử hợp đồng</h3>
          <p className="text-sm text-gray-400">Chưa có dữ liệu (chờ API)</p>
        </Card>
      </div>
    </div>
  );
}
