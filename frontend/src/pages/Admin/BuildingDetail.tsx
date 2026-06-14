import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Layers, Building2, Home, Pencil } from "lucide-react";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { mockBuildings } from "../../data/buildings";
import { mockApartments } from "../../data/apartments";
import { mockUsers } from "../../data/users";
import { APARTMENT_STATUS_LABELS, APARTMENT_STATUS_COLORS } from "../../constants/enums";
import { formatCurrency } from "../../utils/format";

// Trang chi tiet toa nha - hien thi thong tin toa nha va danh sach can ho
export default function BuildingDetail() {
  const { id } = useParams();
  const building = mockBuildings.find((b) => b.id === Number(id));

  if (!building) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">Khong tim thay toa nha</p>
        <Link to="/admin/buildings" className="text-primary-600 hover:underline text-sm">
          Quay lai danh sach
        </Link>
      </div>
    );
  }

  // Lay can ho thuoc toa nha
  const apartments = mockApartments.filter((a) => a.building_id === building.id);
  const rentedCount = apartments.filter((a) => a.status === "RENTED").length;
  const availableCount = apartments.filter((a) => a.status === "AVAILABLE").length;
  const occupancyRate = apartments.length > 0 ? Math.round((rentedCount / apartments.length) * 100) : 0;

  // Tim quan ly toa nha
  const manager = mockUsers.find((u) => u.managedBuildingId === building.id);

  return (
    <div className="space-y-6">
      {/* Quay lai */}
      <Link
        to="/admin/buildings"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft size={16} /> Quay lai danh sach toa nha
      </Link>

      {/* Thong tin chinh */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Hinh anh toa nha */}
        <div className="w-full lg:w-80 h-56 bg-gray-100 rounded-2xl flex items-center justify-center flex-shrink-0">
          <Building2 size={48} className="text-gray-300" />
        </div>

        {/* Chi tiet */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{building.name}</h1>
              <Badge variant="info" className="mt-1">{building.branchName}</Badge>
            </div>
            <Button variant="outline" size="sm">
              <Pencil size={14} /> Chinh sua
            </Button>
          </div>

          <div className="space-y-2 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-gray-400 flex-shrink-0" />
              <span>{building.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-gray-400 flex-shrink-0" />
              <span>{building.totalFloors} tang</span>
            </div>
          </div>

          {building.description && (
            <p className="text-sm text-gray-500 leading-relaxed">{building.description}</p>
          )}

          {/* Thong ke nhanh - 12 cột */}
          <div className="grid grid-cols-12 gap-4 mt-6">
            <div className="col-span-6 md:col-span-3 bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-gray-800">{apartments.length}</p>
              <p className="text-xs text-gray-400">Tong can ho</p>
            </div>
            <div className="col-span-6 md:col-span-3 bg-success-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-success-600">{rentedCount}</p>
              <p className="text-xs text-gray-400">Dang thue</p>
            </div>
            <div className="col-span-6 md:col-span-3 bg-warning-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-warning-600">{availableCount}</p>
              <p className="text-xs text-gray-400">Con trong</p>
            </div>
            <div className="col-span-6 md:col-span-3 bg-primary-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-primary-600">{occupancyRate}%</p>
              <p className="text-xs text-gray-400">Lap day</p>
            </div>
          </div>
        </div>
      </div>

      {/* Thong tin quan ly */}
      {manager && (
        <Card>
          <h3 className="font-semibold text-gray-800 mb-3">Quan ly toa nha</h3>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-medium text-sm">
              {manager.email[0].toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">{manager.email}</p>
              <p className="text-xs text-gray-400">{manager.phone}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Danh sach can ho */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Danh sach can ho ({apartments.length})
        </h3>
        <div className="grid grid-cols-12 gap-6">
          {apartments.map((apt) => (
            <Link
              key={apt.id}
              to={`/admin/apartments/${apt.id}`}
              className="col-span-12 sm:col-span-6 lg:col-span-4 xl:col-span-3 block"
            >
              <Card className="hover:shadow-card-hover transition-shadow cursor-pointer h-full">
                <div className="w-full h-28 bg-gray-100 rounded-xl mb-3 flex items-center justify-center">
                  <Home size={24} className="text-gray-300" />
                </div>
                <div className="flex items-start justify-between mb-1">
                  <p className="font-semibold text-gray-800 text-sm">{apt.apartment_code}</p>
                  <Badge variant={APARTMENT_STATUS_COLORS[apt.status] as "success" | "info" | "warning"}>
                    {APARTMENT_STATUS_LABELS[apt.status]}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mb-2">{apt.title}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{apt.area} m2</span>
                  <span className="font-semibold text-primary-600">{formatCurrency(apt.rental_price)}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
