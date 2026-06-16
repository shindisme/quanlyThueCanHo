import { useState, useEffect } from "react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import { toast } from "sonner";
import * as staffService from "../../../../services/staffService";
import * as buildingService from "../../../../services/buildingService";
import type { BuildingData } from "../../../../services/buildingService";
import * as authService from "../../../../services/authService";
import type { UserData } from "../../../../services/authService";
import type { Staff } from "../../../../types";

interface StaffCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const POSITIONS = ["Quản lý", "Bảo vệ", "Vệ sinh", "Kỹ thuật", "Kế toán"];

export default function StaffCreateModal({
  isOpen,
  onClose,
  onSuccess,
}: StaffCreateModalProps) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState(POSITIONS[0]);
  const [buildingId, setBuildingId] = useState<number | "">("");

  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextUsername, setNextUsername] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (users.length > 0) {
      const isManager = position === "Quản lý";
      const prefix = isManager ? "quanly" : "nhanvien";
      const filteredUsers = users.filter((u) => u.username.startsWith(prefix));
      let nextIndex = 1;
      if (filteredUsers.length > 0) {
        const indices = filteredUsers.map((u) => {
          const match = u.username.match(new RegExp(`^${prefix}(\\d+)$`));
          return match ? parseInt(match[1], 10) : 0;
        });
        nextIndex = Math.max(...indices, 0) + 1;
      }
      setNextUsername(`${prefix}${nextIndex}`);
    } else {
      setNextUsername("");
    }
  }, [position, users]);

  async function fetchData() {
    try {
      setLoading(true);
      const bRes = await buildingService.getAllBuildings({ limit: 100 });
      setBuildings(bRes.data);
      const uRes = await authService.getAllUsers();
      setUsers(uRes);
      const sRes = await staffService.getAllStaff();
      setStaffList(sRes.data);
    } catch {
      toast.error("Không thể tải dữ liệu liên kết");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!fullName) {
      toast.error("Vui lòng nhập họ tên nhân viên");
      return;
    }
    setLoading(true);
    try {
      const isManager = position === "Quản lý";
      const roleToCreate = isManager ? "MANAGER" : "STAFF";

      // Tự động tạo tài khoản theo thứ tự
      const res = await authService.createUser({
        username: nextUsername,
        role: roleToCreate,
      });

      await staffService.createStaff({
        full_name: fullName,
        phone: phone || null,
        position,
        building_id: buildingId ? Number(buildingId) : null,
        user_id: res.userId,
      });

      toast.success(`Đã tự động cấp tài khoản "${nextUsername}" (mật khẩu mặc định: 123456) và thêm nhân viên thành công!`);

      setFullName("");
      setPhone("");
      setPosition(POSITIONS[0]);
      setBuildingId("");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.message || "Không thể thêm nhân viên");
    } finally {
      setLoading(false);
    }
  }

  // Danh sách ID các tòa nhà đã có Quản lý phụ trách
  const managedBuildingIds = staffList
    .filter((s) => s.position === "Quản lý" && s.building_id)
    .map((s) => s.building_id as number);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm nhân viên mới"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={handleSave} disabled={loading}>Thêm mới</Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 sm:col-span-6">
            <Input
              label="Họ tên *"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
            />
          </div>
          <div className="col-span-12 sm:col-span-6">
            <Input
              label="Số điện thoại"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0987654321"
            />
          </div>
          <div className="col-span-12 sm:col-span-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Chức vụ *</label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="premium-input rounded-xl bg-white w-full border border-gray-300 py-2.5 px-3 text-sm focus:outline-none focus:border-primary-500"
            >
              {POSITIONS.map((pos) => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
          </div>
          <div className="col-span-12 sm:col-span-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tòa nhà làm việc</label>
            <select
              value={buildingId}
              onChange={(e) => setBuildingId(e.target.value ? Number(e.target.value) : "")}
              className="premium-input rounded-xl bg-white w-full border border-gray-300 py-2.5 px-3 text-sm focus:outline-none focus:border-primary-500"
            >
              <option value="">-- Chưa gán tòa nhà --</option>
              {buildings.map((b) => {
                const isAlreadyManaged = position === "Quản lý" && managedBuildingIds.includes(b.id);
                return (
                  <option key={b.id} value={b.id} disabled={isAlreadyManaged}>
                    {b.branch_name} {isAlreadyManaged ? "(Đã có Quản lý)" : ""}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="col-span-12">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tài khoản liên kết (Tự động cấp)</label>
            <div className="premium-input rounded-xl bg-gray-50 border border-gray-300 py-2.5 px-3 text-sm text-gray-650 font-semibold">
              Tài khoản: <span className="text-primary-600">{nextUsername || "Đang tính..."}</span> (Mật khẩu mặc định: 123456)
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
