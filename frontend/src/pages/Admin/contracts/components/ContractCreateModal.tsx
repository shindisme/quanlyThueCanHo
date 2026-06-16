import { useState, useEffect } from "react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import * as apartmentService from "../../../../services/apartmentService";
import type { ApartmentData } from "../../../../services/apartmentService";
import type { BuildingData } from "../../../../services/buildingService";
import type { Tenant } from "../../../../types";
import { formatCurrency } from "../../../../utils/format";
import { mockContracts } from "../../../../data/contracts";
import { toast } from "sonner";

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
  const [actualOccupants, setActualOccupants] = useState<number>(1);
  const [maxOccupants, setMaxOccupants] = useState<number>(2);

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
    }
  }, [isOpen, initialTenantId, initialBuildingId, role, managerBuildingId]);

  // Dynamic occupant-based rent pricing and security deposit auto-filling
  useEffect(() => {
    if (selectedFormApartment) {
      const apt = apartments.find((a) => a.id === selectedFormApartment);
      if (apt) {
        const calculatedMax = apt.bedrooms * 2;
        setMaxOccupants(calculatedMax);

        const extraPeople = actualOccupants > calculatedMax ? actualOccupants - calculatedMax : 0;
        const calculatedRent = Number(apt.rental_price) + extraPeople * 1000000;
        setMonthlyRent(calculatedRent);
        setDepositAmount(calculatedRent);
      }
    } else {
      setMonthlyRent(0);
      setDepositAmount(0);
      setMaxOccupants(2);
    }
  }, [selectedFormApartment, actualOccupants, apartments]);

  const formFloors = (() => {
    if (!selectedFormBuilding) return [];
    const buildingApts = apartments.filter(
      (a) => a.building_id === selectedFormBuilding && ["available", "vacant", "AVAILABLE"].includes(a.status)
    );
    const floors = buildingApts.map((a) => a.floor);
    return [...new Set(floors)].sort((a, b) => a - b);
  })();

  const formApartments = (() => {
    if (!selectedFormBuilding || !selectedFormFloor) return [];
    return apartments.filter(
      (a) =>
        a.building_id === selectedFormBuilding &&
        a.floor === selectedFormFloor &&
        ["available", "vacant", "AVAILABLE"].includes(a.status)
    );
  })();

  function handleSaveContract() {
    if (!selectedTenantId || !selectedFormApartment || !startDate || !endDate) {
      toast.error("Vui lòng nhập đầy đủ: Người thuê, căn hộ, ngày bắt đầu và ngày kết thúc.");
      return;
    }

    const stored = localStorage.getItem("custom-contracts");
    const list = stored ? JSON.parse(stored) : [...mockContracts];

    const newId = Date.now();
    const newContract = {
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

    // Cập nhật trạng thái căn hộ thành RENTED
    apartmentService
      .updateApartment(Number(selectedFormApartment), { status: "RENTED" })
      .then(() => {
        toast.success("Đã tạo hợp đồng và cập nhật trạng thái căn hộ thành 'Đang thuê'!");
        onSuccess();
        onClose();
      })
      .catch(() => {
        toast.success("Đã tạo hợp đồng thành công!");
        onSuccess();
        onClose();
      });
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
  );
}
