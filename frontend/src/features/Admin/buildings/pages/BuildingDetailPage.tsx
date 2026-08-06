import { Link } from "react-router-dom";
import { ArrowLeft, MapPin, Layers, Building2, Home, Pencil, BedDouble, Bath, User, Plus } from "lucide-react";
import Badge from "../../../../components/ui/Badge";
import Button from "../../../../components/ui/Button";
import Card from "../../../../components/ui/Card";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";

import BuildingModifyModal from "../components/BuildingModifyModal";
import ApartmentCreateModal from "../../apartments/components/ApartmentCreateModal";
import { formatApartmentDisplay } from "../../../../utils/string";
import { formatCurrency } from "../../../../utils/currency";
import { getApartmentThumbnail } from "../../../../utils/file";
import { APARTMENT_STATUS_CONFIG, BUILDING_STATUS_CONFIG } from "../../../../constants/badges";
import type { ApartmentStatus, BuildingStatus } from "../../../../constants/enums";
import { useBuildingDetail } from "../hooks/useBuildingDetail";
import { cn } from "../../../../lib/utils";

export default function BuildingDetailPage() {
  const {
    role,
    canEdit,
    baseRoute,
    building,
    apartments,
    selectedFloorApartments,
    floorApartmentsMap,
    floors,
    statistics,
    loading,
    isError,
    showModifyModal,
    setShowModifyModal,
    showCreateApartmentModal,
    setShowCreateApartmentModal,
    selectedFloor,
    setSelectedFloor,
    refetch,
  } = useBuildingDetail();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100">
        <LoadingSpinner size={36} />
        <span className="text-sm text-gray-400 mt-2 font-sans">Đang tải chi tiết tòa nhà...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 mb-4 font-medium">Đã xảy ra lỗi khi tải dữ liệu tòa nhà</p>
        <div className="flex justify-center gap-3">
          <Button variant="outline" size="sm" onClick={refetch}>
            Thử lại
          </Button>
          <Link to="/admin/buildings" className="text-primary-600 hover:underline text-sm flex items-center">
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  if (!building) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">Không tìm thấy tòa nhà</p>
        <Link to="/admin/buildings" className="text-primary-600 hover:underline text-sm">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to={role === "MANAGER" ? "/manager/buildings" : "/admin/buildings"}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft size={16} /> Quay lại danh sách tòa nhà
      </Link>

      {/* Thông tin chính */}
      <div className="flex flex-col lg:flex-row gap-6">
        {building.thumbnail_url ? (
          <img src={building.thumbnail_url} className="w-full lg:w-80 h-56 rounded-2xl object-cover shrink-0" alt="" />
        ) : (
          <div className="w-full lg:w-80 h-56 bg-gray-100 rounded-2xl flex items-center justify-center shrink-0">
            <Building2 size={48} className="text-gray-300" />
          </div>
        )}

        <div className="flex-1">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {building.branch_name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                {(() => {
                  const config = BUILDING_STATUS_CONFIG[building.status as BuildingStatus];
                  return (
                    <Badge variant={config?.badge || "gray"}>
                      {config?.label || building.status}
                    </Badge>
                  );
                })()}
              </div>
            </div>
            {role === "ADMIN" && (
              <Button variant="outline" size="sm" onClick={() => setShowModifyModal(true)}>
                <Pencil size={14} /> Chỉnh sửa
              </Button>
            )}
          </div>

          <div className="space-y-2 text-sm text-gray-600 mb-4">
            <div className="flex items-start gap-2">
              <MapPin size={16} className="text-gray-400 shrink-0 mt-0.5" />
              <span>Địa chỉ: <strong>{building.address}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-gray-400 shrink-0" />
              <span>Số tầng: <strong>{building.total_floors} tầng</strong></span>
            </div>
            {building.manager && (
              <div className="flex items-center gap-2">
                <User size={16} className="text-gray-400 shrink-0" />
                <span>Quản lý bởi: <strong className="text-primary-600">{building.manager.fullName || building.manager.username}</strong></span>
              </div>
            )}
          </div>

          {building.description && (
            <p className="text-sm text-gray-500 leading-relaxed">{building.description}</p>
          )}

          {/* Thống kê */}
          <div className="grid grid-cols-12 gap-4 mt-6">
            <div className="col-span-6 md:col-span-3 bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-gray-800">{statistics.total}</p>
              <p className="text-xs text-gray-400">Tổng căn hộ</p>
            </div>
            <div className="col-span-6 md:col-span-3 bg-success-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-success-600">{statistics.rentedCount}</p>
              <p className="text-xs text-gray-400">Đang thuê</p>
            </div>
            <div className="col-span-6 md:col-span-3 bg-warning-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-warning-600">{statistics.availableCount}</p>
              <p className="text-xs text-gray-400">Còn trống</p>
            </div>
            <div className="col-span-6 md:col-span-3 bg-primary-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-primary-600">{statistics.occupancyRate}%</p>
              <p className="text-xs text-gray-400">Đã cho thuê</p>
            </div>
          </div>
        </div>
      </div>

      {/* Danh sách căn hộ */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Danh sách căn hộ - Tầng {selectedFloor} ({selectedFloorApartments.length})
            </h3>
            <span className="text-xs text-gray-500 font-medium">Tổng số căn hộ tòa nhà: {apartments.length}</span>
          </div>
        </div>

        {/* Bộ lọc tầng */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 mb-6">
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2">
            {floors.map((floor) => {
              const floorAptsCount = (floorApartmentsMap[floor] || []).length;
              const isSelected = selectedFloor === floor;
              return (
                <button
                  key={floor}
                  type="button"
                  onClick={() => setSelectedFloor(floor)}
                  className={cn(
                    "min-w-31.25 text-center px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer",
                    isSelected
                      ? "bg-primary-600 text-white shadow-sm"
                      : "bg-gray-50 text-gray-650 hover:bg-gray-100 border border-gray-200"
                  )}
                >
                  Tầng {floor} ({floorAptsCount})
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {selectedFloorApartments.map((apt) => {
            const thumbnail = getApartmentThumbnail(apt);
            const statusConfig = APARTMENT_STATUS_CONFIG[apt.status as ApartmentStatus] || {
              label: apt.status,
              badge: "gray",
            };

            return (
              <Link
                key={apt.id}
                to={`${baseRoute}/apartments/${apt.id}`}
                className="col-span-12 sm:col-span-6 lg:col-span-4 xl:col-span-3 block"
              >
                <Card className="hover:shadow-card-hover transition-shadow cursor-pointer h-full">
                  {thumbnail ? (
                    <img src={thumbnail} className="w-full h-28 rounded-xl mb-3 object-cover" alt="" />
                  ) : (
                    <div className="w-full h-28 bg-gray-100 rounded-xl mb-3 flex items-center justify-center">
                      <Home size={24} className="text-gray-300" />
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-semibold text-gray-800 text-sm">
                      {formatApartmentDisplay(apt.room_number, apt.floor)}
                    </p>
                    <Badge variant={statusConfig.badge}>{statusConfig.label}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                    <span>{apt.area} m²</span>
                    <span className="flex items-center gap-0.5"><BedDouble size={12} /> {apt.bedrooms}</span>
                    <span className="flex items-center gap-0.5"><Bath size={12} /> {apt.bathrooms}</span>
                  </div>
                  <p className="font-semibold text-primary-600 text-sm">{formatCurrency(Number(apt.rental_price))}</p>
                </Card>
              </Link>
            );
          })}
          {selectedFloorApartments.length === 0 && (
            <div className="col-span-12 text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-200 flex flex-col items-center justify-center">
              <Home size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="font-medium text-gray-700 mb-1">Tầng {selectedFloor} chưa có căn hộ nào</p>
              <p className="text-sm text-gray-400 mb-4">Bạn có thể tạo nhanh căn hộ trực tiếp cho tầng này</p>
              {canEdit && (
                <Button size="sm" onClick={() => setShowCreateApartmentModal(true)}>
                  <Plus size={16} /> Thêm nhanh căn hộ tầng {selectedFloor}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal chỉnh sửa */}
      <BuildingModifyModal
        isOpen={showModifyModal}
        onClose={() => setShowModifyModal(false)}
        onSuccess={refetch}
        editItem={building}
      />

      {building && (
        <ApartmentCreateModal
          isOpen={showCreateApartmentModal}
          onClose={() => setShowCreateApartmentModal(false)}
          onSuccess={refetch}
          buildings={[building]}
          role={role}
          defaultBuildingId={building.id}
          defaultFloor={selectedFloor}
        />
      )}
    </div>
  );
}
