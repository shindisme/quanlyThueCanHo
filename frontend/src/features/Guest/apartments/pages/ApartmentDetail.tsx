import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, MapPin, Maximize2, Phone, User, Star, Mail, X, ChevronLeft, ChevronRight, ImageOff, Layers, BedDouble, Bath } from "lucide-react";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import Card from "../../../../components/ui/Card";
import Button from "../../../../components/ui/Button";
import Badge from "../../../../components/ui/Badge";
import Modal from "../../../../components/ui/Modal";
import Input from "../../../../components/ui/Input";
import { DatePicker } from "../../../../components/ui/DatePicker";
import { APARTMENT_STATUS_LABELS, APARTMENT_STATUS_COLORS } from "../../../../constants/enums";
import { formatCurrency } from "../../../../utils/currency";
import { formatApartmentDisplay } from "../../../../utils/string";
import { toast } from "sonner";
import * as apartmentService from "../../../../services/apartmentService";
import * as buildingService from "../../../../services/buildingService";
import type { ApartmentData } from "../../../../services/apartmentService";
import type { BuildingData } from "../../../../services/buildingService";
import { getApartmentReviews } from "../../../../services/reviewService";
import type { ReviewData } from "../../../../services/reviewService";
import type { ApartmentImage } from "../../../../types";
import { useApartmentBooking } from "../hooks/useApartmentBooking";

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
    selectedTimeSlot,
    setSelectedTimeSlot,
    isPending,
    bookingForm,
    setBookingForm,
    checkIsSlotBooked,
    handleBookingScheduleSubmit,
    holdTimeRemaining,
    handleSelectBookingSlot,
    handleResetBooking,
  } = useApartmentBooking({ apartment });

  const isSlotDisabled = (slot: string) => {
    if (checkIsSlotBooked(slot)) return true;
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
  const [, setReviewMeta] = useState<{ averageRating: number; totalReviews: number }>({ averageRating: 0, totalReviews: 0 });
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const ratingCounts = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      const rating = r.rating as 1 | 2 | 3 | 4 | 5;
      if (counts[rating] !== undefined) {
        counts[rating]++;
      }
    });
    return counts;
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    if (ratingFilter === null) return reviews;
    return reviews.filter((r) => r.rating === ratingFilter);
  }, [reviews, ratingFilter]);

  useEffect(() => {
    if (!id) return;

    async function loadData() {
      setLoading(true);
      try {
        const aptId = Number(id);
        const apt = await apartmentService.getApartmentById(aptId);
        setApartment(apt);

        // Load images
        setActiveImageIndex(0);
        const aptImages = apt.images || [];
        if (aptImages.length === 0) {
          setImages([
            {
              id: 1,
              apartment_id: aptId,
              image_url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
              is_thumbnail: true
            }
          ]);
        } else {
          setImages(aptImages);
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

        if (searchParams.get("book") === "true" && apt.status === "AVAILABLE") {
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
                <div
                  onClick={() => setIsLightboxOpen(true)}
                  className="w-full h-72 lg:h-96 rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50 relative group cursor-zoom-in"
                >
                  <img
                    src={images[activeImageIndex]?.image_url || images[0].image_url}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    alt="Ảnh căn hộ"
                  />
                  <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-xs text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                    <Maximize2 size={12} />
                    <span>Xem ảnh phóng to ({activeImageIndex + 1}/{images.length})</span>
                  </div>
                </div>
                {images.length > 1 ? (
                  <div className="flex gap-2 overflow-x-auto py-1 scrollbar-thin">
                    {images.map((img, idx) => (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => {
                          setActiveImageIndex(idx);
                        }}
                        className={`w-20 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${idx === activeImageIndex ? "border-primary-500 scale-[1.03] shadow-xs" : "border-gray-200 hover:border-gray-350"
                          }`}
                      >
                        <img src={img.image_url} className="w-full h-full object-cover" alt="Thu nhỏ" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-gray-400 py-3 border border-dashed border-gray-200 rounded-xl px-3 bg-gray-200 mt-1 font-sans">
                    <ImageOff size={14} className="text-gray-400" />
                    <span>Căn hộ này chưa cập nhật các hình ảnh chi tiết khác.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-72 lg:h-96 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-200 text-gray-400 font-medium">
                <span>Chưa có hình ảnh căn hộ</span>
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
                    <span>{building?.name} - {building?.address}</span>
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
              </h3>

              {reviews.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4 font-sans">
                  <button
                    type="button"
                    onClick={() => setRatingFilter(null)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${ratingFilter === null
                      ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                      : "bg-white text-gray-650 border-gray-250 hover:bg-gray-50"
                      }`}
                  >
                    Tất cả ({reviews.length})
                  </button>
                  {[5, 4, 3, 2, 1].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingFilter(star)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1 cursor-pointer ${ratingFilter === star
                        ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                        : "bg-white text-gray-650 border-gray-250 hover:bg-gray-50"
                        }`}
                    >
                      <span>{star} ★</span>
                      <span className={ratingFilter === star ? "text-amber-100" : "text-gray-400"}>
                        ({ratingCounts[star as 1 | 2 | 3 | 4 | 5] || 0})
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {reviews.length > 0 ? (
                filteredReviews.length > 0 ? (
                  <div className="divide-y divide-gray-150 space-y-4">
                    {filteredReviews.map((r) => (
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
                  <p className="text-sm text-gray-400 text-center py-4 font-sans">
                    Không có nhận xét nào.
                  </p>
                )
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">Chưa có đánh giá nào cho căn hộ này.</p>
              )}
            </Card>
          </div>

          {/*Right - Dat lich xem phong */}
          {apartment.status === "AVAILABLE" && (
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
            <Button onClick={handleBookingScheduleSubmit} isLoading={isPending}>Gửi yêu cầu</Button>
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
                value={bookingForm.guest_name}
                onChange={(e) => setBookingForm({ ...bookingForm, guest_name: e.target.value })}
                placeholder="Nhập họ và tên..."
                icon={<User size={16} />}
                className="rounded-md text-xs"
              />
            </div>

            <div className="col-span-12">
              <Input
                label="Số điện thoại *"
                type="tel"
                value={bookingForm.guest_phone}
                onChange={(e) => setBookingForm({ ...bookingForm, guest_phone: e.target.value })}
                placeholder="Nhập số điện thoại..."
                icon={<Phone size={16} />}
                className="rounded-md text-xs"
              />
            </div>

            <div className="col-span-12">
              <Input
                label="Email *"
                type="email"
                value={bookingForm.guest_email}
                onChange={(e) => setBookingForm({ ...bookingForm, guest_email: e.target.value })}
                placeholder="Nhập email..."
                icon={<Mail size={16} />}
                className="rounded-md text-xs"
              />
            </div>

            <div className="col-span-12">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ngày muốn xem *</label>
              <DatePicker
                value={selectedDate || null}
                onChange={(date) => {
                  if (!date) {
                    setSelectedDate("");
                    setSelectedTimeSlot("");
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
                  setSelectedTimeSlot("");
                }}
                placeholder="Chọn ngày xem..."
              />
            </div>

            {selectedDate && (
              <div className="col-span-12">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Chọn giờ xem *</label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {timeSlots.map((slot) => {
                    const booked = checkIsSlotBooked(slot);
                    const disabled = isSlotDisabled(slot);
                    const selected = selectedTimeSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={disabled}
                        onClick={() => handleSelectBookingSlot(slot)}
                        className={`py-2.5 px-3 border rounded-md text-xs font-semibold text-center transition-all cursor-pointer ${disabled
                          ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                          : selected
                            ? "bg-primary-600 text-white border-primary-600 shadow-sm"
                            : "bg-white text-gray-700 border-gray-300 hover:border-primary-500 hover:text-primary-600"
                          }`}
                      >
                        {slot} {selected && `(Giữ chỗ ${Math.floor(holdTimeRemaining / 60)}:${String(holdTimeRemaining % 60).padStart(2, "0")})`} {booked && " (Đã đặt)"}
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
                value={bookingForm.note}
                onChange={(e) => setBookingForm({ ...bookingForm, note: e.target.value })}
                placeholder="Lưu ý gì thêm..."
                className="premium-input rounded-md resize-none text-xs"
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Lightbox Modal */}
      {isLightboxOpen && images.length > 0 && (
        <div className="fixed inset-0 bg-black/95 z-9999 flex flex-col justify-between p-4 font-sans select-none">
          {/* Top Bar */}
          <div className="flex items-center justify-between text-white py-2 px-4">
            <span className="text-sm font-semibold text-gray-300">
              Ảnh căn hộ {apartment.room_number} ({activeImageIndex + 1} / {images.length})
            </span>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 text-white hover:text-gray-300 transition-colors bg-white/10 hover:bg-white/20 rounded-full cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Main Slide Area */}
          <div className="relative flex-1 flex items-center justify-center max-w-5xl mx-auto w-full group">
            {/* Prev Button */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                }}
                className="absolute left-4 z-10 p-3 bg-black/50 hover:bg-black/85 text-white hover:text-primary-450 rounded-full transition-all cursor-pointer"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            {/* Main Image */}
            <div className="max-h-[70vh] md:max-h-[78vh] w-full flex items-center justify-center overflow-hidden">
              <img
                src={images[activeImageIndex]?.image_url}
                className="max-h-full max-w-full object-contain rounded-lg shadow-2xl transition-all duration-300"
                alt={`Ảnh chi tiết ${activeImageIndex + 1}`}
              />
            </div>

            {/* Next Button */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                }}
                className="absolute right-4 z-10 p-3 bg-black/50 hover:bg-black/85 text-white hover:text-primary-455 rounded-full transition-all cursor-pointer"
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>

          {/* Thumbnail strip at bottom */}
          {images.length > 1 && (
            <div className="w-full flex justify-center gap-2 overflow-x-auto py-4 max-w-2xl mx-auto scrollbar-thin">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-12 rounded-md overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${idx === activeImageIndex ? "border-primary-500 scale-[1.05] shadow-md" : "border-white/20 hover:border-white/50"
                    }`}
                >
                  <img src={img.image_url} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
