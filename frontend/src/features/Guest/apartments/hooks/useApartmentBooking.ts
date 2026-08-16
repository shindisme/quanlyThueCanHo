import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { bookViewing, getViewingAvailability } from "../../../../services/scheduleService";
import type { ApartmentData } from "../../../../services/apartmentService";
import { scheduleSchema } from "../../../../schemas/schedule.schema";
import { queryKeys } from "../../../../constants/queryKeys";
import { getApiErrorMessage } from "../../../../utils/apiError";

interface UseApartmentBookingProps {
  apartment: ApartmentData | null;
}

export function useApartmentBooking({ apartment }: UseApartmentBookingProps) {
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [bookingForm, setBookingForm] = useState({
    guest_name: "",
    guest_phone: "",
    guest_email: "",
    schedule_time: "",
    note: "",
  });

  // Fetch availability
  const availabilityQuery = useQuery({
    queryKey: queryKeys.schedules.availability(apartment?.id, selectedDate),
    queryFn: () => getViewingAvailability(apartment!.id, selectedDate),
    enabled: showScheduleForm && !!apartment && !!selectedDate,
  });

  const availability = availabilityQuery.data
    ? {
      date: selectedDate,
      hours: availabilityQuery.data.available_hours,
      dailyCapacity: availabilityQuery.data.daily_capacity,
      bookedCount: availabilityQuery.data.booked_count,
      isDayFull: availabilityQuery.data.is_day_full,
    }
    : null;

  const checkIsSlotUnavailable = () =>
    availability?.date === selectedDate && availability.isDayFull;

  const handleSelectBookingSlot = (slot: string) => {
    if (selectedTimeSlot === slot) {
      setSelectedTimeSlot("");
    } else {
      setSelectedTimeSlot(slot);
    }
  };

  const handleResetBooking = () => {
    setSelectedTimeSlot("");
    setShowScheduleForm(false);
    setBookingForm({ guest_name: "", guest_phone: "", guest_email: "", schedule_time: "", note: "" });
    setSelectedDate("");
  };

  const handleSubmitSchedule = useMutation({
    mutationFn: (payload: Parameters<typeof bookViewing>[0]) => bookViewing(payload),
    onSuccess: () => {
      toast.success("Đặt lịch xem phòng thành công!");
      handleResetBooking();
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Gửi yêu cầu thất bại"));
    },
  });

  const handleBookingScheduleSubmit = () => {
    if (!apartment) return;
    if (apartment.status === "RENTED") {
      toast.error("Căn hộ đã được thuê, không thể đặt lịch xem phòng!");
      return;
    }
    const payload = {
      guest_name: bookingForm.guest_name,
      guest_phone: bookingForm.guest_phone,
      guest_email: bookingForm.guest_email,
      selectedDate,
      selectedSlot: selectedTimeSlot,
      note: bookingForm.note,
    };
    const validationResult = scheduleSchema.safeParse(payload);
    if (!validationResult.success) {
      const firstMsg = validationResult.error.issues[0]?.message || "Thông tin đặt lịch không hợp lệ";
      toast.error(firstMsg);
      return;
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const todayStr = `${year}-${month}-${day}`;

    if (selectedDate < todayStr) {
      toast.error("Không thể đặt lịch xem phòng ở ngày trong quá khứ!");
      return;
    }

    const isTooCloseOrBooked = () => {
      if (checkIsSlotUnavailable()) return true;

      if (!selectedDate || !selectedTimeSlot) return true;
      const [hoursStr, minutesStr] = selectedTimeSlot.split("h");
      const slotHours = parseInt(hoursStr, 10);
      const slotMinutes = parseInt(minutesStr, 10);
      const [year, month, day] = selectedDate.split("-").map(Number);
      const slotDateObj = new Date(year, month - 1, day, slotHours, slotMinutes);

      const minSelectableDateObj = new Date();
      minSelectableDateObj.setHours(minSelectableDateObj.getHours() + 6);
      return slotDateObj < minSelectableDateObj;
    };

    if (isTooCloseOrBooked()) {
      toast.error("Ngày đã đủ lượt đặt lịch hoặc thời gian xem còn cách hiện tại dưới 6 tiếng.");
      return;
    }

    const combinedTime = `${selectedDate}T${selectedTimeSlot.replace("h", ":")}:00+07:00`;

    handleSubmitSchedule.mutate({
      apartment_id: apartment.id,
      guest_name: bookingForm.note
        ? `${bookingForm.guest_name} (Ghi chú: ${bookingForm.note})`
        : bookingForm.guest_name,
      guest_phone: bookingForm.guest_phone,
      guest_email: bookingForm.guest_email,
      schedule_time: combinedTime,
    });
  };

  return {
    showScheduleForm,
    setShowScheduleForm,
    selectedDate,
    setSelectedDate,
    selectedTimeSlot,
    setSelectedTimeSlot,
    isPending: handleSubmitSchedule.isPending,
    bookingForm,
    setBookingForm,
    checkIsSlotUnavailable,
    handleBookingScheduleSubmit,
    handleSelectBookingSlot,
    handleResetBooking,
    dayAvailability: availability,
  };
}
