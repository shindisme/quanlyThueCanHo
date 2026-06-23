import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, MapPin, Maximize2, DollarSign, BedDouble, Bath, Layers, Pencil, Home, Loader2, Trash2, Plus, Star } from "lucide-react";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import { toast } from "sonner";

import * as apartmentService from "../../../services/apartmentService";
import type { ApartmentData } from "../../../services/apartmentService";
import type { ApartmentImage } from "../../../types";
import { mockContracts } from "../../../data/contracts";
import { mockTenants } from "../../../data/tenants";
import { mockUsers } from "../../../data/users";

import * as buildingService from "../../../services/buildingService";
import type { BuildingData } from "../../../services/buildingService";
import ApartmentModifyModal from "./components/ApartmentModifyModal";

import * as contractService from "../../../services/contractService";
import * as tenantService from "../../../services/tenantService";
import * as authService from "../../../services/authService";

import { useAuthStore } from "../../../stores/auth.store";
import { formatApartmentDisplay, formatDate, maskCCCD } from "../../../utils/format";
import { getApartmentReviews } from "../../../services/reviewService";

export default function ApartmentDetail() {
  const { role } = useAuthStore();
  const { id } = useParams();
  const [apartment, setApartment] = useState<ApartmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState<ApartmentImage[]>([]);
  const [uploading, setUploading] = useState(false);

  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [showModifyModal, setShowModifyModal] = useState(false);

  const [contracts, setContracts] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [occupants, setOccupants] = useState<any[]>([]);

  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewMeta, setReviewMeta] = useState<any>({ averageRating: 0, totalReviews: 0, currentPage: 1, totalPages: 1 });
  const [activeTab, setActiveTab] = useState<"tenant" | "tenantHistory" | "reviews">("tenant");

  const activeContract = contracts.find(
    (c) => c.apartment_id === Number(id) && c.status === "ACTIVE"
  );
  const activeTenant = activeContract
    ? tenants.find((t) => t.id === activeContract.tenant_id)
    : null;
  const activeTenantUser = activeTenant
    ? users.find((u) => u.id === activeTenant.user_id)
    : null;

  const historyContracts = contracts.filter((c) => c.apartment_id === Number(id));
  const tenantContracts = activeTenant
    ? historyContracts.filter((c) => c.tenant_id === activeTenant.id)
    : [];

  useEffect(() => {
    if (activeTenantUser?.email) {
      const stored = localStorage.getItem(`occupants-${activeTenantUser.email}`);
      if (stored) {
        try {
          setOccupants(JSON.parse(stored));
        } catch {
          setOccupants([]);
        }
      } else {
        setOccupants([]);
      }
    } else {
      setOccupants([]);
    }
  }, [activeTenantUser]);

  useEffect(() => {
    if (!id) return;
    fetchData();
  }, [id]);

  async function fetchData() {
    try {
      setLoading(true);
      const [bRes, aptData, contractsData, tenantsRes, usersData, reviewsRes] = await Promise.all([
        buildingService.getAllBuildings(),
        apartmentService.getApartmentById(Number(id)),
        contractService.getAllContracts().catch(() => mockContracts as any),
        tenantService.getAllTenants({ limit: 1000 }).catch(() => ({ data: mockTenants })),
        authService.getAllUsers().catch(() => mockUsers),
        getApartmentReviews(Number(id)).catch(() => ({ data: [], meta: { averageRating: 0, totalReviews: 0, currentPage: 1, totalPages: 1 } })),
      ]);
      setBuildings(bRes.data);
      setApartment(aptData);
      setImages(aptData.images || []);
      setContracts(contractsData);
      setTenants(tenantsRes.data);
      setUsers(usersData);
      setReviews(reviewsRes.data);
      setReviewMeta(reviewsRes.meta);
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
      const formDataToSend = new FormData();
      formDataToSend.append("images", file);

      await apartmentService.updateApartment(Number(id), formDataToSend);
      toast.success("Tải ảnh lên thành công");
      await fetchData();
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
    toast.success("Đã đặt làm ảnh đại diện");
  }

  function handleDeleteImage(imgId: number) {
    const updated = images.filter((img) => img.id !== imgId);
    if (images.find((img) => img.id === imgId)?.is_thumbnail && updated.length > 0) {
      updated[0].is_thumbnail = true;
    }
    setImages(updated);
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
                    className={`w-16 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${img.is_thumbnail ? "border-primary-500 scale-102" : "border-gray-200 hover:border-gray-300"
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
            <Button variant="outline" size="sm" onClick={() => setShowModifyModal(true)}>
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

      {/* Tabs bottom panel */}
      <Card className="p-0 overflow-hidden">
        <div className="flex border-b border-gray-200 bg-gray-50/50">
          <button
            onClick={() => setActiveTab("tenant")}
            className={`flex-1 py-3.5 text-center text-sm font-semibold border-b-2 cursor-pointer transition-all ${activeTab === "tenant"
              ? "border-primary-600 text-primary-600 bg-white"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50/30"
              }`}
          >
            Người thuê hiện tại {activeContract && <span className="ml-1.5 w-2 h-2 rounded-full bg-success-500 inline-block animate-pulse" />}
          </button>
          <button
            onClick={() => setActiveTab("tenantHistory")}
            className={`flex-1 py-3.5 text-center text-sm font-semibold border-b-2 cursor-pointer transition-all ${activeTab === "tenantHistory"
              ? "border-primary-600 text-primary-600 bg-white"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50/30"
              }`}
          >
            Lịch sử hợp đồng ({activeTenant ? tenantContracts.length : 0})
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`flex-1 py-3.5 text-center text-sm font-semibold border-b-2 cursor-pointer transition-all ${activeTab === "reviews"
              ? "border-primary-600 text-primary-600 bg-white"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50/30"
              }`}
          >
            Đánh giá & Nhận xét ({reviewMeta.totalReviews || 0})
          </button>
        </div>

        <div className="p-6">
          {/* Tab 1: Tenant */}
          {activeTab === "tenant" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 text-base">Thông tin người thuê</h3>
                {activeContract && activeTenant ? (
                  <div className="space-y-4 text-sm font-sans">
                    <div className="bg-primary-50/50 p-4 rounded-xl border border-primary-100/50 space-y-2">
                      <p className="font-semibold text-gray-800 flex justify-between">
                        <span>Chủ hợp đồng:</span>
                        <span className="text-primary-700">{activeTenant.full_name}</span>
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-650">
                        <p>Số CCCD: <span className="font-medium">{maskCCCD(activeTenant.citizen_id)}</span></p>
                        <p>SĐT: <span className="font-medium">{activeTenantUser?.phone || activeTenant.phone || "-"}</span></p>
                        <p>Email: <span className="font-medium">{activeTenantUser?.email || activeTenant.email || "-"}</span></p>
                        <p>Thời hạn thuê: <span className="font-medium">{formatDate(activeContract.start_date)} - {formatDate(activeContract.end_date)}</span></p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 py-6 text-center">Căn hộ hiện đang trống</p>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 text-base">Người ở cùng ({occupants.length})</h3>
                {activeContract && activeTenant ? (
                  <div className="border border-gray-150 rounded-xl overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-150 text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-gray-650">Họ và tên</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-650">CCCD</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-650">SĐT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {occupants.map((occ) => (
                          <tr key={occ.id}>
                            <td className="px-3 py-2 font-medium text-gray-855">{occ.name}</td>
                            <td className="px-3 py-2 text-gray-650">{maskCCCD(occ.cccd)}</td>
                            <td className="px-3 py-2 text-gray-650">{occ.phone || "-"}</td>
                          </tr>
                        ))}
                        {occupants.length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-3 py-4 text-center text-gray-400">
                              Chưa khai báo người ở cùng
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 py-6 text-center">Chưa có người thuê hiện tại</p>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Lịch sử */}
          {activeTab === "tenantHistory" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 text-base mb-2">Lịch sử hợp đồng thuê của người thuê hiện tại</h3>
              {activeTenant ? (
                tenantContracts.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-gray-150">
                    <table className="min-w-full divide-y divide-gray-150 text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Mã HĐ</th>
                          <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Chủ hợp đồng</th>
                          <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Thời hạn</th>
                          <th className="px-3 py-2.5 text-right font-semibold text-gray-600">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {tenantContracts.map((c) => (
                          <tr key={c.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2.5 font-medium text-gray-700">HD-{String(c.id).padStart(5, "0")}</td>
                            <td className="px-3 py-2.5 text-gray-850 font-semibold">{activeTenant.full_name}</td>
                            <td className="px-3 py-2.5 text-gray-600">
                              {formatDate(c.start_date)} - {formatDate(c.end_date)}
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <Badge variant={c.status === "ACTIVE" ? "success" : c.status === "ENDED" ? "gray" : "danger"}>
                                {c.status === "ACTIVE" ? "Hiệu lực" : c.status === "ENDED" ? "Đã kết thúc" : "Thanh lý"}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 py-6 text-center">Không có lịch sử hợp đồng nào khác với người thuê này</p>
                )
              ) : (
                <p className="text-sm text-gray-400 py-6 text-center">Chưa có người thuê hiện tại</p>
              )}
            </div>
          )}

          {/* Tab 3: Đánh giá & Nhận xét */}
          {activeTab === "reviews" && (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="flex flex-col sm:flex-row items-center gap-6 bg-gray-50 p-5 rounded-2xl border border-gray-150">
                <div className="text-center sm:border-r border-gray-200 sm:pr-8 shrink-0">
                  <p className="text-5xl font-black text-amber-500 mb-1">{reviewMeta.averageRating || "0.0"}</p>
                  <div className="flex justify-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={16}
                        className={
                          s <= Math.round(reviewMeta.averageRating || 0)
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-300"
                        }
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 font-medium">Trung bình {reviewMeta.totalReviews || 0} đánh giá</p>
                </div>
                <div className="flex-1 space-y-2 w-full text-xs">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = reviews.filter((r) => r.rating === stars).length;
                    const percent = reviewMeta.totalReviews > 0 ? (count / reviewMeta.totalReviews) * 100 : 0;
                    return (
                      <div key={stars} className="flex items-center gap-3">
                        <span className="w-8 text-gray-500 font-semibold">{stars} sao</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${percent}%` }} />
                        </div>
                        <span className="w-6 text-gray-400 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Review Comments list */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 text-sm">Ý kiến của khách hàng ({reviews.length})</h4>
                <div className="divide-y divide-gray-100">
                  {reviews.map((r) => (
                    <div key={r.id} className="py-4 first:pt-0 last:pb-0 space-y-1.5 font-sans">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-800 text-sm">{r.tenant?.full_name || "Người thuê ẩn danh"}</span>
                        <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString("vi-VN")}</span>
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={12}
                            className={s <= r.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}
                          />
                        ))}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 leading-normal">{r.comment || "Không có nội dung nhận xét."}</p>
                    </div>
                  ))}
                  {reviews.length === 0 && (
                    <p className="text-sm text-gray-400 py-6 text-center">Chưa có đánh giá hay phản hồi nào cho căn hộ này</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      <ApartmentModifyModal
        isOpen={showModifyModal}
        onClose={() => setShowModifyModal(false)}
        onSuccess={fetchData}
        editItem={apartment}
        buildings={buildings}
        role={role}
      />
    </div>
  );
}
