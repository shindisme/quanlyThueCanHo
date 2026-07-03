import { Receipt, Zap, Droplet } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "../../../components/PageHeader";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import { useAuthStore } from "../../../stores/auth.store";
import * as tenantService from "../../../services/tenantService";
import * as contractService from "../../../services/contractService";
import * as apartmentService from "../../../services/apartmentService";
import * as utilityService from "../../../services/utilityService";
import { formatDate } from "../../../utils/date";
import { formatApartmentDisplay } from "../../../utils/string";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../../components/ui/Table";

function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export default function MyUtilities() {
  const { token } = useAuthStore();

  const decoded = token ? parseJwt(token) : null;
  const userId = decoded?.userId;

  const { data: tenantsRes, isLoading: loadingTenants } = useQuery({
    queryKey: ["tenants"],
    queryFn: () => tenantService.getAllTenants({ limit: 100 }),
    enabled: !!userId,
  });
  const currentTenant = userId && tenantsRes?.data
    ? tenantsRes.data.find((t) => t.user_id === userId)
    : null;

  const { data: contracts, isLoading: loadingContracts } = useQuery({
    queryKey: ["contracts"],
    queryFn: () => contractService.getAllContracts(),
    enabled: !!currentTenant,
  });
  const activeContract = currentTenant && contracts
    ? contracts.find((c) => c.tenant_id === currentTenant.id && c.status === "ACTIVE")
    : null;

  const { data: apartmentsRes, isLoading: loadingApartments } = useQuery({
    queryKey: ["apartments"],
    queryFn: () => apartmentService.getAllApartments({ limit: 100 }),
    enabled: !!activeContract,
  });
  const apartment = activeContract && apartmentsRes?.data
    ? apartmentsRes.data.find((a) => a.id === activeContract.apartment_id)
    : null;

  const { data: readingsRes, isLoading: loadingReadings } = useQuery({
    queryKey: ["utilityReadings", activeContract?.apartment_id],
    queryFn: () => utilityService.getAllUtilityReadings({ apartment_id: activeContract?.apartment_id, limit: 100 }),
    enabled: !!activeContract?.apartment_id,
  });
  const readings = readingsRes?.data || [];

  const loading = loadingTenants || loadingContracts || (!!activeContract && loadingApartments) || (!!activeContract?.apartment_id && loadingReadings);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner size={36} />
        <span className="text-sm text-gray-400 mt-2 font-sans">Đang tải lịch sử chỉ số điện nước...</span>
      </div>
    );
  }

  const sortedReadings = [...readings].sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return b.month - a.month;
  });

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        icon={Zap}
        title="Chỉ số điện nước"
        subtitle="Lịch sử ghi nhận điện nước của căn hộ bạn đang thuê"
        count={sortedReadings.length}
        iconColor="linear-gradient(135deg, #10B981, #34D399)"
      />

      {/* Apartment Header Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-bold text-gray-800 text-lg">
            {apartment ? formatApartmentDisplay(apartment.room_number, apartment.floor, "TENANT", apartment.building?.branch_name) : "Chưa nhận căn hộ"}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {apartment?.building?.address_new || "Hệ thống chung cư Yuki House"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-600 text-xs font-semibold">
            <Zap size={14} /> Điện sinh hoạt
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-semibold">
            <Droplet size={14} /> Nước sinh hoạt
          </div>
        </div>
      </div>

      {/* History list */}
      {sortedReadings.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white rounded-xl border border-gray-200">
          <Receipt className="mx-auto mb-3 text-gray-300" size={48} />
          <p className="font-medium">Chưa có lịch sử ghi nhận điện nước cho căn hộ này</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* View Card */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {sortedReadings.map((r) => {
              const eConsumption = r.electric_new - r.electric_old;
              const wConsumption = r.water_new - r.water_old;
              return (
                <div key={r.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <span className="font-bold text-gray-800 text-base">
                      Tháng {r.month}/{r.year}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(r.created_at)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {/* Cột Điện */}
                    <div className="bg-primary-50/20 p-2.5 rounded-lg border border-primary-100/50 space-y-1">
                      <div className="flex items-center gap-1 text-primary-700 font-semibold text-xs">
                        <Zap size={12} /> ĐIỆN (kWh)
                      </div>
                      <p className="text-xs text-gray-550">Mới: <span className="font-medium text-gray-800">{r.electric_new}</span></p>
                      <p className="text-xs text-gray-550">Cũ: <span className="font-medium text-gray-800">{r.electric_old}</span></p>
                      <p className="text-sm font-bold text-primary-600 pt-1 border-t border-primary-100/30">
                        Sử dụng: {eConsumption}
                      </p>
                    </div>

                    {/* Cột Nước */}
                    <div className="bg-emerald-50/20 p-2.5 rounded-lg border border-emerald-100/50 space-y-1">
                      <div className="flex items-center gap-1 text-emerald-700 font-semibold text-xs">
                        <Droplet size={12} /> NƯỚC (m³)
                      </div>
                      <p className="text-xs text-gray-550">Mới: <span className="font-medium text-gray-800">{r.water_new}</span></p>
                      <p className="text-xs text-gray-550">Cũ: <span className="font-medium text-gray-800">{r.water_old}</span></p>
                      <p className="text-sm font-bold text-emerald-600 pt-1 border-t border-emerald-100/30">
                        Sử dụng: {wConsumption}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-gray-405 pt-1 border-t border-gray-100 flex justify-between">
                    <span>Người ghi:</span>
                    <span className="font-medium text-gray-600">{r.staff?.full_name || "Quản trị viên"}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* View List */}
          <div className="hidden md:block border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/75 border-b border-gray-200">
                  <TableHead className="font-semibold text-gray-700 w-28">Kỳ thanh toán</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-center">Số điện cũ</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-center">Số điện mới</TableHead>
                  <TableHead className="font-semibold text-center text-primary-600">Tiêu thụ điện (kWh)</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-center">Số nước cũ</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-center">Số nước mới</TableHead>
                  <TableHead className="font-semibold text-center text-emerald-600">Tiêu thụ nước (m³)</TableHead>
                  <TableHead className="font-semibold text-gray-700">Ngày ghi nhận</TableHead>
                  <TableHead className="font-semibold text-gray-700">Người ghi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedReadings.map((r) => {
                  const eConsumption = r.electric_new - r.electric_old;
                  const wConsumption = r.water_new - r.water_old;

                  return (
                    <TableRow key={r.id} className="hover:bg-gray-50/50 border-b border-gray-150 transition-colors">
                      <TableCell className="font-medium text-gray-900">
                        Tháng {r.month}/{r.year}
                      </TableCell>
                      <TableCell className="text-center text-gray-600">{r.electric_old}</TableCell>
                      <TableCell className="text-center text-gray-600">{r.electric_new}</TableCell>
                      <TableCell className="text-center font-semibold text-primary-600 bg-primary-50/20">{eConsumption}</TableCell>
                      <TableCell className="text-center text-gray-600">{r.water_old}</TableCell>
                      <TableCell className="text-center text-gray-600">{r.water_new}</TableCell>
                      <TableCell className="text-center font-semibold text-emerald-600 bg-emerald-50/20">{wConsumption}</TableCell>
                      <TableCell className="text-gray-500">{formatDate(r.created_at)}</TableCell>
                      <TableCell className="text-gray-700 font-medium">
                        {r.staff?.full_name || "Quản trị viên"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
