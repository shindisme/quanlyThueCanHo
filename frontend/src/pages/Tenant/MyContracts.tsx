import Card from "../../components/common/ui/Card";
import Badge from "../../components/common/ui/Badge";
import { useAuthStore } from "../../stores/auth.store";
import { mockContracts } from "../../data/contracts";
import { mockApartments } from "../../data/apartments";
import { mockBuildings } from "../../data/buildings";
import { CONTRACT_STATUS_LABELS, CONTRACT_STATUS_COLORS } from "../../constants/enums";
import { formatCurrency, formatDate } from "../../utils/format";
import type { ContractStatus } from "../../constants/enums";
import { FileText, Calendar, DollarSign, Download } from "lucide-react";
import Button from "../../components/common/ui/Button";

// Trang hop dong cua nguoi thue
// Hien thi hop dong dang hieu luc va lich su hop dong
export default function TenantContracts() {
  const { user } = useAuthStore();
  const tenantId = user?.id ? user.id - 3 : 1;

  // Lay hop dong cua nguoi thue
  const contracts = mockContracts.filter((c) => c.tenant_id === tenantId);
  const activeContract = contracts.find((c) => c.status === "ACTIVE");

  function getApartmentInfo(aptId: number) {
    const apt = mockApartments.find((a) => a.id === aptId);
    const building = apt ? mockBuildings.find((b) => b.id === apt.building_id) : null;
    return { apt, building };
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Hop dong cua toi</h1>
        <p className="text-sm text-gray-500">Xem thong tin hop dong thue can ho</p>
      </div>

      {/* Hop dong dang hieu luc */}
      {activeContract && (
        <Card className="border-l-4 border-l-success-500">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={20} className="text-success-600" />
            <h3 className="font-semibold text-gray-800">Hop dong hien tai</h3>
            <Badge variant="success">Dang hieu luc</Badge>
          </div>

          {(() => {
            const { apt, building } = getApartmentInfo(activeContract.apartment_id);
            return (
              <div className="space-y-4">
                {/* Thong tin can ho */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm font-medium text-gray-800 mb-1">
                    {apt?.apartment_code} - {apt?.title}
                  </p>
                  <p className="text-xs text-gray-500">{building?.name} - {building?.address}</p>
                </div>

                {/* Chi tiet hop dong */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                      <Calendar size={18} className="text-primary-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Thoi han</p>
                      <p className="text-sm font-medium text-gray-800">
                        {formatDate(activeContract.start_date)} - {formatDate(activeContract.end_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-success-50 rounded-xl flex items-center justify-center">
                      <DollarSign size={18} className="text-success-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Tien thue/thang</p>
                      <p className="text-sm font-medium text-gray-800">
                        {formatCurrency(activeContract.monthly_rent)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-warning-50 rounded-xl flex items-center justify-center">
                      <DollarSign size={18} className="text-warning-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Tien coc</p>
                      <p className="text-sm font-medium text-gray-800">
                        {formatCurrency(activeContract.deposit_amount)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Nut tai file */}
                <Button variant="outline" size="sm">
                  <Download size={14} /> Tai file hop dong
                </Button>
              </div>
            );
          })()}
        </Card>
      )}

      {/* Lich su hop dong */}
      {contracts.length > 1 && (
        <Card>
          <h3 className="font-semibold text-gray-800 mb-4">Lich su hop dong</h3>
          <div className="space-y-3">
            {contracts
              .filter((c) => c.id !== activeContract?.id)
              .map((c) => {
                const { apt } = getApartmentInfo(c.apartment_id);
                return (
                  <div key={c.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{apt?.apartment_code} - {apt?.title}</p>
                      <p className="text-xs text-gray-400">
                        {formatDate(c.start_date)} - {formatDate(c.end_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-800">{formatCurrency(c.monthly_rent)}</p>
                      <Badge variant={CONTRACT_STATUS_COLORS[c.status as ContractStatus] as "success" | "gray" | "danger"}>
                        {CONTRACT_STATUS_LABELS[c.status as ContractStatus]}
                      </Badge>
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      )}

      {contracts.length === 0 && (
        <Card>
          <p className="text-center text-gray-400 py-8">Ban chua co hop dong nao</p>
        </Card>
      )}
    </div>
  );
}
