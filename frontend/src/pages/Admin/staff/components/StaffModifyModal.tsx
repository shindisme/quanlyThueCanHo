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

interface StaffModifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editItem: Staff | null;
}

const POSITIONS = ["Quản lý", "Bảo vệ", "Vệ sinh", "Kỹ thuật", "Kế toán"];

export default function StaffModifyModal({
  isOpen,
  onClose,
  onSuccess,
  editItem,
}: StaffModifyModalProps) {
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
    if (editItem && isOpen) {
      setFullName(editItem.full_name);
      setPhone(editItem.phone || "");
      setPosition(editItem.position);
      setBuildingId(editItem.building_id || "");
    }
  }, [editItem, isOpen]);

  useEffect(() => {
    if (users.length > 0 && editItem && !editItem.user_id) {
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
  }, [position, users, editItem]);

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
    if (!fullName || !editItem) {
      toast.error("Vui lòng nhập họ tên nhân viên");
      return;
    }
    setLoading(true);
    try {
      let linkedUserId = editItem.user_id;

      // Nếu chưa có tài khoản, tự động tạo tài khoản theo thứ tự dựa trên chức vụ mới
      if (!editItem.user_id) {
        const isManager = position === "Quản lý";
        const roleToCreate = isManager ? "MANAGER" : "STAFF";

        const res = await authService.createUser({
          username: nextUsername,
          role: roleToCreate,
        });
        linkedUserId = res.userId;
      }

      await staffService.updateStaff(editItem.id, {
        full_name: fullName,
        phone: phone || null,
        position,
        building_id: buildingId ? Number(buildingId) : null,
        user_id: linkedUserId,
      });

      if (!editItem.user_id) {
        toast.success(`Đã tự động cấp tài khoản "${nextUsername}" (mật khẩu mặc định: 123456) và cập nhật thành công!`);
      } else {
        toast.success("Cập nhật thông tin nhân viên thành công!");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.message || "Không thể cập nhật nhân viên");
    } finally {
      setLoading(false);
    }
  }

  const hasLinkedUser = editItem && editItem.user_id;

  // Danh sách ID các tòa nhà đã có Quản lý phụ trách
  const managedBuildingIds = staffList
    .filter((s) => s.position === "Quản lý" && s.building_id)
    .map((s) => s.building_id as number);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chỉnh sửa thông tin nhân viên"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={handleSave} disabled={loading}>Cập nhật</Button>
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
                // Cho phép giữ tòa nhà hiện tại của quản lý đang sửa
                const isAlreadyManaged =
                  position === "Quản lý" &&
                  managedBuildingIds.includes(b.id) &&
                  b.id !== editItem?.building_id;
                return (
                  <option key={b.id} value={b.id} disabled={isAlreadyManaged}>
                    {b.branch_name} {isAlreadyManaged ? "(Đã có Quản lý)" : ""}
                  </option>
                );
              })}
            </select>
          </div>

          {!hasLinkedUser ? (
            <div className="col-span-12">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Cấp tài khoản tự động</label>
              <div className="premium-input rounded-xl bg-gray-50 border border-gray-300 py-2.5 px-3 text-sm text-gray-600 font-semibold">
                Tài khoản: <span className="text-primary-600">{nextUsername || "Đang tính..."}</span> (Mật khẩu mặc định: 123456)
              </div>
            </div>
          ) : (
            <div className="col-span-12">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tài khoản liên kết đã có</label>
              <div className="premium-input rounded-xl bg-gray-50 border border-gray-300 py-2.5 px-3 text-sm text-gray-500 font-semibold">
                Tài khoản: @{editItem?.user?.username}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
