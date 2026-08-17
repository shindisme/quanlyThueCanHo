import { useMemo } from "react";
import { Mail, Phone, User } from "lucide-react";
import Button from "../../../../components/ui/Button";
import { DatePicker } from "../../../../components/ui/DatePicker";
import Input from "../../../../components/ui/Input";
import Modal from "../../../../components/ui/Modal";
import type { useApartmentBooking } from "../hooks/useApartmentBooking";

type ApartmentBookingState = ReturnType<typeof useApartmentBooking>;

interface ApartmentBookingModalProps {
  apartmentLabel: string;
  booking: ApartmentBookingState;
}

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function ApartmentBookingModal({ apartmentLabel, booking }: ApartmentBookingModalProps) {
  const minViewingDate = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }, []);

  const {
    showScheduleForm,
    selectedDate,
    setSelectedDate,
    isPending,
    bookingForm,
    setBookingForm,
    isAvailabilityLoading,
    isSelectedDateFull,
    handleBookingScheduleSubmit,
    handleResetBooking,
  } = booking;

  return (
    <Modal
      isOpen={showScheduleForm}
      onClose={handleResetBooking}
      title="Đặt lịch xem phòng"
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={handleResetBooking}>Hủy</Button>
          <Button
            onClick={handleBookingScheduleSubmit}
            isLoading={isPending}
            disabled={isAvailabilityLoading || isSelectedDateFull}
          >
            Gửi yêu cầu
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <p className="mb-2 text-sm text-gray-500">
          Căn hộ: <span className="font-semibold text-gray-800">{apartmentLabel}</span>
        </p>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12">
            <Input
              label="Họ tên *"
              value={bookingForm.guest_name}
              onChange={(event) => setBookingForm({ ...bookingForm, guest_name: event.target.value })}
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
              onChange={(event) => setBookingForm({ ...bookingForm, guest_phone: event.target.value })}
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
              onChange={(event) => setBookingForm({ ...bookingForm, guest_email: event.target.value })}
              placeholder="Nhập email..."
              icon={<Mail size={16} />}
              className="rounded-md text-xs"
            />
          </div>
          <div className="col-span-12">
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Ngày muốn xem *</label>
            <DatePicker
              value={selectedDate || null}
              minDate={minViewingDate}
              onChange={(date) => {
                const nextDate = date ? formatLocalDate(date) : "";
                setSelectedDate(nextDate);
              }}
              placeholder="Chọn ngày xem..."
            />
          </div>

          {selectedDate && isSelectedDateFull && (
            <div className="col-span-12 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
              Hiện tại lịch xem trong ngày không còn trống, vui lòng chọn ngày khác.
            </div>
          )}

          <div className="col-span-12">
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Ghi chú</label>
            <textarea
              rows={3}
              value={bookingForm.note}
              onChange={(event) => setBookingForm({ ...bookingForm, note: event.target.value })}
              placeholder="Lưu ý gì thêm..."
              className="premium-input resize-none rounded-md text-xs"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
