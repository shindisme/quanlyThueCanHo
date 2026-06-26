import { useState } from "react";
import { toast } from "sonner";
import { bookViewing } from "../services/scheduleService";
import type { ApartmentData } from "../services/apartmentService";
import { scheduleSchema } from "../schemas/schedule.schema";

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

  const isSlotBooked = (slot: string) => {
    try {
      const stored = localStorage.getItem("booked-viewing-slots");
      const list = stored ? JSON.parse(stored) : [];
      if (!apartment) return false;
      return list.some(
        (b: any) => b.apartmentId === apartment.id && b.date === selectedDate && b.slot === slot
      );
    } catch {
      return false;
    }
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

      toast.success("Đã gửi yêu cầu đặt lịch xem phòng thành công!");
      setShowScheduleForm(false);
      setScheduleForm({ guest_name: "", guest_phone: "", guest_email: "", schedule_time: "", note: "" });
      setSelectedDate("");
      setSelectedSlot("");
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
  };
}
