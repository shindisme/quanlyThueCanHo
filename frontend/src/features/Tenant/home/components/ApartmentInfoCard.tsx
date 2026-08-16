import { MapPin, Maximize2, CreditCard, Calendar, Home as HomeIcon, Star } from "lucide-react";
import { formatCurrency } from "../../../../utils/currency";
import { formatApartmentDisplay } from "../../../../utils/string";
import type { Apartment, Building, RentalContract } from "../../../../types";

interface ApartmentInfoCardProps {
  activeContract: RentalContract | null;
  apartment: Apartment | null;
  building: Building | null;
  endedContract: RentalContract | null;
  endedApartment: Apartment | null;
  endedBuilding: Building | null;
  daysUntilExpiry: number;
  onOpenReviewModal: () => void;
}

export default function ApartmentInfoCard({
  activeContract,
  apartment,
  building,
  endedContract,
  endedApartment,
  endedBuilding,
  daysUntilExpiry,
  onOpenReviewModal,
}: ApartmentInfoCardProps) {
  return (
    <div className="w-full bg-white border border-gray-100 p-4 sm:p-5 shadow-lg">
      {activeContract ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-gray-800 text-base sm:text-lg">Căn hộ của bạn</h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                <span className="font-semibold text-primary-600">
                  {apartment ? formatApartmentDisplay(apartment.room_number, apartment.floor) : "-"}
                </span>
                {" "}- {apartment?.description || "Căn hộ của bạn"}
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 bg-success-100 text-success-700 font-semibold shrink-0">
              Đang thuê
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mt-2 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-gray-600 bg-gray-50/70 sm:bg-gray-50/50 sm:border sm:border-gray-100/60 p-2.5 sm:p-3 rounded-xl min-w-0">
              <MapPin size={16} className="text-primary-500 shrink-0" />
              <span className="truncate font-medium text-gray-700">{building?.branch_name || building?.name || "Yuki House"}</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-gray-600 bg-gray-50/70 sm:bg-gray-50/50 sm:border sm:border-gray-100/60 p-2.5 sm:p-3 rounded-xl min-w-0">
              <Maximize2 size={16} className="text-primary-500 shrink-0" />
              <span className="font-medium text-gray-700">{apartment?.area || "-"} m² · Tầng {apartment?.floor || "-"}</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-gray-600 bg-gray-50/70 sm:bg-gray-50/50 sm:border sm:border-gray-100/60 p-2.5 sm:p-3 rounded-xl min-w-0">
              <CreditCard size={16} className="text-primary-500 shrink-0" />
              <span className="font-medium text-gray-700">{formatCurrency(activeContract.monthly_rent || apartment?.rental_price || 0)}/tháng</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-gray-600 bg-gray-50/70 sm:bg-gray-50/50 sm:border sm:border-gray-100/60 p-2.5 sm:p-3 rounded-xl min-w-0">
              <Calendar size={16} className="text-primary-500 shrink-0" />
              <span className="font-medium text-gray-700">{daysUntilExpiry > 0 ? `Hợp đồng: Còn ${daysUntilExpiry} ngày` : "Hợp đồng hết hạn"}</span>
            </div>
          </div>
        </div>
      ) : endedContract ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-gray-800 text-base sm:text-lg">Căn hộ đã hết hạn thuê</h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                <span className="font-semibold text-red-600">
                  {endedApartment ? formatApartmentDisplay(endedApartment.room_number, endedApartment.floor) : "-"}
                </span>
                {" "}- {endedApartment?.description || "Căn hộ trước đây"}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs px-2.5 py-1 bg-red-50 text-red-600 font-semibold">
                Đã hết hạn
              </span>
              <button
                type="button"
                onClick={onOpenReviewModal}
                className="text-xs px-3 py-1 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-bold flex items-center gap-1 cursor-pointer transition-all"
              >
                <Star size={12} className="fill-amber-500 text-amber-500" />
                Đánh giá căn hộ
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mt-2 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-gray-600 bg-gray-50/70 sm:bg-gray-50/50 sm:border sm:border-gray-100/60 p-2.5 sm:p-3 rounded-xl min-w-0">
              <MapPin size={16} className="text-gray-400 shrink-0" />
              <span className="truncate font-medium text-gray-700">{endedBuilding?.branch_name || endedBuilding?.name || "Yuki House"}</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-gray-600 bg-gray-50/70 sm:bg-gray-50/50 sm:border sm:border-gray-100/60 p-2.5 sm:p-3 rounded-xl min-w-0">
              <Maximize2 size={16} className="text-gray-400 shrink-0" />
              <span className="font-medium text-gray-700">{endedApartment?.area || "-"} m² · Tầng {endedApartment?.floor || "-"}</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-gray-600 bg-gray-50/70 sm:bg-gray-50/50 sm:border sm:border-gray-100/60 p-2.5 sm:p-3 rounded-xl min-w-0">
              <CreditCard size={16} className="text-gray-400 shrink-0" />
              <span className="font-medium text-gray-700">{formatCurrency(endedContract.monthly_rent || endedApartment?.rental_price || 0)}/tháng</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-gray-600 bg-gray-50/70 sm:bg-gray-50/50 sm:border sm:border-gray-100/60 p-2.5 sm:p-3 rounded-xl min-w-0">
              <Calendar size={16} className="text-gray-400 shrink-0" />
              <span className="text-red-500 font-semibold">Hết hạn: {new Date(endedContract.end_date).toLocaleDateString("vi-VN")}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          <HomeIcon size={40} className="mx-auto mb-2 text-gray-300" />
          <p className="font-medium text-sm">Bạn chưa có hợp đồng thuê căn hộ nào đang hoạt động.</p>
          <p className="text-xs text-gray-400 mt-1">Liên hệ với ban quản lý nếu có thắc mắc.</p>
        </div>
      )}
    </div>
  );
}
