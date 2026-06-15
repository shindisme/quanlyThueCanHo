import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, MapPin, Maximize2, DollarSign, BedDouble, Bath, Layers, Pencil, Home, Loader2, Trash2, Plus } from "lucide-react";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import { toast } from "sonner";

import * as apartmentService from "../../../services/apartments.service";
import type { ApartmentData } from "../../../services/apartments.service";
import type { ApartmentImage } from "../../../types";

import { useAuthStore } from "../../../stores/auth.store";
import { formatApartmentDisplay } from "../../../utils/format";

export default function ApartmentDetail() {
  const { role } = useAuthStore();
  const { id } = useParams();
  const [apartment, setApartment] = useState<ApartmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState<ApartmentImage[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchData();

    // Load and sync images from localStorage
    const key = `apartment-${id}-images`;
    const stored = localStorage.getItem(key);
    if (stored) {
      setImages(JSON.parse(stored));
    } else {
      // Pre-populate with beautiful default mock images
      const initialMockImages: ApartmentImage[] = [
        {
          id: 1,
          apartment_id: Number(id),
          image_url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
          is_thumbnail: true,
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          apartment_id: Number(id),
          image_url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
          is_thumbnail: false,
          created_at: new Date().toISOString()
        }
      ];
      localStorage.setItem(key, JSON.stringify(initialMockImages));
      setImages(initialMockImages);
    }
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

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { uploadImage } = await import("../../../utils/upload");
      const url = await uploadImage(file);
      
      const newImg: ApartmentImage = {
        id: Date.now(),
        apartment_id: Number(id),
        image_url: url,
        is_thumbnail: images.length === 0, // set as thumbnail if it's the first image
        created_at: new Date().toISOString()
      };

      const updated = [...images, newImg];
      setImages(updated);
      localStorage.setItem(`apartment-${id}-images`, JSON.stringify(updated));
      toast.success("Tải ảnh lên thành công");
    } catch {
      toast.error("Không thể tải ảnh lên");
    } finally {
      setUploading(false);
    }
  }

  function handleSetThumbnail(imgId: number) {
    const updated = images.map((img) => ({
      ...img,
      is_thumbnail: img.id === imgId
    }));
    setImages(updated);
    localStorage.setItem(`apartment-${id}-images`, JSON.stringify(updated));
    toast.success("Đã đặt làm ảnh đại diện");
  }

  function handleDeleteImage(imgId: number) {
    const updated = images.filter((img) => img.id !== imgId);
    if (images.find((img) => img.id === imgId)?.is_thumbnail && updated.length > 0) {
      updated[0].is_thumbnail = true;
    }
    setImages(updated);
    localStorage.setItem(`apartment-${id}-images`, JSON.stringify(updated));
    toast.success("Đã xóa hình ảnh");
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
        {images.length > 0 ? (
          <div className="w-full lg:w-96 shrink-0 flex flex-col gap-2">
            <div className="w-full h-64 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
              <img
                src={images.find((img) => img.is_thumbnail)?.image_url || images[0].image_url}
                className="w-full h-full object-cover"
                alt="Ảnh căn hộ"
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto py-1">
                {images.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => handleSetThumbnail(img.id)}
                    className={`w-16 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                      img.is_thumbnail ? "border-primary-500 scale-102" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <img src={img.image_url} className="w-full h-full object-cover" alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full lg:w-96 h-64 bg-gray-100 rounded-2xl flex items-center justify-center shrink-0 border border-gray-200">
            <Home size={48} className="text-gray-300" />
          </div>
        )}

        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {formatApartmentDisplay(
                  apartment.room_number,
                  apartment.floor,
                  role || undefined,
                  apartment.building?.branch_name
                )}
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

      {/* Quản lý hình ảnh */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Quản lý hình ảnh căn hộ</h3>
          <label className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors">
            {uploading ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <Plus size={14} />
            )}
            {uploading ? "Đang tải lên..." : "Tải ảnh mới"}
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
          </label>
        </div>
        
        {images.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">Chưa có hình ảnh nào cho căn hộ này.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {images.map((img) => (
              <div key={img.id} className="relative aspect-video rounded-xl overflow-hidden border border-gray-200 group shadow-sm">
                <img src={img.image_url} className="w-full h-full object-cover" alt="" />
                
                {/* Badge thumbnail */}
                {img.is_thumbnail && (
                  <span className="absolute top-1.5 left-1.5 bg-success-500 text-white text-[9px] px-1.5 py-0.5 rounded font-semibold shadow">
                    Ảnh bìa
                  </span>
                )}

                {/* Overlays / Actions on hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {!img.is_thumbnail && (
                    <button
                      onClick={() => handleSetThumbnail(img.id)}
                      className="px-2 py-1 bg-white hover:bg-gray-100 text-[10px] text-gray-800 rounded font-medium shadow transition-colors cursor-pointer"
                    >
                      Bìa
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteImage(img.id)}
                    className="p-1 bg-red-650 hover:bg-red-700 text-white rounded shadow transition-colors cursor-pointer"
                    title="Xóa"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

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
