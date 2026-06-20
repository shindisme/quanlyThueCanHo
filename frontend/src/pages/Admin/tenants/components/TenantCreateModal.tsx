import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import { toast } from "sonner";
import * as tenantService from "../../../../services/tenantService";
import * as authService from "../../../../services/authService";
import * as buildingService from "../../../../services/buildingService";
import * as apartmentService from "../../../../services/apartmentService";
import api from "../../../../lib/api";

interface TenantCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  role: string | null;
  managerBuildingId?: number;
}

export default function TenantCreateModal({
  isOpen,
  onClose,
  onSuccess,
  role,
  managerBuildingId,
}: TenantCreateModalProps) {
  const navigate = useNavigate();
  const [formFullName, setFormFullName] = useState("");
  const [formCitizenId, setFormCitizenId] = useState("");
  const [formDob, setFormDob] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");

  const [buildings, setBuildings] = useState<any[]>([]);
  const [apartments, setApartments] = useState<any[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | "">("");
  const [selectedApartmentId, setSelectedApartmentId] = useState<number | "">("");

  useEffect(() => {
    if (isOpen) {
      buildingService.getAllBuildings({ limit: 100 }).then(res => {
        setBuildings(res.data);
        if (managerBuildingId) {
          setSelectedBuildingId(managerBuildingId);
        }
      }).catch(() => {
        toast.error("Không thể tải danh sách tòa nhà");
      });
    }
  }, [isOpen, managerBuildingId]);

  useEffect(() => {
    if (selectedBuildingId) {
      apartmentService.getAllApartments({ building_id: Number(selectedBuildingId), status: "AVAILABLE", limit: 200 }).then(res => {
        setApartments(res.data);
      }).catch(() => {
        toast.error("Không thể tải danh sách căn hộ");
      });
    } else {
      setApartments([]);
      setSelectedApartmentId("");
    }
  }, [selectedBuildingId]);

  async function handleSaveTenantAndUser() {
    if (!formFullName || !formCitizenId) {
      toast.error("Vui lòng nhập đầy đủ Họ tên và số CCCD");
      return;
    }

    const cleanCCCD = formCitizenId.trim();
    const last6Digits = cleanCCCD.slice(-6);
    const username = `YH${last6Digits}`;
    const defaultEmail = `${username}@yukihouse.vn`;
    const finalEmail = formEmail.trim() || defaultEmail;
    const finalPhone = formPhone.trim() || null;

    try {
      const userRes = await authService.createUser({
        username,
        role: "TENANT",
      });

      const tenant = await tenantService.createTenant({
        full_name: formFullName,
        citizen_id: formCitizenId,
        date_of_birth: formDob ? new Date(formDob).toISOString() : null,
        address: formAddress || null,
        email: finalEmail,
        phone: finalPhone,
        user_id: userRes.userId,
      });

      if (selectedApartmentId) {
        const selectedApt = apartments.find(a => a.id === Number(selectedApartmentId));
        const rent = selectedApt ? Number(selectedApt.rental_price) : 5000000;

        await api.post("/contracts", {
          apartment_id: Number(selectedApartmentId),
          tenant_id: tenant.id,
          start_date: new Date().toISOString(),
          end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
          deposit_amount: rent * 2,
          monthly_rent: rent,
          signed_at: new Date().toISOString(),
        });
      }

      toast.success(`Đã tự động tạo tài khoản "${username}" và gán căn hộ thành công!`);

      // Reset fields
      setFormFullName("");
      setFormCitizenId("");
      setFormDob("");
      setFormAddress("");
      setFormEmail("");
      setFormPhone("");
      setSelectedBuildingId("");
      setSelectedApartmentId("");

      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể tạo người thuê");
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm người thuê mới"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={handleSaveTenantAndUser}>Lưu thông tin & Gán phòng</Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12">
            <Input label="Họ tên *" value={formFullName} onChange={(e) => setFormFullName(e.target.value)} placeholder="Nhập họ tên" />
          </div>
          <div className="col-span-12 sm:col-span-6">
            <Input label="CCCD *" value={formCitizenId} onChange={(e) => setFormCitizenId(e.target.value)} placeholder="Nhập số CCCD" />
          </div>
          <div className="col-span-12 sm:col-span-6">
            <Input label="Ngày sinh" type="date" value={formDob} onChange={(e) => setFormDob(e.target.value)} />
          </div>
          <div className="col-span-12 sm:col-span-6">
            <Input label="Email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="Nhập email" />
          </div>
          <div className="col-span-12 sm:col-span-6">
            <Input label="Số điện thoại" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="Nhập số điện thoại" />
          </div>
          <div className="col-span-12">
            <Input label="Địa chỉ" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} placeholder="Nhập địa chỉ" />
          </div>
          <div className="col-span-12 sm:col-span-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5 font-sans">Chọn tòa nhà</label>
            <select
              value={selectedBuildingId}
              onChange={(e) => setSelectedBuildingId(e.target.value ? Number(e.target.value) : "")}
              className="premium-input rounded-xl w-full bg-white border border-gray-300 py-2.5 px-3 text-sm focus:outline-none focus:border-primary-500"
              disabled={role === "MANAGER" && !!managerBuildingId}
            >
              <option value="">-- Chọn tòa nhà --</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>{b.branch_name}</option>
              ))}
            </select>
          </div>
          <div className="col-span-12 sm:col-span-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5 font-sans">Chọn căn hộ trống</label>
            <select
              value={selectedApartmentId}
              onChange={(e) => setSelectedApartmentId(e.target.value ? Number(e.target.value) : "")}
              className="premium-input rounded-xl w-full bg-white border border-gray-300 py-2.5 px-3 text-sm focus:outline-none focus:border-primary-500"
              disabled={!selectedBuildingId}
            >
              <option value="">-- Chưa gán căn hộ --</option>
              {apartments.map((a) => (
                <option key={a.id} value={a.id}>Phòng {a.room_number} (Tầng {a.floor} - {Number(a.rental_price).toLocaleString("vi-VN")} đ)</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </Modal>
  );
}
