import { useState, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, MapPin, Maximize2, Phone, User, Star, Mail } from "lucide-react";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import { Calendar } from "../../components/ui/Calendar";
import { APARTMENT_STATUS_LABELS, APARTMENT_STATUS_COLORS } from "../../constants/enums";
import { formatCurrency } from "../../utils/currency";
import { formatApartmentDisplay } from "../../utils/string";
import { toast } from "sonner";
import * as apartmentService from "../../services/apartmentService";
import * as buildingService from "../../services/buildingService";
import type { ApartmentData } from "../../services/apartmentService";
import type { BuildingData } from "../../services/buildingService";
import { getApartmentReviews } from "../../services/reviewService";
import type { ReviewData } from "../../services/reviewService";
import type { ApartmentImage } from "../../types";
import { useApartmentBooking } from "../../hooks/guest/useApartmentBooking";

const timeSlots = [
  "09h00",
  "11h00",
  "13h00",
  "15h00"
];

export default function GuestApartmentDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [apartment, setApartment] = useState<ApartmentData | null>(null);
  const [building, setBuilding] = useState<BuildingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState<ApartmentImage[]>([]);

  const {
    showScheduleForm,
    setShowScheduleForm,
    selectedDate,
    setSelectedDate,
    selectedSlot,
    setSelectedSlot,
    saving,
    scheduleForm,
    setScheduleForm,
    isSlotBooked,
    handleSubmitSchedule,
    holdTimeLeft,
    handleSelectSlot,
    handleResetBooking,
  } = useApartmentBooking({ apartment });

  const isSlotDisabled = (slot: string) => {
    if (isSlotBooked(slot)) return true;
    if (!selectedDate) return false;

    const [hoursStr, minutesStr] = slot.split("h");
    const slotHours = parseInt(hoursStr, 10);
    const slotMinutes = parseInt(minutesStr, 10);

    const [year, month, day] = selectedDate.split("-").map(Number);
    const slotDateObj = new Date(year, month - 1, day, slotHours, slotMinutes);

    const minSelectableDateObj = new Date();
    minSelectableDateObj.setHours(minSelectableDateObj.getHours() + 6);

    return slotDateObj < minSelectableDateObj;
  };

  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [reviewMeta, setReviewMeta] = useState<{ averageRating: number; totalReviews: number }>({ averageRating: 0, totalReviews: 0 });

  useEffect(() => {
    if (!id) return;

    async function loadData() {
      setLoading(true);
      try {
        const aptId = Number(id);
        const apt = await apartmentService.getApartmentById(aptId);
        setApartment(apt);

        // Load images
        if (apt.images && apt.images.length > 0) {
          setImages(apt.images);
        } else {
          setImages([
            {
              id: 1,
              apartment_id: aptId,
              image_url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
              is_thumbnail: true
            }
          ]);
        }

        if (apt.building_id) {
          const bld = await buildingService.getBuildingById(apt.building_id);
          setBuilding(bld);
        } else if (apt.building) {
          setBuilding(apt.building as unknown as BuildingData);
        }

        // Load reviews
        try {
          const revs = await getApartmentReviews(aptId);
          setReviews(revs.data);
          setReviewMeta(revs.meta);
        } catch (e) {
          console.error("Error loading reviews:", e);
        }

        if (searchParams.get("book") === "true" && apt.status !== "RENTED") {
          setShowScheduleForm(true);
        }
      } catch (error) {
        console.error("Error fetching apartment:", error);
        toast.error("Không tìm thấy căn hộ hoặc lỗi tải dữ liệu");
        setApartment(null);
        setBuilding(null);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, searchParams]);

  if (loading) {
    return (
      <div className="pt-24 text-center font-sans flex flex-col items-center justify-center min-h-[300px]">
        <LoadingSpinner className="mb-2" size={32} />
        <p className="text-gray-500">Đang tải thông tin căn hộ...</p>
      </div>
    );
  }

  if (!apartment) {
    return (
      <div className="pt-24 text-center font-sans">
        <p className="text-gray-500">Không tìm thấy căn hộ</p>
        <Link to="/apartments" className="text-primary-600 hover:underline text-sm mt-2 inline-block">
          Quay lại danh sách
        </Link>
      </div>
    );
  }




  return (
    <div className="pt-20 pb-16 font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Quay lai */}
        <Link to="/apartments" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft size={16} /> Quay lại danh sách
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Thong tin chi tiet */}
          <div className={`${apartment.status === "RENTED" ? "lg:col-span-3" : "lg:col-span-2"} space-y-6`}>
            {/* Hinh anh */}
            {images.length > 0 ? (
              <div className="flex flex-col gap-2">
                <div className="w-full h-72 lg:h-96 rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
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
                        onClick={() => {
                          const updated = images.map((i) => ({
                            ...i,
                            is_thumbnail: i.id === img.id
                          }));
                          setImages(updated);
                        }}
                        className={`w-20 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${img.is_thumbnail ? "border-primary-500 scale-102" : "border-gray-200"
                          }`}
                      >
                        <img src={img.image_url} className="w-full h-full object-cover" alt="" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-72 lg:h-96 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-200">
                <span className="text-gray-350">Hình ảnh căn hộ</span>
              </div>
            )}

            {/* Thong tin co ban */}
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {formatApartmentDisplay(apartment.room_number, apartment.floor, "ADMIN", building?.branch_name)}
                  </h1>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                    <MapPin size={14} />
                    <span>{building?.name} - {building?.address_new || building?.address_old}</span>
                  </div>
                </div>
                <Badge variant={APARTMENT_STATUS_COLORS[apartment.status as keyof typeof APARTMENT_STATUS_COLORS] as "success" | "info" | "warning"}>
                  {APARTMENT_STATUS_LABELS[apartment.status as keyof typeof APARTMENT_STATUS_LABELS]}
                </Badge>
              </div>

              <p className="text-2xl font-bold text-primary-600 mt-4">
                {formatCurrency(apartment.rental_price)}<span className="text-sm text-gray-400 font-normal">/tháng</span>
              </p>
            </div>

            {/* Thong so */}
            <Card>
              <h3 className="font-semibold text-gray-800 mb-4 font-sans">Thông tin căn hộ</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-md">
                  <Maximize2 size={18} className="text-primary-600 mx-auto mb-1" />
                  <p className="text-sm font-semibold text-gray-800">{apartment.area} m²</p>
                  <p className="text-xs text-gray-400">Diện tích</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-md">
                  <p className="text-sm font-semibold text-gray-800">Tòa {building?.name.replace(/yuki\s*house\s*|yuki\s*/gi, "")}</p>
                  <p className="text-xs text-gray-400">Tòa nhà</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-md">
                  <p className="text-sm font-semibold text-gray-800">{building?.total_floors} tầng</p>
                  <p className="text-xs text-gray-400">Tổng tầng</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-md">
                  <p className="text-sm font-semibold text-gray-800">{apartment.status === "AVAILABLE" ? "Sẵn sàng" : "Đang thuê"}</p>
                  <p className="text-xs text-gray-400">Trạng thái</p>
                </div>
              </div>
            </Card>

            {/* Mo ta */}
            <Card>
              <h3 className="font-semibold text-gray-800 mb-3">Mô tả</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{apartment.description}</p>
            </Card>

            {/* Đánh giá & Nhận xét */}
            <Card>
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>Đánh giá & Nhận xét</span>
                {reviewMeta.totalReviews > 0 && (
                  <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
                    {reviewMeta.averageRating}★ ({reviewMeta.totalReviews})
                  </span>
                )}
              </h3>

              {reviews.length > 0 ? (
                <div className="divide-y divide-gray-150 space-y-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="pt-4 first:pt-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-700 text-sm">
                          {r.tenant?.full_name || "Khách hàng Yuki House"}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(r.created_at).toLocaleDateString("vi-VN")}
                        </span>
                      </div>

                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={14}
                            className={
                              s <= r.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"
                            }
                          />
                        ))}
                      </div>

                      <p className="text-sm text-gray-650 leading-relaxed">
                        {r.comment || "Không có nội dung nhận xét."}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">Chưa có đánh giá nào cho căn hộ này.</p>
              )}
            </Card>
          </div>

          {/*Right - Dat lich xem phong */}
          {apartment.status !== "RENTED" && (
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <h3 className="font-semibold text-gray-800 mb-4">Đặt lịch xem phòng</h3>
                <Button className="w-full" onClick={() => setShowScheduleForm(true)}>
                  Đặt lịch ngay
                </Button>
              </Card>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showScheduleForm}
        onClose={() => setShowScheduleForm(false)}
        title="Đặt lịch xem phòng"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={handleResetBooking}>Hủy</Button>
            <Button onClick={handleSubmitSchedule} isLoading={saving}>Gửi yêu cầu</Button>
          </>
        }
      >
        <div className="space-y-5">
          <p className="text-sm text-gray-500 mb-2">
            Căn hộ: <span className="font-semibold text-gray-800">{formatApartmentDisplay(apartment.room_number, apartment.floor, "ADMIN", building?.branch_name)}</span>
          </p>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12">
              <Input
                label="Họ tên *"
                type="text"
                value={scheduleForm.guest_name}
                onChange={(e) => setScheduleForm({ ...scheduleForm, guest_name: e.target.value })}
                placeholder="Nhập họ và tên..."
                icon={<User size={16} />}
                className="rounded-md text-xs"
              />
            </div>

            <div className="col-span-12">
              <Input
                label="Số điện thoại *"
                type="tel"
                value={scheduleForm.guest_phone}
                onChange={(e) => setScheduleForm({ ...scheduleForm, guest_phone: e.target.value })}
                placeholder="Nhập số điện thoại..."
                icon={<Phone size={16} />}
                className="rounded-md text-xs"
              />
            </div>

            <div className="col-span-12">
              <Input
                label="Email *"
                type="email"
                value={scheduleForm.guest_email}
                onChange={(e) => setScheduleForm({ ...scheduleForm, guest_email: e.target.value })}
                placeholder="Nhập email..."
                icon={<Mail size={16} />}
                className="rounded-md text-xs"
              />
            </div>

            <div className="col-span-12">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ngày muốn xem *</label>
              <Calendar
                value={selectedDate || null}
                onChange={(date) => {
                  if (!date) {
                    setSelectedDate("");
                    setSelectedSlot("");
                    return;
                  }
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  if (date < today) {
                    toast.error("Không thể chọn ngày trong quá khứ");
                    return;
                  }
                  const y = date.getFullYear();
                  const m = String(date.getMonth() + 1).padStart(2, "0");
                  const d = String(date.getDate()).padStart(2, "0");
                  setSelectedDate(`${y}-${m}-${d}`);
                  setSelectedSlot("");
                }}
                placeholder="Chọn ngày xem..."
              />
            </div>

            {selectedDate && (
              <div className="col-span-12">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Chọn giờ xem *</label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {timeSlots.map((slot) => {
                    const booked = isSlotBooked(slot);
                    const disabled = isSlotDisabled(slot);
                    const selected = selectedSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={disabled}
                        onClick={() => handleSelectSlot(slot)}
                        className={`py-2.5 px-3 border rounded-md text-xs font-semibold text-center transition-all cursor-pointer ${disabled
                          ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                          : selected
                            ? "bg-primary-600 text-white border-primary-600 shadow-sm"
                            : "bg-white text-gray-700 border-gray-300 hover:border-primary-500 hover:text-primary-600"
                          }`}
                      >
                        {slot} {selected && `(Giữ chỗ ${Math.floor(holdTimeLeft / 60)}:${String(holdTimeLeft % 60).padStart(2, "0")})`} {booked && " (Đã đặt)"}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="col-span-12">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ghi chú</label>
              <textarea
                rows={3}
                value={scheduleForm.note}
                onChange={(e) => setScheduleForm({ ...scheduleForm, note: e.target.value })}
                placeholder="Lưu ý gì thêm..."
                className="premium-input rounded-md resize-none text-xs"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
