import { useState, useEffect } from "react";
import {
  Home as HomeIcon, FileText, Receipt, Bell, MapPin, Maximize2,
  Calendar, CreditCard, ArrowUpRight, Wrench, Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../../stores/auth.store";
import * as tenantService from "../../../services/tenantService";
import * as contractService from "../../../services/contractService";
import * as apartmentService from "../../../services/apartmentService";
import * as buildingService from "../../../services/buildingService";
import { formatCurrency, formatDate } from "../../../utils/format";

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
  } catch (e) {
    return null;
  }
}

export default function TenantHome() {
  const { email, token } = useAuthStore();
  const displayName = email?.split("@")[0] || "Bạn";

  const [contract, setContract] = useState<any | null>(null);
  const [apartment, setApartment] = useState<any | null>(null);
  const [building, setBuilding] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !email) {
      setLoading(false);
      return;
    }

    async function loadHomeData() {
      try {
        const decoded = token ? parseJwt(token) : null;
        const userId = decoded?.userId;
        if (!userId) {
          setLoading(false);
          return;
        }

        const tenantsRes = await tenantService.getAllTenants({ limit: 1000 });
        const currentT = tenantsRes.data.find((t) => t.user_id === userId);
        if (!currentT) {
          setLoading(false);
          return;
        }

        const contracts = await contractService.getAllContracts();
        const activeContract = contracts.find(
          (c) => c.tenant_id === currentT.id && c.status === "ACTIVE"
        );

        if (activeContract) {
          setContract(activeContract);

          const apartmentsRes = await apartmentService.getAllApartments({ limit: 1000 });
          const apt = apartmentsRes.data.find((a) => a.id === activeContract.apartment_id);
          if (apt) {
            setApartment(apt);

            const buildingsRes = await buildingService.getAllBuildings({ limit: 100 });
            const bld = buildingsRes.data.find((b) => b.id === apt.building_id);
            if (bld) {
              setBuilding(bld);
            }
          }
        }
      } catch (err) {
        console.error("Error loading home page data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadHomeData();
  }, [email, token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  // Calculate remaining days
  const daysUntilExpiry = contract?.end_date
    ? Math.ceil((new Date(contract.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="space-y-6 font-sans">
      <div className="rounded-lg p-6 text-white"
        style={{ background: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 50%, #5B21B6 100%)" }}>
        <h1 className="text-2xl font-bold mb-1">Xin chào, {displayName}!</h1>
        <p className="text-purple-200 text-sm">Chào mừng bạn quay trở lại YuKi House</p>
      </div>

      {/* APARTMENT INFO */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        {contract ? (
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)" }}>
              <HomeIcon size={28} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">Căn hộ của bạn</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-semibold text-primary-600">
                      P.{apartment?.room_number || "-"} Tầng {apartment?.floor || "-"}
                    </span>
                    {" "}- {apartment?.description || "Căn hộ của bạn"}
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-success-50 text-success-600 font-semibold">
                  Đang thuê
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin size={15} className="text-gray-400 shrink-0" />
                  <span className="truncate">{building?.branch_name || building?.name || "Yuki House"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Maximize2 size={15} className="text-gray-400 shrink-0" />
                  <span>{apartment?.area || "-"} m² · Tầng {apartment?.floor || "-"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CreditCard size={15} className="text-gray-400 shrink-0" />
                  <span>{formatCurrency(contract.monthly_rent || apartment?.rental_price || 0)}/tháng</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar size={15} className="text-gray-400 shrink-0" />
                  <span>{daysUntilExpiry > 0 ? `Còn ${daysUntilExpiry} ngày` : "Đã hết hạn"}</span>
                </div>
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

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Hóa đơn tháng này */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-warning-50 rounded-lg flex items-center justify-center">
                <Receipt size={20} className="text-warning-600" />
              </div>
              <h4 className="font-semibold text-gray-800">Hóa đơn mới nhất</h4>
            </div>
            <Link to="/tenant/invoices" className="text-primary-600 hover:text-primary-700">
              <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center py-6 text-gray-450 border-t border-gray-100">
            <Receipt size={32} className="text-gray-300 mb-2" />
            <p className="text-xs">Chưa có hóa đơn nào cần thanh toán</p>
          </div>
        </div>

        {/* Hợp đồng */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success-50 rounded-lg flex items-center justify-center">
                <FileText size={20} className="text-success-600" />
              </div>
              <h4 className="font-semibold text-gray-800">Hợp đồng</h4>
            </div>
            <Link to="/tenant/contracts" className="text-primary-600 hover:text-primary-700">
              <ArrowUpRight size={16} />
            </Link>
          </div>

          {contract ? (
            <div className="space-y-3 pt-3 border-t border-gray-100 flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-success-50 text-success-600 font-semibold">
                  Hiệu lực
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Thời hạn</p>
                <p className="text-xs text-gray-700 font-medium">
                  {formatDate(contract.start_date)} → {formatDate(contract.end_date)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Tiền thuê hàng tháng</p>
                <p className="text-sm font-semibold text-gray-800">{formatCurrency(contract.monthly_rent)}</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center py-6 text-gray-450 border-t border-gray-100">
              <FileText size={32} className="text-gray-300 mb-2" />
              <p className="text-xs">Chưa có hợp đồng nào hoạt động</p>
            </div>
          )}
        </div>

        {/* Thông báo */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-info-50 rounded-lg flex items-center justify-center">
                <Bell size={20} className="text-info-600" />
              </div>
              <h4 className="font-semibold text-gray-800">Thông báo mới</h4>
            </div>
            <Link to="/tenant/notifications" className="text-primary-600 hover:text-primary-700">
              <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center py-6 text-gray-450 border-t border-gray-100">
            <Bell size={32} className="text-gray-300 mb-2" />
            <p className="text-xs">Chưa có thông báo mới nào</p>
          </div>
        </div>
      </div>

      {/* YÊU CẦU SỬA CHỮA GẦN ĐÂY */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-danger-50 rounded-lg flex items-center justify-center">
              <Wrench size={20} className="text-danger-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">Yêu cầu sửa chữa</h4>
              <p className="text-xs text-gray-400">Gần đây</p>
            </div>
          </div>
          <Link to="/tenant/maintenance"
            className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            Xem tất cả <ArrowUpRight size={12} />
          </Link>
        </div>

        <div className="text-center py-6 text-gray-400 border-t border-gray-100">
          <Wrench size={28} className="mx-auto mb-2 text-gray-200" />
          <p className="text-xs">Không có yêu cầu sửa chữa nào gần đây</p>
        </div>
      </div>
    </div>
  );
}
