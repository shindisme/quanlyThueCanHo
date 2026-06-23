import { useState, useEffect } from "react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import * as apartmentService from "../../../../services/apartmentService";
import type { ApartmentData } from "../../../../services/apartmentService";
import type { BuildingData } from "../../../../services/buildingService";
import type { Tenant } from "../../../../types";
import { formatCurrency } from "../../../../utils/format";
import { toast } from "sonner";
import { createContract } from "../../../../services/contractService";
import * as authService from "../../../../services/authService";
import * as tenantService from "../../../../services/tenantService";

interface ContractCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  buildings: BuildingData[];
  apartments: ApartmentData[];
  tenants: Tenant[];
  currentUser: any;
  role: string | null;
  managerBuildingId?: number;
  initialTenantId?: number;
  initialBuildingId?: number;
}

export default function ContractCreateModal({
  isOpen,
  onClose,
  onSuccess,
  buildings,
  apartments,
  tenants,
  currentUser,
  role,
  managerBuildingId,
  initialTenantId,
  initialBuildingId,
}: ContractCreateModalProps) {
  const [selectedTenantId, setSelectedTenantId] = useState<number | "">("");
  const [selectedFormBuilding, setSelectedFormBuilding] = useState<number | undefined>();
  const [selectedFormFloor, setSelectedFormFloor] = useState<number | undefined>();
  const [selectedFormApartment, setSelectedFormApartment] = useState<number | undefined>();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [monthlyRent, setMonthlyRent] = useState<number>(0);
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [actualOccupants, setActualOccupants] = useState<number | "">(1);
  const [maxOccupants, setMaxOccupants] = useState<number>(2);
  const [prevApartmentId, setPrevApartmentId] = useState<number | undefined>();

  // States for new tenant creation flow
  const [isNewTenant, setIsNewTenant] = useState(false);
  const [newTenantName, setNewTenantName] = useState("");
  const [newTenantCCCD, setNewTenantCCCD] = useState("");
  const [newTenantDob, setNewTenantDob] = useState("");
  const [newTenantEmail, setNewTenantEmail] = useState("");
  const [newTenantPhone, setNewTenantPhone] = useState("");
  const [newTenantAddress, setNewTenantAddress] = useState("");
  const [saving, setSaving] = useState(false);

  const [buildingApartments, setBuildingApartments] = useState<ApartmentData[]>([]);

  // Initialize values
  useEffect(() => {
    if (isOpen) {
      setSelectedTenantId(initialTenantId || "");
      setSelectedFormBuilding(initialBuildingId || (role === "MANAGER" ? managerBuildingId : undefined));
      setSelectedFormFloor(undefined);
      setSelectedFormApartment(undefined);
      setStartDate("");
      setEndDate("");
      setActualOccupants(1);
      setIsNewTenant(false);
      setNewTenantName("");
      setNewTenantCCCD("");
      setNewTenantDob("");
      setNewTenantEmail("");
      setNewTenantPhone("");
      setNewTenantAddress("");
      setSaving(false);
      setPrevApartmentId(undefined);
    }
  }, [isOpen, initialTenantId, initialBuildingId, role, managerBuildingId]);

  // Fetch building apartments dynamically to bypass limit issues
  useEffect(() => {
    if (selectedFormBuilding) {
      Promise.all([
        apartmentService.getAllApartments({ building_id: selectedFormBuilding, limit: 100, page: 1 }),
        apartmentService.getAllApartments({ building_id: selectedFormBuilding, limit: 100, page: 2 })
      ]).then(([res1, res2]) => {
        const combined = [...res1.data, ...res2.data];
        const unique = combined.filter((a, index, self) => self.findIndex(t => t.id === a.id) === index);
        setBuildingApartments(unique);
      }).catch(() => {
        toast.error("Không thể tải danh sách căn hộ của tòa nhà");
      });
    } else {
      setBuildingApartments([]);
    }
  }, [selectedFormBuilding]);

  // Dynamic occupant-based rent pricing and security deposit auto-filling
  useEffect(() => {
    if (selectedFormApartment) {
      const apt = buildingApartments.find((a) => a.id === selectedFormApartment) || apartments.find((a) => a.id === selectedFormApartment);
      if (apt) {
        const calculatedMax = Math.max(2, apt.bedrooms * 2);
        setMaxOccupants(calculatedMax);

        const occupantsCount = actualOccupants === "" ? 1 : Number(actualOccupants);
        const extraPeople = occupantsCount > calculatedMax ? occupantsCount - calculatedMax : 0;
        const baseRent = Number(apt.rental_price);
        const calculatedRent = baseRent + extraPeople * 1000000;
        setMonthlyRent(calculatedRent);

        // Reset deposit default only when apartment changes
        if (selectedFormApartment !== prevApartmentId) {
          setDepositAmount(baseRent);
          setPrevApartmentId(selectedFormApartment);
        }
      }
    } else {
      setMonthlyRent(0);
      setDepositAmount(0);
      setMaxOccupants(2);
      setPrevApartmentId(undefined);
    }
  }, [selectedFormApartment, actualOccupants, buildingApartments, apartments, prevApartmentId]);

  const formFloors = (() => {
    if (!selectedFormBuilding) return [];
    const buildingApts = buildingApartments.filter(
      (a) => ["available", "vacant", "AVAILABLE"].includes(a.status)
    );
    const floors = buildingApts.map((a) => a.floor);
    return [...new Set(floors)].sort((a, b) => a - b);
  })();

  const formApartments = (() => {
    if (!selectedFormBuilding || !selectedFormFloor) return [];
    return buildingApartments.filter(
      (a) =>
        a.building_id === selectedFormBuilding &&
        a.floor === selectedFormFloor &&
        ["available", "vacant", "AVAILABLE"].includes(a.status)
    );
  })();
  async function handleSaveContract() {
    if (!selectedTenantId && !isNewTenant) {
      toast.error("Vui lòng chọn người thuê hoặc khai báo người thuê mới.");
      return;
    }
    if (isNewTenant && (!newTenantName || !newTenantCCCD)) {
      toast.error("Vui lòng nhập đầy đủ Họ tên và số CCCD cho người thuê mới.");
      return;
    }
    if (!selectedFormApartment || !startDate || !endDate) {
      toast.error("Vui lòng nhập đầy đủ: căn hộ, ngày bắt đầu và ngày kết thúc.");
      return;
    }

    setSaving(true);
    try {
      let finalTenantId: number;

      if (isNewTenant) {
        // Tự động tạo tài khoản người thuê mới
        const cleanCCCD = newTenantCCCD.trim();
        const last6Digits = cleanCCCD.slice(-6);
        const username = `YH${last6Digits}`;
        const defaultEmail = `${username}@yukihouse.vn`;
        const finalEmail = newTenantEmail.trim() || defaultEmail;
        const finalPhone = newTenantPhone.trim() || null;

        const userRes = await authService.createUser({
          username,
          role: "TENANT",
        });

        const tenant = await tenantService.createTenant({
          full_name: newTenantName,
          citizen_id: newTenantCCCD,
          date_of_birth: newTenantDob ? new Date(newTenantDob).toISOString() : null,
          address: newTenantAddress || null,
          email: finalEmail,
          phone: finalPhone,
          user_id: userRes.userId,
        });

        finalTenantId = tenant.id;
        toast.success(`Đã tự động tạo tài khoản "${username}" cho người thuê mới!`);
      } else {
        finalTenantId = Number(selectedTenantId);
      }

      const newContract = {
        tenant_id: finalTenantId,
        apartment_id: Number(selectedFormApartment),
        start_date: startDate,
        end_date: endDate,
        monthly_rent: monthlyRent,
        deposit_amount: depositAmount,
        status: "ACTIVE",
        contractFile: null,
        signedAt: new Date().toISOString().split("T")[0],
        createdBy: currentUser?.id || 1,
        actual_occupants: Number(actualOccupants) || 1,
        max_occupants: maxOccupants,
      };

      await createContract(newContract as any);

      // Cập nhật trạng thái căn hộ thành RENTED
      try {
        await apartmentService.updateApartment(Number(selectedFormApartment), { status: "RENTED" });
        toast.success("Đã tạo hợp đồng và cập nhật trạng thái căn hộ thành 'Đang thuê'!");
      } catch {
        toast.success("Đã tạo hợp đồng thành công!");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể tạo hợp đồng");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tạo hợp đồng mới"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={handleSaveContract} isLoading={saving}>Tạo hợp đồng</Button>
        </>
      }
    >
      <div className="space-y-6 font-sans">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 space-y-3">
            <label className="block text-sm font-semibold text-gray-800">Thông tin người thuê *</label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="tenantType"
                  checked={!isNewTenant}
                  onChange={() => setIsNewTenant(false)}
                  className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                />
                Chọn người thuê có sẵn
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="tenantType"
                  checked={isNewTenant}
                  onChange={() => setIsNewTenant(true)}
                  className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                />
                Thêm người thuê mới & Tạo tài khoản
              </label>
            </div>

            {!isNewTenant ? (
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
            ) : (
              <div className="grid grid-cols-12 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-150">
                <div className="col-span-12">
                  <Input
                    label="Họ tên *"
                    value={newTenantName}
                    onChange={(e) => setNewTenantName(e.target.value)}
                    placeholder="VD: Nguyễn Văn A"
                  />
                </div>
                <div className="col-span-12 sm:col-span-6">
                  <Input
                    label="Số CCCD *"
                    value={newTenantCCCD}
                    onChange={(e) => setNewTenantCCCD(e.target.value)}
                    placeholder="VD: 079200001234"
                  />
                </div>
                <div className="col-span-12 sm:col-span-6">
                  <Input
                    label="Ngày sinh"
                    type="date"
                    value={newTenantDob}
                    onChange={(e) => setNewTenantDob(e.target.value)}
                  />
                </div>
                <div className="col-span-12 sm:col-span-6">
                  <Input
                    label="Email"
                    type="email"
                    value={newTenantEmail}
                    onChange={(e) => setNewTenantEmail(e.target.value)}
                    placeholder="VD: tenant@gmail.com"
                  />
                </div>
                <div className="col-span-12 sm:col-span-6">
                  <Input
                    label="Số điện thoại"
                    value={newTenantPhone}
                    onChange={(e) => setNewTenantPhone(e.target.value)}
                    placeholder="VD: 0901234567"
                  />
                </div>
                <div className="col-span-12">
                  <Input
                    label="Địa chỉ"
                    value={newTenantAddress}
                    onChange={(e) => setNewTenantAddress(e.target.value)}
                    placeholder="VD: 123 Đường ABC, Quận 1"
                  />
                </div>
              </div>
            )}
          </div>

          {role !== "MANAGER" && (
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
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.branch_name}
                  </option>
                ))}
              </select>
            </div>
          )}

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

          <div className="col-span-12">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Số lượng người ở thực tế {selectedFormApartment ? `(Tối đa: ${maxOccupants} người)` : ""} *
            </label>
            <input
              type="number"
              min={1}
              value={actualOccupants}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") {
                  setActualOccupants("");
                } else {
                  setActualOccupants(Math.max(1, Number(val)));
                }
              }}
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
              const apt = buildingApartments.find((a) => a.id === selectedFormApartment) || apartments.find((a) => a.id === selectedFormApartment);
              const occupantsCount = actualOccupants === "" ? 1 : Number(actualOccupants);
              if (apt && occupantsCount > maxOccupants) {
                return (
                  <span className="text-[11px] text-amber-600 font-semibold mt-1 block">
                    (Phụ thu {formatCurrency((occupantsCount - maxOccupants) * 1000000)} do quá số người ở quy định)
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
          </div>
        </div>
      </div>
    </Modal>
  );
}
