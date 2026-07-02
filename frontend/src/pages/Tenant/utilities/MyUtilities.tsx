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
    queryFn: () => tenantService.getAllTenants({ limit: 1000 }),
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
    queryFn: () => apartmentService.getAllApartments({ limit: 1000 }),
    enabled: !!activeContract,
  });
  const apartment = activeContract && apartmentsRes?.data
    ? apartmentsRes.data.find((a) => a.id === activeContract.apartment_id)
    : null;

  const { data: readingsRes, isLoading: loadingReadings } = useQuery({
    queryKey: ["utilityReadings", activeContract?.apartment_id],
    queryFn: () => utilityService.getAllUtilityReadings({ apartment_id: activeContract?.apartment_id, limit: 1000 }),
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

      {/* History table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
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

            {sortedReadings.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="h-40 text-center text-gray-400 font-medium">
                  <Receipt className="mx-auto mb-2 text-gray-300" size={36} />
                  Chưa có lịch sử ghi nhận điện nước cho căn hộ này.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
