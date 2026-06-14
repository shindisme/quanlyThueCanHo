import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Maximize2, DollarSign, FileText, Pencil, Home } from "lucide-react";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { mockApartments } from "../../data/apartments";
import { mockBuildings } from "../../data/buildings";
import { mockContracts } from "../../data/contracts";
import { mockTenants } from "../../data/tenants";
import { APARTMENT_STATUS_LABELS, APARTMENT_STATUS_COLORS, CONTRACT_STATUS_LABELS } from "../../constants/enums";
import { formatCurrency, formatDate } from "../../utils/format";

// Trang chi tiet can ho - hien thi thong tin, hop dong hien tai
export default function ApartmentDetail() {
  const { id } = useParams();
  const apartment = mockApartments.find((a) => a.id === Number(id));
  const building = apartment ? mockBuildings.find((b) => b.id === apartment.building_id) : null;

  if (!apartment || !building) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">Khong tim thay can ho</p>
        <Link to="/admin/apartments" className="text-primary-600 hover:underline text-sm">
          Quay lai danh sach
        </Link>
      </div>
    );
  }

  // Hop dong hien tai cua can ho
  const activeContract = mockContracts.find(
    (c) => c.apartment_id === apartment.id && c.status === "ACTIVE"
  );
  const tenant = activeContract
    ? mockTenants.find((t) => t.id === activeContract.tenant_id)
    : null;

  // Lich su hop dong
  const contractHistory = mockContracts.filter((c) => c.apartment_id === apartment.id);

  return (
    <div className="space-y-6">
      {/* Quay lai */}
      <Link
        to="/admin/apartments"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft size={16} /> Quay lai danh sach can ho
      </Link>

      {/* Thong tin chinh */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Hinh anh */}
        <div className="w-full lg:w-96 h-64 bg-gray-100 rounded-2xl flex items-center justify-center shrink-0">
          <Home size={48} className="text-gray-300" />
        </div>

        {/* Chi tiet */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {apartment.apartment_code} - {apartment.title}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={APARTMENT_STATUS_COLORS[apartment.status] as "success" | "info" | "warning"}>
                  {APARTMENT_STATUS_LABELS[apartment.status]}
                </Badge>
                <span className="text-sm text-gray-400">{building.name}</span>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Pencil size={14} /> Chinh sua
            </Button>
          </div>

          <div className="space-y-2 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-gray-400" />
              <span>{building.address}</span>
            </div>
          </div>

          <p className="text-2xl font-bold text-primary-600 mb-4">
            {formatCurrency(apartment.rental_price)}
            <span className="text-sm text-gray-400 font-normal">/thang</span>
          </p>

          {/* Thong so */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <Maximize2 size={18} className="text-primary-600 mx-auto mb-1" />
              <p className="text-sm font-semibold text-gray-800">{apartment.area} m2</p>
              <p className="text-xs text-gray-400">Dien tich</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <DollarSign size={18} className="text-success-600 mx-auto mb-1" />
              <p className="text-sm font-semibold text-gray-800">{formatCurrency(apartment.rental_price)}</p>
              <p className="text-xs text-gray-400">Gia thue</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <FileText size={18} className="text-info-600 mx-auto mb-1" />
              <p className="text-sm font-semibold text-gray-800">{contractHistory.length}</p>
              <p className="text-xs text-gray-400">Hop dong</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mo ta */}
      {apartment.description && (
        <Card>
          <h3 className="font-semibold text-gray-800 mb-2">Mo ta</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{apartment.description}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nguoi thue hien tai */}
        <Card>
          <h3 className="font-semibold text-gray-800 mb-4">Nguoi thue hien tai</h3>
          {tenant ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-medium">
                  {tenant.full_name.split(" ").pop()?.[0]}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{tenant.full_name}</p>
                  <p className="text-xs text-gray-400">CCCD: {tenant.citizen_id}</p>
                </div>
              </div>
              {activeContract && (
                <div className="bg-gray-50 rounded-xl p-3 space-y-1">
                  <p className="text-sm text-gray-600">
                    Hop dong: {formatDate(activeContract.start_date)} - {formatDate(activeContract.end_date)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Tien thue: {formatCurrency(activeContract.monthly_rent)}/thang
                  </p>
                  <p className="text-sm text-gray-600">
                    Tien coc: {formatCurrency(activeContract.deposit_amount)}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Can ho hien dang trong</p>
          )}
        </Card>

        {/* Lich su hop dong */}
        <Card>
          <h3 className="font-semibold text-gray-800 mb-4">Lich su hop dong</h3>
          {contractHistory.length > 0 ? (
            <div className="space-y-3">
              {contractHistory.map((c) => {
                const t = mockTenants.find((t) => t.id === c.tenant_id);
                return (
                  <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{t?.full_name}</p>
                      <p className="text-xs text-gray-400">
                        {formatDate(c.start_date)} - {formatDate(c.end_date)}
                      </p>
                    </div>
                    <Badge variant={c.status === "ACTIVE" ? "success" : "gray"}>
                      {CONTRACT_STATUS_LABELS[c.status as "ACTIVE" | "ENDED" | "LIQUIDATED"]}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Chua co hop dong nao</p>
          )}
        </Card>
      </div>
    </div>
  );
}
