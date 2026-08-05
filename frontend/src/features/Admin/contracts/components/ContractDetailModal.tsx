import { useMemo } from "react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Badge from "../../../../components/ui/Badge";
import type { RentalContract } from "../../../../types";
import type { Tenant } from "../../../../types";
import type { Building } from "../../../../types";
import type { Apartment } from "../../../../types";
import type { User as UserType } from "../../../../types/user";
import { formatCurrency } from "../../../../utils/currency";
import { formatDate } from "../../../../utils/date";
import { formatApartmentDisplay } from "../../../../utils/string";
import { Users } from "lucide-react";

interface ContractDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: RentalContract | null;
  buildings: Building[];
  apartments: Apartment[];
  tenants: Tenant[];
  users: UserType[];
  role: string | null;
}

// Phụ thu quá tải số người ở
const SURCHARGE_PER_PERSON = 1_000_000;

function renderContractStatusBadge(status: string) {
  if (status === "ACTIVE") return <Badge variant="success">Còn hạn</Badge>;
  if (status === "ENDED") return <Badge variant="gray">Hết hạn</Badge>;
  return <Badge variant="danger">Đã thanh lý</Badge>;
}

export default function ContractDetailModal({
  isOpen,
  onClose,
  contract,
  buildings,
  apartments,
  tenants,
  users,
  role,
}: ContractDetailModalProps) {
  const tenantMap = useMemo(() => new Map(tenants.map((t) => [t.id, t])), [tenants]);
  const apartmentMap = useMemo(() => new Map(apartments.map((a) => [a.id, a])), [apartments]);
  const buildingMap = useMemo(() => new Map(buildings.map((b) => [b.id, b])), [buildings]);
  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  if (!contract) return null;

  const tenant = tenantMap.get(contract.tenant_id);
  const apt = apartmentMap.get(contract.apartment_id);
  const bld = apt ? buildingMap.get(apt.building_id) : null;
  const tenantUser = tenant && tenant.user_id ? userMap.get(tenant.user_id) : null;
  const creator = contract.createdBy ? userMap.get(contract.createdBy) : null;

  const maxOcc = contract.max_occupants || (apt ? Math.max(2, apt.bedrooms * 2) : 2);
  const actOcc = contract.actual_occupants || 1;
  const excess = actOcc > maxOcc ? actOcc - maxOcc : 0;
  const excessSurcharge = excess * SURCHARGE_PER_PERSON;
  const baseRent = apt ? apt.rental_price : contract.monthly_rent - excessSurcharge;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết hợp đồng"
      size="lg"
      footer={
        <div className="flex justify-end">
          <Button onClick={onClose}>Đóng</Button>
        </div>
      }
    >
      <div className="space-y-6 font-sans text-sm">
        {/* Header info bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-primary-50/50 border border-primary-100/50">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-gray-800">
              Mã HĐ: HD-{String(contract.id).padStart(5, "0")}
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-gray-400">Trạng thái</p>
              <div className="mt-0.5">{renderContractStatusBadge(contract.status)}</div>
            </div>
          </div>
        </div>

        {/* Grid details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Khách thuê */}
          <div className="bg-white p-5 border border-gray-100 shadow-xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <h4 className="font-bold text-gray-800">Thông tin khách thuê</h4>
            </div>
            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <span className="text-gray-400 block text-xs">Họ và tên</span>
                <span className="font-semibold text-gray-800">{tenant?.full_name || "Chưa cập nhật"}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-xs">Số CMND/CCCD</span>
                <span className="font-medium text-gray-800">{tenant?.citizen_id || "Chưa cập nhật"}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-400 block text-xs">Số điện thoại</span>
                  <span className="font-medium text-gray-800">{tenantUser?.phone || tenant?.phone || "Chưa cập nhật"}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs">Email</span>
                  <span className="font-medium text-gray-800 break-all">{tenant?.email || "Chưa cập nhật"}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-400 block text-xs">Ngày sinh</span>
                  <span className="font-medium text-gray-800">
                    {tenant?.date_of_birth ? formatDate(tenant.date_of_birth) : "Chưa cập nhật"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs">Địa chỉ thường trú</span>
                  <span className="font-medium text-gray-800">{tenant?.address || "Chưa cập nhật"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Căn hộ */}
          <div className="bg-white p-5 border border-gray-100 shadow-xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <h4 className="font-bold text-gray-800">Thông tin căn hộ</h4>
            </div>
            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <span className="text-gray-400 block text-xs">Chi nhánh / Tòa nhà</span>
                <span className="font-semibold text-primary-600">
                  {bld?.branch_name || "Yuki House"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-400 block text-xs">Số phòng</span>
                  <span className="font-bold text-gray-800">
                    {apt ? formatApartmentDisplay(apt.room_number, apt.floor, role || undefined, bld?.branch_name) : "..."}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs">Tầng</span>
                  <span className="font-medium text-gray-800">Tầng {apt?.floor || "..."}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-gray-400 block text-xs">Diện tích</span>
                  <span className="font-medium text-gray-800">{apt?.area || "..."} m²</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs">Phòng ngủ</span>
                  <span className="font-medium text-gray-800">{apt?.bedrooms || 1} PN</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs">Phòng tắm</span>
                  <span className="font-medium text-gray-800">{apt?.bathrooms || 1} WC</span>
                </div>
              </div>
              <div>
                <span className="text-gray-400 block text-xs">Địa chỉ tòa nhà</span>
                <span className="font-medium text-gray-800">{bld?.address || "Chưa cập nhật"}</span>
              </div>
            </div>
          </div>

          {/* Thời hạn & người lập */}
          <div className="bg-white p-5 border border-gray-100 shadow-xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <h4 className="font-bold text-gray-800">Thời hạn & Pháp lý</h4>
            </div>
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-400 block text-xs">Ngày bắt đầu</span>
                  <span className="font-semibold text-gray-800">{formatDate(contract.start_date)}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs">Ngày kết thúc</span>
                  <span className="font-semibold text-gray-800">{formatDate(contract.end_date)}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-400 block text-xs">Ngày ký kết</span>
                  <span className="font-medium text-gray-800">
                    {contract.signedAt ? formatDate(contract.signedAt) : formatDate(contract.created_at || "")}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs">Người lập hợp đồng</span>
                  <span className="font-medium text-gray-800">{creator?.username || "Ban quản lý"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tài chính & Số người */}
          <div className="bg-white p-5 border border-gray-100 shadow-xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <h4 className="font-bold text-gray-800">Tài chính & Quy mô</h4>
            </div>
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-400 block text-xs">Tiền thuê / tháng</span>
                  <span className="font-bold text-primary-600 text-base">
                    {formatCurrency(contract.monthly_rent)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs">Tiền cọc</span>
                  <span className="font-bold text-gray-800 text-base">
                    {formatCurrency(contract.deposit_amount)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1 border-t border-gray-50">
                <div>
                  <span className="text-gray-400 block text-xs">Số người ở thực tế</span>
                  <span className="font-semibold text-gray-800">{actOcc} người</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs">Tối đa cho phép</span>
                  <span className="font-medium text-gray-800">{maxOcc} người</span>
                </div>
              </div>

              {excess > 0 && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-amber-800 text-xs font-medium space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Users size={14} />
                    <span>Phụ thu quá tải số người</span>
                  </div>
                  <p>
                    Vượt quá giới hạn {excess} người. Đã cộng thêm {formatCurrency(excessSurcharge)}/tháng vào giá tiền thuê (giá thuê gốc: {formatCurrency(baseRent)}/tháng).
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
