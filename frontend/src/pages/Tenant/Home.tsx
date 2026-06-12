import { Home, FileText, Receipt, CreditCard, Wrench, Bell } from "lucide-react";
import Card from "../../components/common/ui/Card";
import Badge from "../../components/common/ui/Badge";
import { useAuthStore } from "../../stores/auth.store";
import { mockContracts } from "../../data/contracts";
import { mockInvoices } from "../../data/invoices";
import { mockApartments } from "../../data/apartments";
import { mockBuildings } from "../../data/buildings";
import { mockNotifications } from "../../data/notifications";
import { formatCurrency, formatDate } from "../../utils/format";
import {
  INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS,
  CONTRACT_STATUS_LABELS, CONTRACT_STATUS_COLORS,
} from "../../constants/enums";
import type { InvoiceStatus, ContractStatus } from "../../constants/enums";

// Trang chu cua Tenant
// Hien thi thong tin can ho, hoa don thang nay, hop dong, thong bao moi
export default function TenantHome() {
  const { user } = useAuthStore();

  // Tim tenant_id tu user_id trong mock data
  // Gia lap: user_id 4 => tenant_id 1
  const tenantId = user?.id ? user.id - 3 : 1;

  // Lay hop dong dang hieu luc cua nguoi thue
  const activeContract = mockContracts.find(
    (c) => c.tenant_id === tenantId && c.status === "ACTIVE"
  );

  // Lay thong tin can ho
  const apartment = activeContract
    ? mockApartments.find((a) => a.id === activeContract.apartment_id)
    : null;

  const building = apartment
    ? mockBuildings.find((b) => b.id === apartment.building_id)
    : null;

  // Lay hoa don thang nay (chua thanh toan)
  const currentInvoice = mockInvoices.find(
    (inv) => inv.tenant_id === tenantId && inv.status === "UNPAID"
  );

  // Lay thong bao cua user
  const notifications = mockNotifications
    .filter((n) => n.user_id === user?.id)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Xin chao!</h1>
        <p className="text-sm text-gray-500">Chao mung ban quay tro lai DuKiHome</p>
      </div>

      {/* Thong tin can ho */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Home size={28} className="text-primary-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 text-lg">Can ho cua ban</h3>
            {apartment ? (
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{apartment.apartment_code}</span> - {apartment.title}
                </p>
                <p className="text-sm text-gray-500">{building?.name} - {building?.address}</p>
                <p className="text-sm text-gray-500">Dien tich: {apartment.area} m2</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 mt-1">Chua co thong tin can ho</p>
            )}
          </div>
        </div>
      </Card>

      {/* Cards thong tin nhanh */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Hoa don thang nay */}
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-warning-50 rounded-xl flex items-center justify-center">
              <Receipt size={20} className="text-warning-600" />
            </div>
            <h4 className="font-semibold text-gray-800">Hoa don thang nay</h4>
          </div>
          {currentInvoice ? (
            <div>
              <p className="text-2xl font-bold text-gray-800 mb-1">
                {formatCurrency(currentInvoice.total_amount)}
              </p>
              <div className="flex items-center gap-2">
                <Badge variant={INVOICE_STATUS_COLORS[currentInvoice.status as InvoiceStatus] as "success" | "warning" | "danger"}>
                  {INVOICE_STATUS_LABELS[currentInvoice.status as InvoiceStatus]}
                </Badge>
                <span className="text-xs text-gray-400">Han: {formatDate(currentInvoice.due_date)}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Khong co hoa don</p>
          )}
        </Card>

        {/* Hop dong */}
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-success-50 rounded-xl flex items-center justify-center">
              <FileText size={20} className="text-success-600" />
            </div>
            <h4 className="font-semibold text-gray-800">Hop dong</h4>
          </div>
          {activeContract ? (
            <div>
              <Badge variant={CONTRACT_STATUS_COLORS[activeContract.status as ContractStatus] as "success" | "gray" | "danger"}>
                {CONTRACT_STATUS_LABELS[activeContract.status as ContractStatus]}
              </Badge>
              <p className="text-sm text-gray-600 mt-2">
                {formatDate(activeContract.start_date)} - {formatDate(activeContract.end_date)}
              </p>
              <p className="text-sm text-gray-500">
                Tien thue: {formatCurrency(activeContract.monthly_rent)}/thang
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Chua co hop dong</p>
          )}
        </Card>

        {/* Thong bao moi */}
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-info-50 rounded-xl flex items-center justify-center">
              <Bell size={20} className="text-info-600" />
            </div>
            <h4 className="font-semibold text-gray-800">Thong bao moi</h4>
          </div>
          {notifications.length > 0 ? (
            <div className="space-y-2">
              {notifications.map((n) => (
                <div key={n.id} className="text-sm">
                  <p className={`${n.is_read ? "text-gray-500" : "text-gray-800 font-medium"}`}>
                    {n.title}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Khong co thong bao moi</p>
          )}
        </Card>
      </div>
    </div>
  );
}
