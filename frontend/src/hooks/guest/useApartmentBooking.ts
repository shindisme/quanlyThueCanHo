import { useState, useEffect } from "react";
import { toast } from "sonner";
import { bookViewing, getViewingAvailability } from "../../services/scheduleService";
import type { ApartmentData } from "../../services/apartmentService";
import { scheduleSchema } from "../../schemas/schedule.schema";

interface UseApartmentBookingProps {
  apartment: ApartmentData | null;
}

export function useApartmentBooking({ apartment }: UseApartmentBookingProps) {
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState<{ date: string; hours: number[] } | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    guest_name: "",
    guest_phone: "",
    guest_email: "",
    schedule_time: "",
    note: "",
  });

  const [holdTimeLeft, setHoldTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!selectedSlot || holdTimeLeft <= 0) return;
    const timer = setInterval(() => {
      setHoldTimeLeft((prev) => {
        if (prev <= 1) {
          setSelectedSlot("");
          toast.error("Đã hết thời gian giữ khung giờ này. Vui lòng chọn lại!");
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedSlot, holdTimeLeft]);

  useEffect(() => {
    setAvailability(null);
    if (!showScheduleForm || !apartment || !selectedDate) return;

    let ignore = false;
    getViewingAvailability(apartment.id, selectedDate)
      .then(({ available_hours }) => {
        if (!ignore) setAvailability({ date: selectedDate, hours: available_hours });
      })
      .catch(() => undefined);

    return () => { ignore = true; };
  }, [apartment, selectedDate, showScheduleForm]);

  const isSlotBooked = (slot: string) =>
    availability?.date === selectedDate
    && !availability.hours.includes(Number.parseInt(slot, 10));

  const handleSelectSlot = (slot: string) => {
    if (selectedSlot === slot) {
      setSelectedSlot("");
      setHoldTimeLeft(0);
    } else {
      setSelectedSlot(slot);
      setHoldTimeLeft(600); // 10min
      toast.info(`Khung giờ ${slot} đang được giữ tạm thời cho bạn trong 10 phút.`);
    }
  };

  const handleResetBooking = () => {
    setSelectedSlot("");
    setHoldTimeLeft(0);
    setShowScheduleForm(false);
    setScheduleForm({ guest_name: "", guest_phone: "", guest_email: "", schedule_time: "", note: "" });
    setSelectedDate("");
  };

  async function handleSubmitSchedule() {
    if (!apartment) return;
    if (apartment.status === "RENTED") {
      toast.error("Căn hộ đã được thuê, không thể đặt lịch xem phòng!");
      return;
    }
    const payload = {
      guest_name: scheduleForm.guest_name,
      guest_phone: scheduleForm.guest_phone,
      guest_email: scheduleForm.guest_email,
      selectedDate,
      selectedSlot,
      note: scheduleForm.note,
    };
    const result = scheduleSchema.safeParse(payload);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    const isTooCloseOrBooked = () => {
      if (isSlotBooked(selectedSlot)) return true;

      if (!selectedDate || !selectedSlot) return true;
      const [hoursStr, minutesStr] = selectedSlot.split("h");
      const slotHours = parseInt(hoursStr, 10);
      const slotMinutes = parseInt(minutesStr, 10);
      const [year, month, day] = selectedDate.split("-").map(Number);
      const slotDateObj = new Date(year, month - 1, day, slotHours, slotMinutes);

      const minSelectableDateObj = new Date();
      minSelectableDateObj.setHours(minSelectableDateObj.getHours() + 6);
      return slotDateObj < minSelectableDateObj;
    };

    if (isTooCloseOrBooked()) {
      toast.error("Mốc giờ xem phòng không khả dụng (đã được đặt hoặc quá sát giờ hiện tại < 6 tiếng)!");
      return;
    }

    setSaving(true);
    const combinedTime = `${selectedDate}T${selectedSlot.replace("h", ":")}:00`;
    try {
      await bookViewing({
        apartment_id: apartment.id,
        guest_name: scheduleForm.note
          ? `${scheduleForm.guest_name} [Ghi chú: ${scheduleForm.note}]`
          : scheduleForm.guest_name,
        guest_phone: scheduleForm.guest_phone,
        guest_email: scheduleForm.guest_email,
        schedule_time: combinedTime,
      });

      toast.success("Đặt lịch xem phòng thành công!");
      handleResetBooking();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || "Gửi yêu cầu thất bại");
    } finally {
      setSaving(false);
    }
  }

  return {
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
    setHoldTimeLeft,
    handleSelectSlot,
    handleResetBooking,
  };
}
