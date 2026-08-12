import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Maximize2, DollarSign, BedDouble, Bath, Layers, Pencil, Trash2, Plus, Star, ArrowRight } from "lucide-react";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import Card from "../../../../components/ui/Card";
import Badge, { type BadgeVariant } from "../../../../components/ui/Badge";
import Button from "../../../../components/ui/Button";
import ApartmentModifyModal from "../components/ApartmentModifyModal";
import { useUserRole } from "../../../../hooks/useUserRole";
import { formatDate } from "../../../../utils/date";
import { formatApartmentDisplay, maskCCCD } from "../../../../utils/string";
import { formatCurrency } from "../../../../utils/currency";
import { DEFAULT_APARTMENT_IMAGE } from "../../../../utils/file";
import { useApartmentDetailPage } from "../hooks/useApartmentDetailPage";
import {
  APARTMENT_STATUS_LABELS,
  APARTMENT_STATUS_COLORS,
  APARTMENT_STATUS_CONFIG,
  CONTRACT_STATUS_CONFIG,
  type ApartmentStatus,
  type ContractStatus,
} from "../../../../constants/enums";
import { useDepositInvoice } from "../../invoices/hooks/useDepositInvoice";
import DepositInvoiceModal from "../../invoices/components/DepositInvoiceModal";
import { getReservationTenantId } from "../utils/reservationTenant";

export default function ApartmentDetailPage() {
  const navigate = useNavigate();
  const { role } = useUserRole();
  const {
    apartment,
    loading,
    images,
    uploading,
    buildings,
    showModifyModal,
    setShowModifyModal,
    occupants,
    reviews,
    reviewMeta,
    activeTab,
    setActiveTab,
    activeContract,
    activeTenant,
    activeTenantUser,
    activeReservation,
    reservedTenant,
    tenantContracts,
    fetchData,
    handleImageUpload,
    handleSetThumbnail,
    handleDeleteImage,
  } = useApartmentDetailPage();

  const basePath = role === "MANAGER" ? "/manager" : "/admin";

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(`${basePath}/apartments`);
    }
  };

  const depositModal = useDepositInvoice({
    fixedApartment: apartment,
    onSuccessCallback: fetchData,
  });
  const reservationTenantId = getReservationTenantId(activeReservation);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100">
        <LoadingSpinner size={36} />
        <span className="text-sm text-gray-400 mt-2 font-sans">Đang tải chi tiết căn hộ...</span>
      </div>
    );
  }

  if (!apartment) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">Không tìm thấy căn hộ</p>
        <Button
          variant="link"
          onClick={handleBack}
          className="text-primary-600 text-sm"
        >
          Quay lại
        </Button>
      </div>
    );
  }



  function getStatusBadge(status: ApartmentStatus) {
    const config = APARTMENT_STATUS_CONFIG[status];
    if (config) return <Badge variant={config.badge}>{config.label}</Badge>;
    const label = APARTMENT_STATUS_LABELS[status] || status;
    const variant: BadgeVariant = APARTMENT_STATUS_COLORS[status] || "gray";
    return <Badge variant={variant}>{label}</Badge>;
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBack}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 px-0 hover:bg-transparent"
      >
        <ArrowLeft size={16} /> Quay lại
      </Button>

      {/* Thông tin chính */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-96 shrink-0 flex flex-col gap-2">
          <div className="w-full h-64 rounded-2xl overflow-hidden border border-gray-200 shadow-xl bg-gray-50">
            <img
              src={images.length > 0 ? (images.find((img) => img.is_thumbnail)?.image_url || images[0].image_url) : DEFAULT_APARTMENT_IMAGE}
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
                {getStatusBadge(apartment.status as ApartmentStatus)}
                {apartment.building && (
                  <span className="text-sm text-gray-400">{apartment.building.name}</span>
                )}
              </div>
            </div>
            {role !== "STAFF" && (
              <Button variant="outline" size="sm" onClick={() => setShowModifyModal(true)}>
                <Pencil size={14} /> Chỉnh sửa
              </Button>
            )}
          </div>

          <div className="space-y-2 text-sm text-gray-600 mb-4">
            {apartment.building?.address && (
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-gray-400" />
                <span>{apartment.building.address}</span>
              </div>
            )}
          </div>

          <p className="text-2xl font-bold text-primary-600 mb-4">
            {formatCurrency(Number(apartment.rental_price))}
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
              <p className="text-sm font-semibold text-gray-800">{formatCurrency(Number(apartment.rental_price))}</p>
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
      {role !== "STAFF" && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Quản lý hình ảnh căn hộ</h3>
            <label className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors">
              {uploading ? (
                <LoadingSpinner size={14} className="text-white" />
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
                      className="p-1 bg-red-600 hover:bg-red-700 text-white rounded shadow transition-colors cursor-pointer"
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
      )}

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
                    <div className="bg-primary-50/50 p-4 shadow-sm space-y-2 border border-primary-100 rounded-xl">
                      <div className="flex justify-between items-center">
                        <p className="font-semibold text-gray-800">
                          Chủ hợp đồng: <span className="text-primary-700 font-bold ml-1">{activeTenant.full_name}</span>
                        </p>
                        {/* Hiển thị phân loại Hợp đồng ban đầu hay Hợp đồng đã gia hạn */}
                        {(activeContract as unknown as { extended_at?: string }).extended_at ? (
                          <Badge variant="warning" showDot>
                            Đã gia hạn ({formatDate((activeContract as unknown as { extended_at: string }).extended_at)})
                          </Badge>
                        ) : (
                          <Badge variant="info">
                            Hợp đồng ban đầu
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 pt-1">
                        <p>Số CCCD: <span className="font-medium">{maskCCCD(activeTenant.citizen_id)}</span></p>
                        <p>SĐT: <span className="font-medium">{(activeTenantUser as unknown as { phone?: string })?.phone || activeTenant.phone || "-"}</span></p>
                        <p>Email: <span className="font-medium">{(activeTenantUser as unknown as { email?: string })?.email || activeTenant.email || "-"}</span></p>
                        <p>Thời hạn thuê: <span className="font-medium">{formatDate(activeContract.start_date)} - {formatDate(activeContract.end_date)}</span></p>
                      </div>
                      <div className="pt-2 border-t border-primary-100 flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-medium">Tình trạng thanh toán:</span>
                        <Badge variant="success" showDot>Lịch sử thanh toán</Badge>
                      </div>
                    </div>
                    {role !== "TENANT" && (
                      <div className="mt-2 text-right">
                        <Link
                          to={role === "ADMIN" ? "/admin/contracts" : "/manager/contracts"}
                          state={{ search: `HD-${String(activeContract.id).padStart(5, "0")}` }}
                          className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-semibold"
                        >
                          Đi tới trang quản lý hợp đồng <ArrowRight size={12} />
                        </Link>
                      </div>
                    )}
                  </div>
                ) : apartment.status === "RESERVED" || activeReservation ? (
                  /* Hiển thị thẻ thông tin khách đặt cọc */
                  <div className="space-y-4 text-sm font-sans">
                    <div className="bg-amber-50/70 p-4 shadow-sm space-y-2.5 border border-amber-200 rounded-xl">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-amber-900 flex items-center gap-1.5">
                          Khách Đã Đặt Cọc Phòng
                        </h4>
                        <Badge variant="warning" showDot>Đã giữ cọc</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-700 pt-1">
                        <p>Họ và tên: <span className="font-bold text-gray-900">{reservedTenant?.full_name || activeReservation?.tenant?.full_name || "Khách cọc"}</span></p>
                        <p>SĐT: <span className="font-medium">{reservedTenant?.phone || activeReservation?.tenant?.phone || "-"}</span></p>
                        <p>Số tiền cọc: <span className="font-bold text-emerald-600">{formatCurrency(Number(activeReservation?.deposit_amount || apartment.rental_price))}</span></p>
                        <p>Hạn cọc giữ phòng: <span className="font-bold text-amber-700">{activeReservation?.expires_at ? formatDate(activeReservation.expires_at) : "3 ngày"}</span></p>
                      </div>
                      <div className="pt-2 border-t border-amber-200/60 text-right">
                        <Link
                          to={role === "ADMIN" ? "/admin/contracts" : "/manager/contracts"}
                          state={{
                            openCreateModal: true,
                            apartmentId: apartment.id,
                            buildingId: apartment.building_id,
                            floor: apartment.floor,
                            tenantId: reservationTenantId
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                        >
                          <Plus size={14} /> Tạo hợp đồng từ tiền cọc
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-400 mb-4 font-sans">Căn hộ hiện đang trống</p>
                    {role !== "TENANT" && (apartment.status === "AVAILABLE" || (apartment.status as string) === "RESERVED") && (
                      <div className="flex flex-wrap justify-center gap-2">
                        {apartment.status === "AVAILABLE" && (
                          <Button type="button" size="sm" variant="outline" onClick={() => depositModal.openModal(apartment)}>
                            <span>Lập hóa đơn cọc</span>
                          </Button>
                        )}
                        <Link
                          to={role === "ADMIN" ? "/admin/contracts" : "/manager/contracts"}
                          state={{
                            openCreateModal: true,
                            apartmentId: apartment.id,
                            buildingId: apartment.building_id,
                            floor: apartment.floor,
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                        >
                          <Plus size={14} /> Tạo hợp đồng thuê mới
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 text-base">Người ở cùng ({occupants.length})</h3>
                {activeContract && activeTenant ? (
                  <div className="overflow-hidden shadow-md">
                    <table className="min-w-full divide-y divide-gray-150 text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600">Họ và tên</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600">CCCD</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600">SĐT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {occupants.map((occ: { id: string; name: string; cccd: string; phone?: string }) => (
                          <tr key={occ.id}>
                            <td className="px-3 py-2 font-medium text-gray-800">{occ.name}</td>
                            <td className="px-3 py-2 text-gray-600">{maskCCCD(occ.cccd)}</td>
                            <td className="px-3 py-2 text-gray-600">{occ.phone || "-"}</td>
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
                  <div className="overflow-x-auto shadow-md">
                    <table className="min-w-full divide-y divide-gray-150 text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2.5 text-left font-semibold text-gray-650">Mã HĐ</th>
                          <th className="px-3 py-2.5 text-left font-semibold text-gray-650">Chủ hợp đồng</th>
                          <th className="px-3 py-2.5 text-left font-semibold text-gray-650">Thời hạn</th>
                          <th className="px-3 py-2.5 text-right font-semibold text-gray-650">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {tenantContracts.map((c) => (
                          <tr key={c.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2.5 font-medium text-gray-700">HD-{String(c.id).padStart(5, "0")}</td>
                            <td className="px-3 py-2.5 text-gray-800 font-semibold">{activeTenant.full_name}</td>
                            <td className="px-3 py-2.5 text-gray-600">
                              {formatDate(c.start_date)} - {formatDate(c.end_date)}
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              {(() => {
                                const config = CONTRACT_STATUS_CONFIG[c.status as ContractStatus];
                                return (
                                  <Badge variant={config?.badge || "gray"}>
                                    {config?.label || c.status}
                                  </Badge>
                                );
                              })()}
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

          {/* Tab 3: Đánh giá vs Nhận xét */}
          {activeTab === "reviews" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-6 bg-gray-100 p-5 shadow-md">
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
                <h4 className="font-semibold text-gray-800 text-sm">Ý kiến của người thuê ({reviews.length})</h4>
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

      <DepositInvoiceModal
        controller={depositModal}
        fixedApartment={apartment}
      />
      <ApartmentModifyModal
        isOpen={showModifyModal}
        onClose={() => setShowModifyModal(false)}
        onSuccess={fetchData}
        editItem={apartment}
        buildings={buildings}
        role={role}
        activeContractId={activeContract?.id}
      />
    </div>
  );
}
