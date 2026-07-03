import { useState, useEffect } from "react";
import { toast } from "sonner";
import { bookViewing } from "../services/scheduleService";
import type { ApartmentData } from "../services/apartmentService";
import { scheduleSchema } from "../schemas/schedule.schema";

interface BookedSlot {
  apartmentId: number;
  date: string;
  slot: string;
}

interface UseApartmentBookingProps {
  apartment: ApartmentData | null;
}

export function useApartmentBooking({ apartment }: UseApartmentBookingProps) {
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [saving, setSaving] = useState(false);
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

  const isSlotBooked = (slot: string) => {
    try {
      const stored = localStorage.getItem("booked-viewing-slots");
      const list = stored ? JSON.parse(stored) : [];
      if (!apartment) return false;
      return list.some(
        (b: BookedSlot) => b.apartmentId === apartment.id && b.date === selectedDate && b.slot === slot
      );
    } catch {
      return false;
    }
  };

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
      const stored = localStorage.getItem("booked-viewing-slots");
      const list = stored ? JSON.parse(stored) : [];
      const isBooked = list.some(
        (b: BookedSlot) => b.apartmentId === apartment.id && b.date === selectedDate && b.slot === selectedSlot
      );
      if (isBooked) return true;

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

      const stored = localStorage.getItem("booked-viewing-slots");
      const list = stored ? JSON.parse(stored) : [];
      list.push({
        apartmentId: apartment.id,
        date: selectedDate,
        slot: selectedSlot,
      });
      localStorage.setItem("booked-viewing-slots", JSON.stringify(list));

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
