import { useState } from "react";
import {
  Home, Users, Wrench, CalendarDays, Clock, AlertCircle, CheckCircle, XCircle, Play
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from "recharts";
import { useDashboardStaff } from "../hooks/useDashboardStaff";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import StatCard from "../../../Admin/dashboard/components/StatCard";
import ChartCard from "../../../Admin/dashboard/components/ChartCard";
import type { MaintenanceRequest } from "../../../../types";
import Badge from "../../../../components/ui/Badge";
import Combobox from "../../../../components/ui/Combobox";
import SearchInput from "../../../../components/ui/SearchInput";
import {
  PRIORITY_CONFIG,
  REQUEST_STATUS_CONFIG,
  type Priority,
  type RequestStatus,
  PRIORITY_OPTIONS,
} from "../../../../constants";
import { removeVietnameseTones } from "../../../../utils/string";

export default function DashboardStaff() {
  const {
    displayName,
    managedBuildingId,
    apartments,
    tenants,
    contracts,
    schedules,
    maintenanceRequests,
    isLoading,
    currentStaff,
    role,
    completeMutation,
    unableMutation,
  } = useDashboardStaff();

  const [statusTab, setStatusTab] = useState<string>("ALL");
  const [taskSearch, setTaskSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [taskSort, setTaskSort] = useState("CREATED_DESC");
  const [reportRequest, setReportRequest] = useState<MaintenanceRequest | null>(null);
  const [reportReason, setReportReason] = useState<string>("");

  const [completeRequest, setCompleteRequest] = useState<MaintenanceRequest | null>(null);
  const [chargeTenant, setChargeTenant] = useState<boolean>(false);
  const [repairFee, setRepairFee] = useState<string>("");

  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  // Filter apartments in staff's building
  const buildingApartments = managedBuildingId
    ? apartments.filter((a) => a.building_id === managedBuildingId)
    : apartments;

  const totalApartmentsCount = buildingApartments.length;

  const rentedCount = buildingApartments.filter((a) => a.status === "RENTED").length;
  const availableCount = buildingApartments.filter((a) => a.status === "AVAILABLE").length;
  const maintenanceCount = buildingApartments.filter((a) => a.status === "MAINTENANCE").length;

  // Filter active contracts
  const buildingContracts = contracts.filter((c) => {
    const isRoomInBuilding = buildingApartments.some((a) => a.id === c.apartment_id);
    return c.status === "ACTIVE" && isRoomInBuilding;
  });

  // Unique tenants in building
  const buildingTenantIds = new Set(buildingContracts.map((c) => c.tenant_id));
  const activeTenantsCount = managedBuildingId ? buildingTenantIds.size : tenants.length;

  // Expiring contracts within next 30 days
  const now = new Date();
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
  const expiringContractsCount = buildingContracts.filter((c) => {
    const endDate = new Date(c.end_date);
    return endDate >= now && endDate <= thirtyDaysLater;
  }).length;

  // Pending schedules in staff's building
  const pendingSchedulesCount = schedules.filter((s) => {
    const matchesBuilding = !managedBuildingId || s.apartment?.building_id === managedBuildingId;
    return s.status === "PENDING" && matchesBuilding;
  }).length;

  // Pending maintenance requests
  const pendingMaintenanceRequests = maintenanceRequests.filter(
    (r) => r.status === "PENDING" || r.status === "PROCESSING" || r.status === "NEEDS_RESCHEDULE"
  ).length;

  // Processing maintenance requests
  const processingMaintenanceRequests = maintenanceRequests.filter(
    (r) => r.status === "PROCESSING"
  ).length;

  const apartmentStatus = [
    { name: "Đang thuê", value: rentedCount, color: "#7C3AED" },
    { name: "Còn trống", value: availableCount, color: "#10B981" },
    { name: "Bảo trì", value: maintenanceCount, color: "#F59E0B" },
  ];

  const upcomingTasks = [
    { text: `Kiểm tra căn hộ sắp hết hạn (${expiringContractsCount} HĐ)`, time: "Tuần này", urgent: expiringContractsCount > 0 },
    { text: `Xử lý lịch hẹn xem phòng (${pendingSchedulesCount} lịch chờ)`, time: "Hôm nay", urgent: pendingSchedulesCount > 0 },
    { text: "Bảo trì định kỳ hệ thống điện nước hành lang", time: "Thứ 5", urgent: false },
    { text: "Ghi nhận chỉ số điện nước định kỳ cuối tháng", time: "Hàng tháng", urgent: false },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  const isTechnician = role === "STAFF" || currentStaff?.position === "Kỹ thuật";

  if (isTechnician) {
    const myTasks = role === "STAFF"
      ? maintenanceRequests
      : maintenanceRequests.filter(
        (r) => r.assigned_staff_id === currentStaff?.id || r.assigned_staff?.id === currentStaff?.id
      );

    const pendingMyTasks = myTasks.filter((r) => r.status === "PENDING").length;
    const processingMyTasks = myTasks.filter((r) => r.status === "PROCESSING").length;
    const doneMyTasks = myTasks.filter((r) => r.status === "DONE").length;

    const taskKeyword = removeVietnameseTones(taskSearch.trim().toLowerCase());
    const priorityRank: Record<Priority, number> = { LOW: 1, MEDIUM: 2, HIGH: 3 };
    const filteredMyTasks = myTasks
      .filter((task) => {
        const matchesStatus = statusTab === "ALL" ? task.status !== "CANCELLED" : task.status === statusTab;
        if (!matchesStatus || (priorityFilter && task.priority !== priorityFilter)) return false;
        if (!taskKeyword) return true;
        return removeVietnameseTones(
          [task.title, task.description, task.apartment?.room_number, task.apartment?.building?.branch_name]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
        ).includes(taskKeyword);
      })
      .sort((a, b) => {
        if (taskSort === "PRIORITY_DESC") return priorityRank[b.priority] - priorityRank[a.priority];
        if (taskSort === "SCHEDULED_ASC") {
          return new Date(a.scheduled_at || "9999-12-31").getTime() - new Date(b.scheduled_at || "9999-12-31").getTime();
        }
        if (taskSort === "ROOM_ASC") {
          return String(a.apartment?.room_number || "").localeCompare(String(b.apartment?.room_number || ""), undefined, { numeric: true });
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

    const getPriorityBadge = (priority: string) => {
      const config = PRIORITY_CONFIG[priority as Priority];
      return <Badge variant={config?.badge || "gray"}>{config?.label || priority}</Badge>;
    };

    const getStatusBadge = (status: string) => {
      const config = REQUEST_STATUS_CONFIG[status as RequestStatus];
      return <Badge variant={config?.badge || "gray"}>{config?.label || status}</Badge>;
    };

    return (
      <div className="space-y-6 font-sans">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{today}</p>
          <h1 className="text-2xl font-bold text-gray-800">
            Xin chào Kỹ thuật viên, <span className="text-primary-600">{displayName}</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Danh sách phân công sửa chữa & bảo trì sự cố</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <div className="bg-white border border-gray-200 p-5 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Tổng số công việc</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">{myTasks.length}</h3>
            </div>
            <div className="w-12 h-12 bg-purple-50 flex items-center justify-center">
              <Wrench size={22} className="text-purple-600" />
            </div>
          </div>
          <div className="bg-white border border-gray-200 p-5 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Chờ xử lý</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">{pendingMyTasks}</h3>
            </div>
            <div className="w-12 h-12 bg-amber-50 flex items-center justify-center">
              <Clock size={22} className="text-amber-600" />
            </div>
          </div>
          <div className="bg-white border border-gray-200 p-5 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Đang tiến hành</p>
              <h3 className="text-2xl font-bold text-blue-600 mt-1">{processingMyTasks}</h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 flex items-center justify-center">
              <Play size={22} className="text-blue-600" />
            </div>
          </div>
          <div className="bg-white border border-gray-200 p-5 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Đã hoàn thành</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{doneMyTasks}</h3>
            </div>
            <div className="w-12 h-12 bg-emerald-50 flex items-center justify-center">
              <CheckCircle size={22} className="text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Tabs & List */}
        <div className="bg-white border border-gray-200 shadow-lg p-6">
          <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            <SearchInput
              value={taskSearch}
              onChange={setTaskSearch}
              placeholder="Sự cố, phòng, chi nhánh..."
              className="w-full"
            />
            <Combobox
              options={PRIORITY_OPTIONS}
              value={priorityFilter}
              onChange={setPriorityFilter}
              placeholder="Độ ưu tiên"
              searchable={false}
              clearable
            />
            <Combobox
              options={[
                { value: "CREATED_DESC", label: "Mới gửi trước" },
                { value: "PRIORITY_DESC", label: "Ưu tiên cao trước" },
                { value: "SCHEDULED_ASC", label: "Lịch hẹn gần trước" },
                { value: "ROOM_ASC", label: "Phòng tăng dần" },
              ]}
              value={taskSort}
              onChange={setTaskSort}
              placeholder="Sắp xếp"
              searchable={false}
              clearable={false}
            />
          </div>
          <div className="flex border-b border-gray-200 gap-4 mb-6 overflow-x-auto">
            <button
              onClick={() => setStatusTab("ALL")}
              className={`pb-3 text-sm font-semibold border-b-2 px-2 transition-all cursor-pointer ${statusTab === "ALL" ? "border-primary-600 text-primary-600 font-bold" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              Tất cả ({myTasks.filter((t) => t.status !== "CANCELLED").length})
            </button>
            <button
              onClick={() => setStatusTab("PENDING")}
              className={`pb-3 text-sm font-semibold border-b-2 px-2 transition-all cursor-pointer ${statusTab === "PENDING" ? "border-amber-500 text-amber-500 font-bold" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              Chờ xử lý ({pendingMyTasks})
            </button>
            <button
              onClick={() => setStatusTab("PROCESSING")}
              className={`pb-3 text-sm font-semibold border-b-2 px-2 transition-all cursor-pointer ${statusTab === "PROCESSING" ? "border-blue-500 text-blue-500 font-bold" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              Đang sửa ({processingMyTasks})
            </button>
            <button
              onClick={() => setStatusTab("NEEDS_RESCHEDULE")}
              className={`pb-3 text-sm font-semibold border-b-2 px-2 transition-all cursor-pointer ${statusTab === "NEEDS_RESCHEDULE" ? "border-red-500 text-red-500 font-bold" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              Báo bận / Báo lại ({myTasks.filter((t) => t.status === "NEEDS_RESCHEDULE").length})
            </button>
            <button
              onClick={() => setStatusTab("DONE")}
              className={`pb-3 text-sm font-semibold border-b-2 px-2 transition-all cursor-pointer ${statusTab === "DONE" ? "border-emerald-500 text-emerald-500 font-bold" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              Hoàn thành ({doneMyTasks})
            </button>
          </div>

          {filteredMyTasks.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              Không có công việc nào thuộc danh mục này.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMyTasks.map((task) => {
                const roomStr = task.apartment ? `P.${task.apartment.room_number} (Tầng ${task.apartment.floor})` : `Phòng #${task.apartment_id}`;
                const buildingName = task.apartment?.building?.branch_name || "Chi nhánh hiện tại";
                const isMutating = completeMutation.isPending || unableMutation.isPending;

                return (
                  <div key={task.id} className="border border-gray-150 p-5 hover:border-gray-300 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/20">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-bold text-gray-800 text-base">{roomStr}</span>
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 font-semibold">{buildingName}</span>
                        {getPriorityBadge(task.priority)}
                        {getStatusBadge(task.status)}
                      </div>
                      <h4 className="font-bold text-gray-700 text-sm">{task.title}</h4>
                      <p className="text-xs text-gray-500 leading-relaxed max-w-2xl">{task.description}</p>
                      {task.scheduled_at && (
                        <p className="text-[11px] text-gray-500 font-medium">
                          Thời gian hẹn: <span className="text-primary-600 font-semibold">{new Date(task.scheduled_at).toLocaleString("vi-VN")}</span>
                        </p>
                      )}
                      {task.unable_reason && (
                        <p className="text-[11px] text-red-600 bg-red-50 p-2 border border-red-150 font-medium">
                          Báo cáo lý do không sửa được: <span className="font-semibold">{task.unable_reason}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
                      {task.status === "PROCESSING" && (
                        <>
                          <Button
                            size="sm"
                            isLoading={isMutating}
                            onClick={() => {
                              setReportRequest(task);
                              setReportReason("");
                            }}
                            className="flex items-center gap-1 bg-red-50 text-red-750 border border-red-200 hover:bg-red-200"
                          >
                            <XCircle size={12} /> Báo không sửa được
                          </Button>
                          <Button
                            size="sm"
                            isLoading={isMutating}
                            onClick={() => {
                              setCompleteRequest(task);
                              setChargeTenant(false);
                              setRepairFee("");
                            }}
                            className="flex items-center gap-1 bg-emerald-600 text-white hover:bg-emerald-700"
                          >
                            <CheckCircle size={12} /> Hoàn thành
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal báo cáo sự cố không sửa được */}
        <Modal
          isOpen={reportRequest !== null}
          onClose={() => setReportRequest(null)}
          title="Báo cáo lý do sự cố không thể khắc phục"
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReportRequest(null)}>Hủy bỏ</Button>
              <Button
                isLoading={unableMutation.isPending}
                disabled={!reportReason.trim()}
                onClick={() => {
                  if (reportRequest) {
                    unableMutation.mutate(
                      { id: reportRequest.id, reason: reportReason.trim() },
                      {
                        onSuccess: () => {
                          setReportRequest(null);
                        }
                      }
                    );
                  }
                }}
              >
                Gửi báo cáo
              </Button>
            </div>
          }
        >
          {reportRequest && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-450">Căn hộ: P.{reportRequest.apartment?.room_number}</p>
                <h4 className="font-bold text-gray-800 mt-1">{reportRequest.title}</h4>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">Lý do sự cố chưa sửa được *</label>
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Ví dụ: Cần mua thiết bị cảm biến thay thế; Cần gọi đơn vị ngoài trợ giúp; Khách hàng vắng nhà liên tục..."
                  className="w-full text-sm border border-gray-200 rounded-none p-3 h-24 focus:outline-none focus:border-primary-500 font-sans"
                  required
                />
              </div>
            </div>
          )}
        </Modal>

        {/* Modal hoàn thành sửa chữa */}
        <Modal
          isOpen={completeRequest !== null}
          onClose={() => setCompleteRequest(null)}
          title="Xác nhận hoàn thành sửa chữa"
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCompleteRequest(null)}>Hủy bỏ</Button>
              <Button
                isLoading={completeMutation.isPending}
                disabled={chargeTenant && (!repairFee || Number(repairFee) <= 0)}
                onClick={() => {
                  if (completeRequest) {
                    completeMutation.mutate(
                      {
                        id: completeRequest.id,
                        charge_tenant: chargeTenant,
                        repair_fee: chargeTenant ? Number(repairFee) : undefined,
                      },
                      {
                        onSuccess: () => {
                          setCompleteRequest(null);
                        },
                      }
                    );
                  }
                }}
              >
                Hoàn thành
              </Button>
            </div>
          }
        >
          {completeRequest && (
            <div className="space-y-4 font-sans">
              <div>
                <p className="text-xs font-semibold text-gray-450">Căn hộ: P.{completeRequest.apartment?.room_number}</p>
                <h4 className="font-bold text-gray-800 mt-1">{completeRequest.title}</h4>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-700 block">Hình thức thanh toán chi phí</label>
                <div className="grid grid-cols-1 gap-2.5">
                  <label className="flex items-center gap-2.5 p-3 border border-gray-200 hover:bg-gray-50/50 cursor-pointer transition-all">
                    <input
                      type="radio"
                      name="charge_tenant"
                      checked={!chargeTenant}
                      onChange={() => setChargeTenant(false)}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <div className="text-xs">
                      <p className="font-semibold text-gray-800">Bảo trì cơ sở vật chất (Không tốn phí)</p>
                      <p className="text-gray-500 mt-0.5">Chi phí sửa chữa do ban quản lý / chủ nhà chịu trách nhiệm.</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 border border-gray-200 hover:bg-gray-50/50 cursor-pointer transition-all">
                    <input
                      type="radio"
                      name="charge_tenant"
                      checked={chargeTenant}
                      onChange={() => setChargeTenant(true)}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <div className="text-xs">
                      <p className="font-semibold text-gray-800">Do người thuê gây hư hại (Có tính phí)</p>
                      <p className="text-gray-500 mt-0.5">Khách thuê chịu trách nhiệm làm hư hại thiết bị. Sẽ tạo hóa đơn thanh toán.</p>
                    </div>
                  </label>
                </div>
              </div>

              {chargeTenant && (
                <div className="space-y-2 animate-fadeIn">
                  <label className="text-xs font-bold text-gray-700 block">Số tiền phí sửa chữa (VNĐ) *</label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={repairFee}
                    onChange={(e) => setRepairFee(e.target.value)}
                    placeholder="Ví dụ: 150000"
                    className="w-full text-sm border border-gray-200 rounded-none p-3 focus:outline-none focus:border-primary-500"
                    required
                  />
                  <p className="text-[10px] text-gray-400">Nhập số tiền chính xác cần lập hóa đơn thu tiền của khách thuê.</p>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{today}</p>
        <h1 className="text-2xl font-bold text-gray-800">
          Xin chào, <span className="text-primary-600">{displayName}</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">Tổng quan công việc vận hành</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-12 gap-6 items-stretch">
        <div className="col-span-12 sm:col-span-6 lg:col-span-4">
          <StatCard icon={Home} label="Tổng căn hộ" value={totalApartmentsCount}
            iconColor="text-primary-600" iconBg="bg-primary-50" />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-4">
          <StatCard icon={Wrench} label="Yêu cầu sửa chữa" value={pendingMaintenanceRequests}
            iconColor="text-warning-600" iconBg="bg-warning-50" />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-4">
          <StatCard icon={Users} label="Người thuê" value={activeTenantsCount}
            iconColor="text-info-600" iconBg="bg-info-50" />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-4">
          <StatCard icon={Home} label="Còn trống" value={availableCount}
            iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-4">
          <StatCard icon={CalendarDays} label="Lịch hẹn chờ duyệt" value={pendingSchedulesCount}
            iconColor="text-danger-600" iconBg="bg-danger-50" />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-4">
          <StatCard icon={Wrench} label="Sự cố đang xử lý" value={processingMaintenanceRequests}
            iconColor="text-orange-600" iconBg="bg-orange-50" />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-12 gap-6 items-stretch">
        {/* Left panel: Maintenance Table */}
        <div className="col-span-12 lg:col-span-8">
          <ChartCard
            title="Yêu cầu sửa chữa cần xử lý"
            subtitle="Các sự cố mới nhận hoặc đang tiến hành cần kiểm tra"
          >
            {(() => {
              const unresolvedRequests = maintenanceRequests
                .filter((r) => r.status === "PENDING" || r.status === "PROCESSING" || r.status === "NEEDS_RESCHEDULE")
                .slice(0, 5);

              if (unresolvedRequests.length === 0) {
                return (
                  <div className="text-center py-16 text-gray-400 font-sans text-sm">
                    Không có yêu cầu sửa chữa nào cần xử lý.
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto min-h-[280px]">
                  <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm font-sans">
                    <thead>
                      <tr className="text-left text-gray-500 font-bold uppercase tracking-wider">
                        <th className="pb-3 pt-2">Căn hộ</th>
                        <th className="pb-3 pt-2">Sự cố</th>
                        <th className="pb-3 pt-2">Mức độ</th>
                        <th className="pb-3 pt-2">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150">
                      {unresolvedRequests.map((req) => {
                        const aptLabel = req.apartment ? `P.${req.apartment.room_number}` : `Căn hộ #${req.apartment_id}`;
                        const priorityLabel = req.priority === "HIGH" ? "Cao" : req.priority === "MEDIUM" ? "Trung bình" : "Thấp";
                        const priorityColor = req.priority === "HIGH" ? "text-red-600 bg-red-50 border border-red-200" : req.priority === "MEDIUM" ? "text-amber-600 bg-amber-50 border border-amber-200" : "text-gray-650 bg-gray-50 border border-gray-200";

                        const statusLabel = req.status === "PENDING" ? "Mới tạo" : req.status === "PROCESSING" ? "Đang xử lý" : "Hẹn lại lịch";
                        const statusBg = req.status === "PENDING" ? "bg-amber-100 text-amber-800" : req.status === "PROCESSING" ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800";

                        return (
                          <tr key={req.id} className="hover:bg-gray-50/50">
                            <td className="py-3 font-semibold text-gray-800">{aptLabel}</td>
                            <td className="py-3 font-medium text-gray-700">
                              <div className="font-semibold text-gray-800 truncate max-w-[200px]" title={req.title}>{req.title}</div>
                              <div className="text-xs text-gray-500 truncate max-w-[250px]" title={req.description}>{req.description}</div>
                            </td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 text-[10px] font-bold ${priorityColor}`}>
                                {priorityLabel}
                              </span>
                            </td>
                            <td className="py-3">
                              <span className={`px-2.5 py-0.5 text-[10px] font-extrabold ${statusBg}`}>
                                {statusLabel}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </ChartCard>
        </div>

        {/* Apartment status pie chart */}
        <div className="col-span-12 lg:col-span-4">
          <ChartCard title="Tình trạng căn hộ" subtitle="Cơ cấu căn hộ hiện tại">
            <div className="flex flex-col items-center justify-between h-full">
              <ResponsiveContainer width="100%" height={280} debounce={150}>
                <PieChart>
                  <Pie data={apartmentStatus} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    innerRadius={60} outerRadius={85} paddingAngle={4}>
                    {apartmentStatus.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2 w-full">
                {apartmentStatus.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-gray-600">{item.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-800">{item.value} căn</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>
        </div>
      </div>

      {/* Operational Tasks Row */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white border border-gray-200 p-5 shadow-lg rounded-none">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <CalendarDays size={18} className="text-primary-600" />
            Nhiệm vụ vận hành chi nhánh
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingTasks.map((task, i) => (
              <div key={i} className={`p-4 border rounded-none flex items-start gap-3 transition-colors ${task.urgent
                ? "border-orange-200 bg-orange-50/30 hover:bg-orange-50/55"
                : "border-gray-200 bg-gray-50/20 hover:bg-gray-50/50"
                }`}>
                {task.urgent ? (
                  <AlertCircle className="text-orange-500 mt-0.5 shrink-0" size={16} />
                ) : (
                  <Clock className="text-gray-400 mt-0.5 shrink-0" size={16} />
                )}
                <div className="flex-1">
                  <p className="text-sm text-gray-700 font-medium">{task.text}</p>
                  <span className={`text-[10px] font-bold uppercase mt-1 inline-block ${task.urgent ? "text-orange-600" : "text-gray-400"
                    }`}>
                    {task.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
