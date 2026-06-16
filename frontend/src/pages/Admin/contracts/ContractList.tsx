import { useState, useEffect } from "react";
import { Plus, FileText } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../../../components/ui/PageHeader";
import Button from "../../../components/ui/Button";
import SearchInput from "../../../components/ui/SearchInput";
import Badge from "../../../components/ui/Badge";
import DataTable, { type Column } from "../../../components/ui/DataTable";
import Pagination from "../../../components/ui/Pagination";
import Modal from "../../../components/ui/Modal";
import { mockContracts } from "../../../data/contracts";
import { mockTenants } from "../../../data/tenants";
import { mockApartments } from "../../../data/apartments";
import { mockUsers } from "../../../data/users";
import { mockBuildings } from "../../../data/buildings";
import * as buildingService from "../../../services/buildingService";
import * as apartmentService from "../../../services/apartmentService";
import type { ApartmentData } from "../../../services/apartmentService";
import type { BuildingData } from "../../../services/buildingService";
import { useAuthStore } from "../../../stores/auth.store";
import { CONTRACT_STATUS_LABELS, CONTRACT_STATUS_COLORS } from "../../../constants/enums";
import { formatCurrency, formatDate, formatApartmentDisplay, removeVietnameseTones, numberToVietnameseWords } from "../../../utils/format";
import type { RentalContract, Tenant } from "../../../types";
import type { ContractStatus } from "../../../constants/enums";
import { toast } from "sonner";

// Trang danh sach hop dong thue
export default function ContractList() {
  const { role, email } = useAuthStore();
  const currentUser = mockUsers.find((u) => u.email === email);
  const managerBuildingId = currentUser?.managedBuildingId;

  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const pageSize = 10;

  // Real data loaded from API
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [apartments, setApartments] = useState<ApartmentData[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [contracts, setContracts] = useState<RentalContract[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Modal PDF preview state
  const [viewContractDoc, setViewContractDoc] = useState<RentalContract | null>(null);

  // Form selection states (Controlled)
  const [selectedTenantId, setSelectedTenantId] = useState<number | "">("");
  const [selectedFormBuilding, setSelectedFormBuilding] = useState<number | undefined>(
    role === "MANAGER" ? managerBuildingId : undefined
  );
  const [selectedFormFloor, setSelectedFormFloor] = useState<number | undefined>();
  const [selectedFormApartment, setSelectedFormApartment] = useState<number | undefined>();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [monthlyRent, setMonthlyRent] = useState<number>(0);
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [actualOccupants, setActualOccupants] = useState<number>(1);
  const [maxOccupants, setMaxOccupants] = useState<number>(2);

  // Load backend API data and localStorage data
  useEffect(() => {
    // 1. Fetch buildings from backend API
    buildingService.getAllBuildings({ limit: 100 }).then((res) => {
      setBuildings(res.data);
    }).catch(() => {
      setBuildings(mockBuildings);
    });

    // 2. Fetch apartments from backend API
    apartmentService.getAllApartments({ limit: 1000 }).then((res) => {
      setApartments(res.data);
    }).catch(() => {
      setApartments(mockApartments as any);
    });

    // 3. Load tenants from localStorage
    const storedTenants = localStorage.getItem("custom-tenants");
    if (storedTenants) {
      try {
        setTenants(JSON.parse(storedTenants));
      } catch {
        setTenants(mockTenants);
      }
    } else {
      setTenants(mockTenants);
    }

    // 4. Load contracts from localStorage
    const storedContracts = localStorage.getItem("custom-contracts");
    if (storedContracts) {
      try {
        setContracts(JSON.parse(storedContracts));
      } catch {
        setContracts(mockContracts);
      }
    } else {
      setContracts(mockContracts);
    }

    // 5. Load users from localStorage
    const storedUsers = localStorage.getItem("custom-users");
    if (storedUsers) {
      try {
        setUsers(JSON.parse(storedUsers));
      } catch {
        setUsers(mockUsers);
      }
    } else {
      setUsers(mockUsers);
    }
  }, [showForm]);

  // Handle URL redirect query parameters (Add Tenant -> Create Contract Wizard)
  useEffect(() => {
    const autoOpen = searchParams.get("auto_open") === "true";
    const tenantId = searchParams.get("new_tenant_id");
    const buildingId = searchParams.get("new_tenant_building_id");
    if (autoOpen && tenantId) {
      setSelectedTenantId(Number(tenantId));
      if (buildingId) {
        setSelectedFormBuilding(Number(buildingId));
      }
      setShowForm(true);
      // Clean query parameters to avoid double-triggers
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  // Dynamic occupant-based rent pricing and security deposit auto-filling
  useEffect(() => {
    if (selectedFormApartment) {
      const apt = apartments.find((a) => a.id === selectedFormApartment);
      if (apt) {
        const calculatedMax = apt.bedrooms * 2;
        setMaxOccupants(calculatedMax);

        // Giới hạn quá số lượng ở: dư 1 người là tăng 1 triệu VNĐ
        const extraPeople = actualOccupants > calculatedMax ? actualOccupants - calculatedMax : 0;
        const calculatedRent = Number(apt.rental_price) + (extraPeople * 1000000);
        setMonthlyRent(calculatedRent);
        // Tiền cọc là cọc tổng tiền của căn hộ (bằng giá thuê tháng đã tính phụ thu)
        setDepositAmount(calculatedRent);
      }
    } else {
      setMonthlyRent(0);
      setDepositAmount(0);
      setMaxOccupants(2);
    }
  }, [selectedFormApartment, actualOccupants, apartments]);

  function handleSaveContract() {
    if (!selectedTenantId || !selectedFormApartment || !startDate || !endDate) {
      toast.error("Vui lòng nhập đầy đủ: Người thuê, căn hộ, ngày bắt đầu và ngày kết thúc.");
      return;
    }

    const stored = localStorage.getItem("custom-contracts");
    const list = stored ? JSON.parse(stored) : [...mockContracts];

    const newId = Date.now();
    const newContract: RentalContract = {
      id: newId,
      tenant_id: Number(selectedTenantId),
      apartment_id: Number(selectedFormApartment),
      start_date: startDate,
      end_date: endDate,
      monthly_rent: monthlyRent,
      deposit_amount: depositAmount,
      status: "ACTIVE",
      contractFile: null,
      signedAt: new Date().toISOString().split("T")[0],
      createdBy: currentUser?.id || 1,
      created_at: new Date().toISOString(),
      actual_occupants: actualOccupants,
      max_occupants: maxOccupants,
    };

    list.push(newContract);
    localStorage.setItem("custom-contracts", JSON.stringify(list));
    setContracts(list);

    // Cập nhật trạng thái căn hộ thành RENTED
    apartmentService.updateApartment(Number(selectedFormApartment), { status: "RENTED" })
      .then(() => {
        setApartments((prev) =>
          prev.map((a) => (a.id === Number(selectedFormApartment) ? { ...a, status: "RENTED" } : a))
        );
        toast.success("Đã tạo hợp đồng và cập nhật trạng thái căn hộ thành 'Đang thuê'!");
      })
      .catch(() => {
        setApartments((prev) =>
          prev.map((a) => (a.id === Number(selectedFormApartment) ? { ...a, status: "RENTED" } : a))
        );
        toast.success("Đã tạo hợp đồng thành công!");
      });

    setShowForm(false);
    setSelectedTenantId("");
    setSelectedFormFloor(undefined);
    setSelectedFormApartment(undefined);
    setStartDate("");
    setEndDate("");
    setActualOccupants(1);
  }

  const formFloors = (() => {
    if (!selectedFormBuilding) return [];
    // Show floors from AVAILABLE apartments
    const buildingApts = apartments.filter(
      (a) => a.building_id === selectedFormBuilding && ["available", "vacant", "AVAILABLE"].includes(a.status)
    );
    const floors = buildingApts.map((a) => a.floor);
    return [...new Set(floors)].sort((a, b) => a - b);
  })();

  const formApartments = (() => {
    if (!selectedFormBuilding || !selectedFormFloor) return [];
    return apartments.filter(
      (a) => a.building_id === selectedFormBuilding && a.floor === selectedFormFloor && ["available", "vacant", "AVAILABLE"].includes(a.status)
    );
  })();

  const displayContracts = (() => {
    if (role === "MANAGER" && managerBuildingId) {
      const managerApartmentIds = apartments
        .filter((a) => a.building_id === managerBuildingId)
        .map((a) => a.id);
      return contracts.filter((c) => managerApartmentIds.includes(c.apartment_id));
    }
    return contracts;
  })();

  const filtered = displayContracts.filter((c) => {
    const tenant = tenants.find((t) => t.id === c.tenant_id);
    const apt = apartments.find((a) => a.id === c.apartment_id);
    const term = removeVietnameseTones(search);
    const tenantNameNorm = removeVietnameseTones(tenant?.full_name || "");
    const roomNorm = removeVietnameseTones(apt?.room_number || "");
    const matchSearch = tenantNameNorm.includes(term) || roomNorm.includes(term);
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns: Column<RentalContract>[] = [
    { key: "id", label: "Mã HĐ", sortValue: (c) => c.id, render: (c) => <span className="font-medium">HD-{String(c.id).padStart(3, "0")}</span> },
    { key: "tenant", label: "Người thuê", sortValue: (c) => tenants.find((t) => t.id === c.tenant_id)?.full_name || "", render: (c) => tenants.find((t) => t.id === c.tenant_id)?.full_name || "-" },
    {
      key: "apartment",
      label: "Căn hộ",
      sortValue: (c) => apartments.find((a) => a.id === c.apartment_id)?.room_number || "",
      render: (c) => {
        const apt = apartments.find((a) => a.id === c.apartment_id);
        const bld = apt ? buildings.find((b) => b.id === apt.building_id) : null;
        return apt ? formatApartmentDisplay(apt.room_number, apt.floor, role || undefined, bld?.branch_name) : "-";
      }
    },
    { key: "start", label: "Ngày bắt đầu", sortValue: (c) => new Date(c.start_date).getTime(), render: (c) => formatDate(c.start_date) },
    { key: "end", label: "Ngày kết thúc", sortValue: (c) => new Date(c.end_date).getTime(), render: (c) => formatDate(c.end_date) },
    { key: "deposit", label: "Tiền cọc", sortValue: (c) => Number(c.deposit_amount), render: (c) => formatCurrency(c.deposit_amount) },
    { key: "rent", label: "Tiền thuê/tháng", sortValue: (c) => Number(c.monthly_rent), render: (c) => formatCurrency(c.monthly_rent) },
    {
      key: "status", label: "Trạng thái",
      sortValue: (c) => c.status,
      render: (c) => (
        <Badge variant={CONTRACT_STATUS_COLORS[c.status as ContractStatus] as "success" | "gray" | "danger"}>
          {CONTRACT_STATUS_LABELS[c.status as ContractStatus]}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Chức năng",
      render: (c) => (
        <button
          type="button"
          onClick={() => setViewContractDoc(c)}
          className="p-1 px-2.5 rounded-lg text-primary-600 hover:text-primary-700 hover:bg-primary-50 border border-primary-200 cursor-pointer flex items-center gap-1 text-xs font-semibold transition-colors"
          title="Xem hợp đồng"
        >
          <FileText size={14} /> Xem HĐ
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FileText}
        title="Hợp đồng"
        subtitle="Quản lý hợp đồng thuê căn hộ"
        count={filtered.length}
        iconColor="linear-gradient(135deg, #10B981, #34D399)"
        actions={
          <Button onClick={() => setShowForm(true)}>
            <Plus size={18} /> Tạo hợp đồng
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setCurrentPage(1); }}
          placeholder="Tìm kiếm..."
          className="max-w-md"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm bg-white cursor-pointer focus:outline-none focus:border-primary-500"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Hiệu lực</option>
          <option value="ENDED">Đã kết thúc</option>
          <option value="LIQUIDATED">Đã thanh lý</option>
        </select>
      </div>

      <DataTable columns={columns} data={paginated} />

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {/* Modal tạo hợp đồng */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Tạo hợp đồng mới"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowForm(false)}>Hủy</Button>
            <Button onClick={handleSaveContract}>Tạo hợp đồng</Button>
          </>
        }
      >
        <div className="space-y-6 font-sans">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Người thuê *</label>
              <select
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value ? Number(e.target.value) : "")}
                className="premium-select w-full rounded-xl"
              >
                <option value="">Chọn người thuê</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name} ({t.citizen_id})
                  </option>
                ))}
              </select>
            </div>

            {/* Chọn Chi nhánh */}
            <div className="col-span-12 sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Chi nhánh *</label>
              <select
                value={selectedFormBuilding || ""}
                onChange={(e) => {
                  setSelectedFormBuilding(e.target.value ? Number(e.target.value) : undefined);
                  setSelectedFormFloor(undefined);
                  setSelectedFormApartment(undefined);
                }}
                disabled={role === "MANAGER"}
                className="premium-select w-full rounded-xl disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="">Chọn chi nhánh</option>
                {mockBuildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.branch_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Chọn Tầng */}
            <div className="col-span-12 sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tầng *</label>
              <select
                value={selectedFormFloor || ""}
                onChange={(e) => {
                  setSelectedFormFloor(e.target.value ? Number(e.target.value) : undefined);
                  setSelectedFormApartment(undefined);
                }}
                disabled={!selectedFormBuilding}
                className="premium-select w-full rounded-xl disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="">Chọn tầng</option>
                {formFloors.map((floor) => (
                  <option key={floor} value={floor}>Tầng {floor}</option>
                ))}
              </select>
            </div>

            {/* Chọn Căn hộ */}
            <div className="col-span-12 sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Căn hộ *</label>
              <select
                value={selectedFormApartment || ""}
                onChange={(e) => setSelectedFormApartment(e.target.value ? Number(e.target.value) : undefined)}
                disabled={!selectedFormFloor}
                className="premium-select w-full rounded-xl disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="">Chọn căn hộ</option>
                {formApartments.map((a) => (
                  <option key={a.id} value={a.id}>P.{a.room_number} ({a.area}m²)</option>
                ))}
              </select>
            </div>

            <div className="col-span-12 sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngày bắt đầu *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="premium-input rounded-xl"
              />
            </div>
            <div className="col-span-12 sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngày kết thúc *</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="premium-input rounded-xl"
              />
            </div>

            <div className="col-span-12 sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Số lượng người ở tối đa cho phép</label>
              <input
                type="number"
                disabled
                value={maxOccupants}
                className="premium-input rounded-xl bg-gray-50 text-gray-500"
              />
            </div>
            <div className="col-span-12 sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Số lượng người ở thực tế *</label>
              <input
                type="number"
                min={1}
                value={actualOccupants}
                onChange={(e) => setActualOccupants(Math.max(1, Number(e.target.value)))}
                className="premium-input rounded-xl"
              />
            </div>

            <div className="col-span-12 sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tiền thuê/tháng (VND) *</label>
              <input
                type="number"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(Number(e.target.value))}
                className="premium-input rounded-xl"
              />
              {selectedFormApartment && (() => {
                const apt = apartments.find((a) => a.id === selectedFormApartment);
                if (apt && actualOccupants > maxOccupants) {
                  return (
                    <span className="text-[11px] text-amber-600 font-semibold mt-1 block">
                      (Phụ thu {formatCurrency((actualOccupants - maxOccupants) * 1000000)} do quá số người ở quy định)
                    </span>
                  );
                }
                return null;
              })()}
            </div>
            <div className="col-span-12 sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tiền cọc (VND) *</label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(Number(e.target.value))}
                className="premium-input rounded-xl"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                (Tiền cọc mặc định là cọc tổng tiền của căn hộ)
              </span>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!viewContractDoc}
        onClose={() => setViewContractDoc(null)}
        title="Xem chi tiết hợp đồng"
        size="lg"
        footer={
          <div className="flex justify-between w-full">
            <Button
              variant="outline"
              onClick={() => {
                const printContent = document.getElementById("printable-contract-area");
                if (printContent) {
                  const style = document.createElement("style");
                  style.innerHTML = `
                    @media print {
                      body * {
                        visibility: hidden !important;
                      }
                      #printable-contract-area, #printable-contract-area * {
                        visibility: visible !important;
                      }
                      #printable-contract-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: white;
                        color: black;
                      }
                    }
                  `;
                  document.head.appendChild(style);
                  window.print();
                  document.head.removeChild(style);
                }
              }}
            >
              In hợp đồng
            </Button>
            <Button onClick={() => setViewContractDoc(null)}>Đóng</Button>
          </div>
        }
      >
        {viewContractDoc && (() => {
          const tenant = tenants.find((t) => t.id === viewContractDoc.tenant_id);
          const apt = apartments.find((a) => a.id === viewContractDoc.apartment_id);
          const bld = apt ? buildings.find((b) => b.id === apt.building_id) : null;
          const tenantUser = tenant ? users.find((u) => u.id === tenant.user_id) : null;

          const maxOcc = viewContractDoc.max_occupants || (apt ? apt.bedrooms * 2 : 2);
          const actOcc = viewContractDoc.actual_occupants || 1;
          const excess = actOcc > maxOcc ? actOcc - maxOcc : 0;
          const excessSurcharge = excess * 1000000;
          const baseRent = apt ? apt.rental_price : viewContractDoc.monthly_rent - excessSurcharge;

          const durationYears = (() => {
            if (!viewContractDoc.start_date || !viewContractDoc.end_date) return 1;
            const diffMs = new Date(viewContractDoc.end_date).getTime() - new Date(viewContractDoc.start_date).getTime();
            const years = diffMs / (1000 * 60 * 60 * 24 * 365.25);
            return Math.max(1, Math.round(years * 10) / 10);
          })();

          const signedDate = new Date(viewContractDoc.signedAt || viewContractDoc.created_at || Date.now());

          return (
            <div className="bg-gray-50 p-4 sm:p-8 rounded-2xl overflow-y-auto max-h-[70vh] border border-gray-200">
              <div
                id="printable-contract-area"
                className="bg-white p-6 sm:p-10 shadow-sm border border-gray-150 rounded-lg text-gray-800 font-serif leading-relaxed text-sm"
                style={{ minHeight: "297mm" }}
              >
                {/* Tiêu ngữ */}
                <div className="text-center space-y-1 mb-6">
                  <h4 className="font-bold uppercase tracking-wider text-xs sm:text-sm">
                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                  </h4>
                  <p className="font-semibold text-xs sm:text-sm">Độc lập – Tự do – Hạnh phúc</p>
                  <div className="w-40 h-px bg-gray-400 mx-auto mt-2"></div>
                </div>

                {/* Tên hợp đồng */}
                <div className="text-center space-y-1 mb-6">
                  <h2 className="text-base sm:text-lg font-bold uppercase">
                    HỢP ĐỒNG THUÊ CĂN HỘ CHUNG CƯ
                  </h2>
                  <p className="text-xs text-gray-500 font-sans italic">
                    Số: HD-{String(viewContractDoc.id).padStart(3, "0")}
                  </p>
                </div>

                {/* Phần nội dung */}
                <div className="space-y-4 font-sans text-xs sm:text-sm">
                  <p>
                    Hôm nay, ngày {signedDate.getDate()} tháng {signedDate.getMonth() + 1} năm {signedDate.getFullYear()}, tại {bld?.address_new || bld?.address_old || "văn phòng đại diện Yuki House"}, chúng tôi gồm có:
                  </p>

                  {/* Bên A */}
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900 uppercase">BÊN CHO THUÊ (Sau đây gọi tắt là Bên A)</p>
                    <div className="pl-4 space-y-1 text-xs text-gray-700">
                      <p>Ông/bà: <span className="font-semibold text-gray-800">BAN QUẢN LÝ CĂN HỘ DỊCH VỤ YUKI HOUSE (Đại diện)</span></p>
                      <p>Số CMND/CCCD/Mã số thuế: 079200000001</p>
                      <p>Địa chỉ: {bld?.address_new || bld?.address_old || "Hệ thống tòa nhà Yuki House"}</p>
                      <p>Điện thoại: {(bld as any)?.phone || "0901000001"}</p>
                      <p>
                        Là chủ cho thuê hợp pháp căn hộ chung cư số:{" "}
                        <span className="font-semibold text-gray-800">
                          {apt ? formatApartmentDisplay(apt.room_number, apt.floor, role || undefined, bld?.branch_name) : "-"}
                        </span>{" "}
                        tại {bld?.name || "Tòa nhà Yuki House"}
                      </p>
                    </div>
                  </div>

                  {/* Bên B */}
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900 uppercase">BÊN THUÊ (Sau đây gọi tắt là Bên B)</p>
                    <div className="pl-4 space-y-1 text-xs text-gray-700">
                      <p>Ông/bà: <span className="font-semibold text-gray-800">{tenant?.full_name || "CHƯA XÁC ĐỊNH"}</span></p>
                      <p>Số CMND/CCCD: {tenant?.citizen_id || "Chưa cập nhật"}</p>
                      <p>Địa chỉ: {tenant?.address || "Chưa cập nhật"}</p>
                      <p>Số điện thoại: {tenantUser?.phone || "Chưa cập nhật"}</p>
                    </div>
                  </div>

                  <p className="italic text-gray-650">Sau khi bàn bạc hai Bên thống nhất ký Hợp đồng cho thuê căn hộ chung cư (sau đây viết tắt là Hợp đồng) với nội dung sau:</p>

                  {/* Điều 1 */}
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900 text-xs sm:text-sm">ĐIỀU 1: ĐỐI TƯỢNG VÀ NỘI DUNG CỦA HỢP ĐỒNG</p>
                    <div className="pl-4 space-y-1 text-xs text-gray-700">
                      <p>1.1. Bên A cho Bên B thuê và Bên B đồng ý thuê căn hộ chung cư có thông tin như sau:</p>
                      <div className="pl-4 space-y-0.5">
                        <p>- Địa chỉ căn hộ: {bld?.address_new || bld?.address_old || "Chưa xác định"}</p>
                        <p>- Căn hộ số: {apt?.room_number || "..."} - Tầng số: {apt?.floor || "..."}</p>
                        <p>- Tổng diện tích sàn căn hộ là: {apt?.area || "..."} m2.</p>
                        <p>- Đặc điểm: 1 phòng khách, {apt?.bedrooms || 1} phòng ngủ, {apt?.bathrooms || 1} WC.</p>
                        <p>- Trang thiết bị gắn liền với căn hộ: Bàn giao đầy đủ trang thiết bị theo biên bản bàn giao kèm theo hợp đồng.</p>
                        <p>- Những hạn chế về quyền sở hữu căn hộ (nếu có): Không có.</p>
                      </div>
                      <p>1.2. Mục đích thuê: Bên B thuê căn hộ của Bên A để sử dụng vào mục đích: Để ở sinh hoạt gia đình (Số lượng người ở tối đa cho phép: {maxOcc} người, thực tế đăng ký: {actOcc} người).</p>
                    </div>
                  </div>

                  {/* Điều 2 */}
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900 text-xs sm:text-sm">ĐIỀU 2: THỜI HẠN THUÊ CĂN HỘ CHUNG CƯ</p>
                    <div className="pl-4 text-xs text-gray-700">
                      <p>
                        Thời hạn thuê căn hộ chung cư nêu tại Điều 1 Hợp đồng là:{" "}
                        <span className="font-semibold">{durationYears} năm</span> (từ ngày{" "}
                        <span className="font-semibold">{formatDate(viewContractDoc.start_date)}</span> đến ngày{" "}
                        <span className="font-semibold">{formatDate(viewContractDoc.end_date)}</span>).
                      </p>
                    </div>
                  </div>

                  {/* Điều 3 */}
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900 text-xs sm:text-sm">ĐIỀU 3: GIÁ THUÊ, PHƯƠNG THỨC VÀ THỜI HẠN THANH TOÁN</p>
                    <div className="pl-4 space-y-1 text-xs text-gray-700">
                      <p>
                        3.1. Giá thuê căn hộ chung cư nêu tại Điều 1 Hợp đồng là:{" "}
                        <span className="font-semibold text-primary-700">{formatCurrency(viewContractDoc.monthly_rent)}/tháng</span>
                        {" "}(Bằng chữ: <span className="font-semibold italic text-gray-800">{numberToVietnameseWords(viewContractDoc.monthly_rent)} đồng chẵn / tháng</span>).
                      </p>
                      <p>Tiền thuê được giữ cố định trong suốt thời hạn thuê.</p>
                      {excess > 0 && (
                        <p className="text-amber-600 font-semibold italic text-[11px] pl-4">
                          (* Ghi chú: Giá thuê bao gồm đơn giá cơ bản {formatCurrency(baseRent)}/tháng và phụ thu {formatCurrency(excessSurcharge)}/tháng do quá số lượng người ở quy định).
                        </p>
                      )}
                      <p>3.2. Giá cho thuê này đã bao gồm chi phí bảo trì, quản lý vận hành nhà ở và chưa bao gồm các khoản thuế mà Bên A phải nộp cho Nhà nước theo quy định.</p>
                      <p>3.3. Chi phí sử dụng điện, nước, điện thoại và các dịch vụ khác do Bên B thanh toán cho Bên cung cấp điện, nước, điện thoại và các cơ quan cung cấp dịch vụ khác.</p>
                      <p>3.4. Phương thức thanh toán như sau:</p>
                      <div className="pl-4 space-y-0.5">
                        <p>- Việc thanh toán tiền thuê căn hộ được thực hiện theo kỳ 01 tháng một lần và thanh toán trong vòng 05 ngày đầu tiên của mỗi đợt thanh toán.</p>
                        <p>- Việc thanh toán được thực hiện bằng hình thức chuyển khoản hoặc tiền mặt.</p>
                      </div>
                      <p>3.5. Các thoả thuận khác: Không có.</p>
                    </div>
                  </div>

                  {/* Điều 4 */}
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900 text-xs sm:text-sm">ĐIỀU 4: ĐẶT CỌC</p>
                    <div className="pl-4 space-y-1 text-xs text-gray-700">
                      <p>
                        Bên B đặt cọc cho Bên A số tiền là:{" "}
                        <span className="font-semibold text-primary-700">{formatCurrency(viewContractDoc.deposit_amount)}</span>{" "}
                        Đồng (tương đương với {Math.round(viewContractDoc.deposit_amount / viewContractDoc.monthly_rent) || 1} tháng tiền thuê căn hộ).
                      </p>
                      <p>Tiền đặt cọc được thanh toán trong thời hạn 03 ngày kể từ ngày ký Hợp đồng.</p>
                      <p>Tiền đặt cọc được Bên A giữ trong suốt thời hạn thuê và không phải trả lãi cho Bên B. Bên B không có quyền yêu cầu Bên A trừ tiền thuê vào tiền đặt cọc.</p>
                    </div>
                  </div>

                  {/* Điều 5 */}
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900 text-xs sm:text-sm">ĐIỀU 5: CHO THUÊ LẠI CĂN HỘ CHUNG CƯ</p>
                    <div className="pl-4 text-xs text-gray-700">
                      <p>Bên B không có quyền cho thuê lại căn hộ, trừ trường hợp được sự đồng ý của Bên A bằng văn bản.</p>
                    </div>
                  </div>

                  {/* Điều 6 */}
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900 text-xs sm:text-sm">ĐIỀU 6: QUYỀN VÀ NGHĨA VỤ CỦA BÊN A</p>
                    <div className="pl-4 space-y-1 text-xs text-gray-700">
                      <p><span className="font-medium">6.1. Quyền của Bên A:</span></p>
                      <div className="pl-4 space-y-0.5 text-gray-650">
                        <p>– Nhận đúng và đầy đủ tiền thuê từ Bên B như quy định tại Điều 3 Hợp đồng;</p>
                        <p>– Yêu cầu Bên B sửa chữa các hư hỏng và bồi thường thiệt hại do lỗi của Bên B gây ra;</p>
                        <p>– Đơn phương chấm dứt thực hiện hợp đồng thuê khi Bên B có một trong các hành vi sau đây:</p>
                        <div className="pl-4">
                          <p>+ Không trả tiền thuê căn hộ liên tiếp trong 02 tháng trở lên;</p>
                          <p>+ Sử dụng căn hộ không đúng mục đích như đã thoả thuận;</p>
                          <p>+ Cố ý làm hư hỏng căn hộ, tài sản cho thuê;</p>
                          <p>+ Sửa chữa, cải tạo, đổi căn hộ đang thuê hoặc cho người khác thuê lại căn hộ đang thuê mà không có sự đồng ý của Bên A;</p>
                        </div>
                        <p>– Yêu cầu Bên B bàn giao lại căn hộ khi chấm dứt Hợp đồng theo quy định;</p>
                        <p>– Đơn phương chấm dứt thực hiện Hợp đồng. Trong trường hợp này, Bên A phải thông báo cho Bên B biết trước ít nhất 01 tháng.</p>
                      </div>
                      <p><span className="font-medium">6.2. Nghĩa vụ của Bên A:</span></p>
                      <div className="pl-4 space-y-0.5 text-gray-650">
                        <p>– Bàn giao căn hộ và trang thiết bị như thỏa thuận tại Điều 1 Hợp đồng;</p>
                        <p>– Bảo đảm cho Bên B sử dụng ổn định căn hộ trong thời hạn thuê;</p>
                        <p>– Kê khai và đóng các loại thuế theo quy định của pháp luật.</p>
                      </div>
                    </div>
                  </div>

                  {/* Điều 7 */}
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900 text-xs sm:text-sm">ĐIỀU 7: QUYỀN VÀ NGHĨA VỤ CỦA BÊN B</p>
                    <div className="pl-4 space-y-1 text-xs text-gray-700">
                      <p><span className="font-medium">7.1. Quyền của Bên B:</span></p>
                      <div className="pl-4 space-y-0.5 text-gray-650">
                        <p>– Nhận bàn giao căn hộ và trang thiết bị như thỏa thuận tại Điều 1 Hợp đồng;</p>
                        <p>– Bên B có quyền đơn phương chấm dứt thực hiện Hợp đồng khi Bên A tăng giá thuê bất hợp lý hoặc khi quyền sử dụng căn hộ bị hạn chế do lợi ích của người thứ ba. Trong trường hợp này, Bên B phải thông báo cho Bên A biết trước ít nhất 01 tháng.</p>
                        <p>– Đơn phương chấm dứt thực hiện hợp đồng thuê căn hộ. Trong trường hợp này, Bên B phải thông báo cho Bên A biết trước ít nhất 01 tháng.</p>
                      </div>
                      <p><span className="font-medium">7.2. Nghĩa vụ của Bên B:</span></p>
                      <div className="pl-4 space-y-0.5 text-gray-650">
                        <p>– Trả đủ tiền thuê căn hộ theo đúng thời hạn đã cam kết trong Hợp đồng;</p>
                        <p>– Sử dụng căn hộ đúng mục đích; có trách nhiệm sửa chữa phần hư hỏng do mình gây ra;</p>
                        <p>– Chấp hành đầy đủ các quy định về quản lý sử dụng căn hộ và nội quy chung của chung cư;</p>
                        <p>– Chấp hành các quy định về giữ gìn vệ sinh môi trường và an ninh trật tự trong khu vực.</p>
                      </div>
                    </div>
                  </div>

                  {/* Điều 8 */}
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900 text-xs sm:text-sm">ĐIỀU 8: CHẤM DỨT HỢP ĐỒNG THUÊ CĂN HỘ CHUNG CƯ</p>
                    <div className="pl-4 space-y-1 text-xs text-gray-700">
                      <p>8.1 Hợp đồng chấm dứt khi xảy ra một trong các trường hợp sau:</p>
                      <div className="pl-4">
                        <p>– Hết thời hạn thuê mà các bên không tiếp tục gia hạn;</p>
                        <p>– Các Bên thỏa thuận chấm dứt hợp đồng trước thời hạn;</p>
                        <p>– Căn hộ cho thuê hư hỏng nặng có nguy cơ sập đổ hoặc nằm trong khu vực đã có quyết định thu hồi đất, giải phóng mặt bằng hoặc có quyết định phá dỡ của cơ quan nhà nước có thẩm quyền;</p>
                        <p>– Bên B chết mà không có người đang cùng sinh sống;</p>
                        <p>– Khi một trong hai Bên đơn phương chấm dứt hợp đồng theo quy định của Hợp đồng.</p>
                      </div>
                      <p>8.2 Hậu quả pháp lý khi hợp đồng chấm dứt:</p>
                      <p className="pl-4 italic text-gray-600">
                        Khi hợp đồng chấm dứt theo đúng thời hạn hoặc theo thỏa thuận, Bên B bàn giao lại căn hộ và toàn bộ trang thiết bị nguyên trạng (trừ hao mòn tự nhiên). Bên A hoàn trả lại toàn bộ tiền đặt cọc cho Bên B sau khi đã khấu trừ các chi phí sử dụng điện, nước, dịch vụ còn chưa thanh toán hoặc các thiệt hại hư hỏng do lỗi Bên B gây ra. Trường hợp Bên B đơn phương chấm dứt hợp đồng trái quy định sẽ không được nhận lại tiền đặt cọc. Trường hợp Bên A đơn phương chấm dứt hợp đồng trái quy định sẽ phải hoàn trả tiền đặt cọc và bồi thường cho Bên B một khoản tiền tương đương tiền đặt cọc.
                      </p>
                    </div>
                  </div>

                  {/* Điều 9 */}
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900 text-xs sm:text-sm">ĐIỀU 9: PHƯƠNG THỨC GIẢI QUYẾT TRANH CHẤP</p>
                    <div className="pl-4 text-xs text-gray-700">
                      <p>Trong quá trình thực hiện Hợp đồng mà phát sinh tranh chấp, các Bên cùng nhau thương lượng giải quyết trên nguyên tắc tôn trọng quyền lợi của nhau; trong trường hợp không giải quyết được, một trong hai Bên có quyền khởi kiện để yêu cầu toà án có thẩm quyền giải quyết theo quy định của pháp luật.</p>
                    </div>
                  </div>

                  {/* Điều 10 */}
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900 text-xs sm:text-sm">ĐIỀU 10: CAM KẾT CỦA CÁC BÊN</p>
                    <div className="pl-4 text-xs text-gray-700 space-y-1">
                      <p>10.1. Bên A cam kết: Căn hộ cho thuê thuộc quyền sở hữu hợp pháp của mình, không có tranh chấp về quyền sở hữu, không bị kê biên để thi hành án hoặc để chấp hành quyết định hành chính của cơ quan nhà nước có thẩm quyền; Những thông tin về nhân thân, về căn hộ cho thuê ghi trong Hợp đồng này là đúng sự thật.</p>
                      <p>10.2. Bên B cam kết: Đã tìm hiểu kỹ các thông tin về căn hộ thuê; Những thông tin về nhân thân ghi trong Hợp đồng này là đúng sự thật.</p>
                      <p>10.3. Các Bên cùng cam kết việc ký kết hợp đồng này giữa các Bên là hoàn toàn tự nguyện, không bị ép buộc, lừa dối. Trong quá trình thực hiện hợp đồng, nếu cần thay đổi hoặc bổ sung nội dung của hợp đồng này thì các Bên thỏa thuận lập thêm phụ lục hợp đồng có chữ ký của hai bên.</p>
                      <p>10.4. Các Bên cùng cam kết thực hiện đúng và đầy đủ các nội dung đã thỏa thuận trong Hợp đồng.</p>
                    </div>
                  </div>

                  {/* Điều 11 */}
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900 text-xs sm:text-sm">ĐIỀU 11: ĐIỀU KHOẢN CUỐI CÙNG</p>
                    <div className="pl-4 text-xs text-gray-700 space-y-1">
                      <p>11.1. Hai Bên công nhận đã hiểu rõ quyền, nghĩa vụ và lợi ích hợp pháp của mình, ý nghĩa và hậu quả pháp lý của việc giao kết Hợp đồng;</p>
                      <p>11.2. Hai Bên đã tự đọc Hợp đồng, đã hiểu và đồng ý tất cả các điều khoản ghi trong Hợp đồng;</p>
                      <p>11.3. Hợp đồng có hiệu lực từ: {formatDate(viewContractDoc.start_date)}</p>
                    </div>
                  </div>

                  {/* Ký tên */}
                  <div className="grid grid-cols-2 gap-4 pt-8 text-center font-semibold text-xs sm:text-sm">
                    <div>
                      <p className="uppercase text-gray-900">BÊN CHO THUÊ (BÊN A)</p>
                      <p className="text-[10px] text-gray-400 font-normal italic mt-1">(Ký và ghi rõ họ tên)</p>
                      <div className="h-20"></div>
                      <p className="font-bold text-gray-650">YUKI HOUSE</p>
                    </div>
                    <div>
                      <p className="uppercase text-gray-900">BÊN THUÊ (BÊN B)</p>
                      <p className="text-[10px] text-gray-400 font-normal italic mt-1">(Ký và ghi rõ họ tên)</p>
                      <div className="h-20"></div>
                      <p className="font-bold text-gray-700">{tenant?.full_name || "Bên thuê"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
