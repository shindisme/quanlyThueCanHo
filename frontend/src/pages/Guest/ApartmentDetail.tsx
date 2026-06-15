import { useState, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, MapPin, Maximize2, Calendar, Phone, Mail, User } from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import { mockApartments } from "../../data/apartments";
import { mockBuildings } from "../../data/buildings";
import { APARTMENT_STATUS_LABELS, APARTMENT_STATUS_COLORS } from "../../constants/enums";
import { formatCurrency, formatApartmentDisplay } from "../../utils/format";
import { toast } from "sonner";
import { bookViewing } from "../../services/schedules.service";

interface BookedSlot {
  apartmentId: number;
  date: string;
  slot: string;
}

const timeSlots = [
  "09:00 - 10:00",
  "10:30 - 11:30",
  "14:00 - 15:00",
  "16:00 - 17:00"
];

export default function GuestApartmentDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const apartment = mockApartments.find((a) => a.id === Number(id));
  const building = apartment ? mockBuildings.find((b) => b.id === apartment.building_id) : null;
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [images, setImages] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");

  useEffect(() => {
    if (!id) return;
    const stored = localStorage.getItem(`apartment-${id}-images`);
    if (stored) {
      setImages(JSON.parse(stored));
    } else {
      const fallback = [
        {
          id: 1,
          apartment_id: Number(id),
          image_url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
          is_thumbnail: true
        },
        {
          id: 2,
          apartment_id: Number(id),
          image_url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
          is_thumbnail: false
        }
      ];
      localStorage.setItem(`apartment-${id}-images`, JSON.stringify(fallback));
      setImages(fallback);
    }
  }, [id]);

  useEffect(() => {
    if (searchParams.get("book") === "true") {
      setShowScheduleForm(true);
    }
  }, [searchParams]);

  // Form đặt lịch - controlled inputs
  const [scheduleForm, setScheduleForm] = useState({
    guest_name: "", guest_phone: "", guest_email: "", schedule_time: "",
  });

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

  const isSlotBooked = (slot: string) => {
    if (!selectedDate) return false;
    const stored = localStorage.getItem("booked-slots");
    if (!stored) return false;
    try {
      const list = JSON.parse(stored) as BookedSlot[];
      return list.some(
        (b) => b.apartmentId === apartment.id && b.date === selectedDate && b.slot === slot
      );
    } catch {
      return false;
    }
  };

  async function handleSubmitSchedule() {
    if (!scheduleForm.guest_name || !scheduleForm.guest_phone || !selectedDate || !selectedSlot) {
      toast.error("Vui lòng nhập họ tên, số điện thoại, chọn ngày và giờ xem phòng");
      return;
    }
    setSaving(true);
    const combinedTime = `${selectedDate}T${selectedSlot.split(" - ")[0]}:00`;
    try {
      await bookViewing({
        apartment_id: apartment!.id,
        guest_name: scheduleForm.guest_name,
        guest_phone: scheduleForm.guest_phone,
        guest_email: scheduleForm.guest_email,
        schedule_time: combinedTime,
      });

      // Save to localStorage
      const stored = localStorage.getItem("booked-slots");
      const list = stored ? JSON.parse(stored) : [];
      list.push({
        apartmentId: apartment!.id,
        date: selectedDate,
        slot: selectedSlot
      });
      localStorage.setItem("booked-slots", JSON.stringify(list));

      toast.success("Đã gửi yêu cầu đặt lịch xem phòng thành công!");
      setShowScheduleForm(false);
      setScheduleForm({ guest_name: "", guest_phone: "", guest_email: "", schedule_time: "" });
      setSelectedDate("");
      setSelectedSlot("");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Gửi yêu cầu thất bại");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pt-20 pb-16 font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Quay lai */}
        <Link to="/apartments" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft size={16} /> Quay lại danh sách
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cot trai - Thong tin chi tiet */}
          <div className="lg:col-span-2 space-y-6">
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
                <Badge variant={APARTMENT_STATUS_COLORS[apartment.status] as "success" | "info" | "warning"}>
                  {APARTMENT_STATUS_LABELS[apartment.status]}
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
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <Maximize2 size={18} className="text-primary-600 mx-auto mb-1" />
                  <p className="text-sm font-semibold text-gray-800">{apartment.area} m²</p>
                  <p className="text-xs text-gray-400">Diện tích</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-sm font-semibold text-gray-800">Tòa {building?.name.replace(/yuki\s*house\s*|yuki\s*/gi, "")}</p>
                  <p className="text-xs text-gray-400">Tòa nhà</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-sm font-semibold text-gray-800">{building?.total_floors} tầng</p>
                  <p className="text-xs text-gray-400">Tổng tầng</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-xl">
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
          </div>

          {/* Cot phai - Dat lich xem phong */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <h3 className="font-semibold text-gray-800 mb-4">Đặt lịch xem phòng</h3>
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                Không cần đăng ký tài khoản. Chỉ cần để lại thông tin liên hệ, chúng tôi sẽ liên lạc và hẹn giờ trực tiếp với bạn.
              </p>
              <Button className="w-full" onClick={() => setShowScheduleForm(true)}>
                <Calendar size={18} />
                Đặt lịch ngay
              </Button>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal form dat lich */}
      <Modal
        isOpen={showScheduleForm}
        onClose={() => setShowScheduleForm(false)}
        title="Đặt lịch xem phòng"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowScheduleForm(false)}>Hủy</Button>
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
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Họ tên *</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={scheduleForm.guest_name}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, guest_name: e.target.value })}
                  placeholder="Nguyễn Văn A" className="premium-input rounded-xl !pl-10 text-xs" />
              </div>
            </div>

            <div className="col-span-12 sm:col-span-6">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Số điện thoại *</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="tel" value={scheduleForm.guest_phone}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, guest_phone: e.target.value })}
                  placeholder="0901234567" className="premium-input rounded-xl !pl-10 text-xs" />
              </div>
            </div>

            <div className="col-span-12 sm:col-span-6">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" value={scheduleForm.guest_email}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, guest_email: e.target.value })}
                  placeholder="email@example.com" className="premium-input rounded-xl !pl-10 text-xs" />
              </div>
            </div>

            <div className="col-span-12">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ngày muốn xem *</label>
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlot("");
                }}
                className="premium-input rounded-xl text-xs"
              />
            </div>

            {selectedDate && (
              <div className="col-span-12">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Chọn giờ xem *</label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {timeSlots.map((slot) => {
                    const booked = isSlotBooked(slot);
                    const selected = selectedSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={booked}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2.5 px-3 border rounded-xl text-xs font-semibold text-center transition-all cursor-pointer ${
                          booked
                            ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                            : selected
                            ? "bg-primary-600 text-white border-primary-600 shadow-sm"
                            : "bg-white text-gray-700 border-gray-300 hover:border-primary-500 hover:text-primary-600"
                        }`}
                      >
                        {slot} {booked && " (Đã đặt)"}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="col-span-12">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ghi chú</label>
              <textarea rows={3}
                placeholder="Lưu ý gì thêm..." className="premium-input rounded-xl resize-none text-xs" />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
