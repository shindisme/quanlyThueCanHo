import { ArrowRight, MapPin, Maximize2 } from "lucide-react";
import { Link } from "react-router-dom";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import type { ApartmentData } from "../../../../services/apartmentService";
import type { BuildingData } from "../../../../services/buildingService";
import type { ApartmentImage } from "../../../../types";
import { formatCurrency } from "../../../../utils/currency";
import { formatApartmentDisplay } from "../../../../utils/string";

interface AvailableApartmentsSectionProps {
  apartments: ApartmentData[];
  buildings: BuildingData[];
  loading: boolean;
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80";

const getThumbnail = (apartment: ApartmentData) => {
  const images = apartment.images as ApartmentImage[] | undefined;
  return images?.find((image) => image.is_thumbnail)?.image_url || images?.[0]?.image_url || FALLBACK_IMAGE;
};

export default function AvailableApartmentsSection({ apartments, buildings, loading }: AvailableApartmentsSectionProps) {
  const buildingMap = new Map(buildings.map((building) => [building.id, building]));

  return (
    <section className="bg-gray-50/50 py-16">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="mb-8 flex items-center justify-between border-b border-gray-200 pb-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary-600">Căn hộ</p>
            <h2 className="text-3xl font-bold text-gray-900">Căn hộ còn trống</h2>
            <p className="mt-1 text-gray-500">Các căn hộ đang sẵn sàng cho thuê</p>
          </div>
          <Link to="/apartments" className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700">
            Xem tất cả <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size={32} /></div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {apartments.map((apartment) => {
              const building = buildingMap.get(apartment.building_id);
              return (
                <Link
                  key={apartment.id}
                  to={`/apartments/${apartment.id}`}
                  className="group block overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:border-primary-200 hover:shadow-lg"
                >
                  <div className="relative h-48 overflow-hidden bg-gray-100">
                    <img src={getThumbnail(apartment)} className="h-full w-full object-cover transition-transform group-hover:scale-105" alt="Ảnh căn hộ" />
                    {apartment.status === "VACATING_SOON" ? (
                      <div className="absolute left-3 top-3 flex flex-col gap-1 items-start">
                        <span className="rounded-full bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                          Sắp trống
                        </span>
                        {apartment.available_from && (
                          <span className="rounded-md bg-black/70 backdrop-blur-xs px-2 py-0.5 text-[10px] font-medium text-white shadow-sm">
                            Trống từ: {new Date(apartment.available_from).toLocaleDateString("vi-VN")}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="absolute left-3 top-3 rounded-full bg-success-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                        Còn trống
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-gray-800 group-hover:text-primary-600">
                      {formatApartmentDisplay(apartment.room_number, apartment.floor, "ADMIN", building?.branch_name)}
                    </h3>
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-400">
                      <MapPin size={12} /><span>{building?.address}</span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-gray-500">{apartment.description}</p>
                    <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500"><Maximize2 size={12} /><span>{apartment.area} m²</span></div>
                      <span className="text-lg font-bold text-primary-600">{formatCurrency(apartment.rental_price)}/tháng</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
