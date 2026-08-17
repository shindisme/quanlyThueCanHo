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
  const [selectedTime, setSelectedTime] = useState("");
  const [bookingForm, setBookingForm] = useState({
    guest_name: "",
    guest_phone: "",
    guest_email: "",
    note: "",
  });

  const availabilityQuery = useQuery({
    queryKey: queryKeys.schedules.availability(apartment?.id, selectedDate),
    queryFn: () => getViewingAvailability(apartment!.id, selectedDate),
    enabled: showScheduleForm && !!apartment && !!selectedDate,
  });

  const availability = availabilityQuery.data ?? null;
  const isSelectedDateFull = Boolean(availability?.is_full);

  const handleResetBooking = () => {
    setShowScheduleForm(false);
    setBookingForm({ guest_name: "", guest_phone: "", guest_email: "", note: "" });
    setSelectedDate("");
    setSelectedTime("");
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
      selectedTime,
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

    if (selectedDate === todayStr) {
      toast.error("Khách hàng chỉ có thể đặt lịch xem trước ít nhất 1 ngày.");
      return;
    }

    if (isSelectedDateFull) {
      toast.error("Lịch xem trong ngày này đã đầy, hãy đặt lịch xem vào ngày hôm sau.");
      return;
    }

    const combinedTime = `${selectedDate}T${selectedTime}:00+07:00`;

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
    selectedTime,
    setSelectedTime,
    isPending: handleSubmitSchedule.isPending,
    bookingForm,
    setBookingForm,
    availability,
    isAvailabilityLoading: availabilityQuery.isFetching,
    isSelectedDateFull,
    handleBookingScheduleSubmit,
    handleResetBooking,
  };
}
