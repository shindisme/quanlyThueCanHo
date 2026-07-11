import { User, Mail, Save, Plus, Pencil, Trash2, FileText, Phone } from "lucide-react";
import Button from "../../../components/ui/Button";
import PageHeader from "../../../components/PageHeader";
import Modal from "../../../components/ui/Modal";
import Input from "../../../components/ui/Input";
import { DatePicker } from "../../../components/ui/DatePicker";
import { formatCurrency } from "../../../utils/currency";
import { formatDate } from "../../../utils/date";
import { useProfile, type Occupant } from "./hooks/useProfile";

export default function ProfilePage() {
  const {
    email,
    role,
    oldPass,
    setOldPass,
    newPass,
    setNewPass,
    confirmPass,
    setConfirmPass,
    saving,
    userContract,
    apartmentInfo,
    buildingInfo,
    occupants,
    showOccupantModal,
    setShowOccupantModal,
    editOccupant,
    occupantForm,
    setOccupantForm,
    handleOpenOccupantForm,
    handleDeleteOccupant,
    handleSaveOccupant,
    handleChangePassword,
    fullName,
    phone,
    editFullName,
    setEditFullName,
    editPhone,
    setEditPhone,
    showEditProfileModal,
    setShowEditProfileModal,
    handleOpenEditProfile,
    handleSaveProfile,
    maxOccupantsLimit,
  } = useProfile();

  const displayName = fullName || email?.split("@")[0] || "User";
  const roleLabel =
    role === "ADMIN" ? "Quản trị viên" :
      role === "MANAGER" ? "Quản lý" : "Người thuê";

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        icon={User}
        title="Hồ sơ cá nhân"
        subtitle="Xem thông tin tài khoản và đổi mật khẩu bảo mật"
        iconColor="linear-gradient(135deg, #7C3AED, #A78BFA)"
      />

      {/* Thông tin cá nhân */}
      <div className="premium-card p-6 relative">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-semibold text-gray-800">Thông tin tài khoản</h3>
          {role !== "ADMIN" && (
            <button
              onClick={handleOpenEditProfile}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-primary-200 text-primary-600 hover:bg-primary-50 cursor-pointer flex items-center gap-1 font-semibold transition-all"
            >
              <Pencil size={12} /> Sửa thông tin
            </button>
          )}
        </div>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-md text-white text-2xl font-bold" style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)" }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-800">{displayName}</p>
            <p className="text-sm text-gray-500">{roleLabel}</p>
          </div>
        </div>

        <div className="space-y-4">
          {role === "ADMIN" ? (
            <div className="flex items-center gap-3">
              <Mail size={18} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-sm font-medium text-gray-800">{email}</p>
              </div>
            </div>
          ) : (
            phone && (
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">Số điện thoại</p>
                  <p className="text-sm font-medium text-gray-800">{phone}</p>
                </div>
              </div>
            )
          )}
          <div className="flex items-center gap-3">
            <User size={18} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Vai trò</p>
              <p className="text-sm font-medium text-gray-800">{roleLabel}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Đổi mật khẩu - kết nối API thật */}
      <div className="premium-card p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Đổi mật khẩu</h3>
        <div className="space-y-4">
          <Input
            label="Mật khẩu hiện tại"
            type="password"
            value={oldPass}
            onChange={(e) => setOldPass(e.target.value)}
            className="rounded-md"
          />
          <Input
            label="Mật khẩu mới"
            type="password"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            className="rounded-md"
          />
          <Input
            label="Xác nhận mật khẩu mới"
            type="password"
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
            className="rounded-md"
          />
          <Button onClick={handleChangePassword} isLoading={saving}>
            <Save size={16} /> Đổi mật khẩu
          </Button>
        </div>
      </div>

      {/* Thông tin hợp đồng đang thuê */}
      {role === "TENANT" && userContract && (
        <div className="premium-card p-6 space-y-4">
          <div className="flex items-center gap-3 border-b pb-3 border-gray-155">
            <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center shrink-0">
              <FileText size={20} className="text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Thông tin hợp đồng đang thuê</h3>
              <p className="text-xs text-gray-400 mt-0.5">Chi tiết hợp đồng thuê căn hộ hiện tại của bạn</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-sans">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Mã hợp đồng:</span>
                <span className="font-semibold text-primary-600">HD-{String(userContract.id).padStart(5, "0")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Chi nhánh / Tòa nhà:</span>
                <span className="font-medium text-gray-800">{buildingInfo?.branch_name || "Yuki House"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Căn hộ:</span>
                <span className="font-semibold text-gray-800">
                  {apartmentInfo ? `Phòng ${apartmentInfo.floor}${apartmentInfo.room_number}` : "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tiền thuê / tháng:</span>
                <span className="font-bold text-[#3f6ad8]">{formatCurrency(userContract.monthly_rent)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Tiền đặt cọc:</span>
                <span className="font-semibold text-gray-800">{formatCurrency(userContract.deposit_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ngày bắt đầu:</span>
                <span className="font-medium text-gray-800">{formatDate(userContract.start_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ngày kết thúc:</span>
                <span className="font-medium text-gray-800">{formatDate(userContract.end_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Trạng thái hợp đồng:</span>
                <span className="font-semibold text-green-600 bg-green-50 px-2.5 py-0.5 rounded-md text-xs">
                  Đang hoạt động
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Khai báo người ở cùng */}
      {role === "TENANT" && (
        <div className="premium-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">Khai báo người ở cùng</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Khai báo thông tin những người sinh hoạt cùng căn hộ của bạn.
                Giới hạn tối đa theo hợp đồng: <span className="font-bold text-primary-600">{maxOccupantsLimit} người</span>.
              </p>
            </div>
            <Button size="sm" onClick={() => handleOpenOccupantForm(null)}>
              <Plus size={16} /> Khai báo người ở
            </Button>
          </div>

          <div className="overflow-x-auto border border-gray-150 overflow-hidden bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Họ và tên</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Số CCCD</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Ngày sinh</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">SĐT</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Chức năng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {occupants.map((occ: Occupant) => (
                  <tr key={occ.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{occ.name}</td>
                    <td className="px-4 py-3 text-gray-600">{occ.cccd}</td>
                    <td className="px-4 py-3 text-gray-600">{occ.dob ? new Date(occ.dob).toLocaleDateString("vi-VN") : "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{occ.phone || "-"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenOccupantForm(occ)}
                          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteOccupant(occ.id)}
                          className="p-1.5 text-gray-400 hover:text-red-650 hover:bg-red-50 rounded-lg cursor-pointer"
                          title="Xóa"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {occupants.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      Chưa khai báo người ở cùng nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Modal*/}
          <Modal
            isOpen={showOccupantModal}
            onClose={() => setShowOccupantModal(false)}
            title={editOccupant ? "Chỉnh sửa thông tin người ở" : "Khai báo người ở cùng mới"}
            footer={
              <>
                <Button variant="outline" onClick={() => setShowOccupantModal(false)}>Hủy</Button>
                <Button onClick={handleSaveOccupant}>Lưu thông tin</Button>
              </>
            }
          >
            <div className="space-y-4">
              <Input
                label="Họ và tên"
                value={occupantForm.name}
                onChange={(e) => setOccupantForm({ ...occupantForm, name: e.target.value })}
                placeholder="Nhập họ và tên"
              />
              <Input
                label="Số CCCD (Căn cước công dân)"
                value={occupantForm.cccd}
                onChange={(e) => setOccupantForm({ ...occupantForm, cccd: e.target.value })}
                placeholder="Nhập số CCCD"
              />
              <div className="w-full">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ngày sinh</label>
                <DatePicker
                  value={occupantForm.dob || null}
                  onChange={(date) => {
                    if (!date) {
                      setOccupantForm({ ...occupantForm, dob: "" });
                      return;
                    }
                    const y = date.getFullYear();
                    const m = String(date.getMonth() + 1).padStart(2, "0");
                    const d = String(date.getDate()).padStart(2, "0");
                    setOccupantForm({ ...occupantForm, dob: `${y}-${m}-${d}` });
                  }}
                  placeholder="Chọn ngày sinh..."
                />
              </div>
              <Input
                label="Số điện thoại"
                value={occupantForm.phone}
                onChange={(e) => setOccupantForm({ ...occupantForm, phone: e.target.value })}
                placeholder="Nhập số điện thoại"
              />
            </div>
          </Modal>

          {/* Modal Sửa Thông Tin Tài Khoản */}
          <Modal
            isOpen={showEditProfileModal}
            onClose={() => setShowEditProfileModal(false)}
            title="Chỉnh sửa thông tin tài khoản"
            footer={
              <>
                <Button variant="outline" onClick={() => setShowEditProfileModal(false)}>
                  Hủy
                </Button>
                <Button onClick={handleSaveProfile}>
                  Lưu thay đổi
                </Button>
              </>
            }
          >
            <div className="space-y-4 font-sans text-xs sm:text-sm">
              <Input
                label="Tên tài khoản (Email)"
                value={email || ""}
                disabled
                className="bg-gray-50 text-gray-500 rounded-xl"
              />
              <Input
                label="Họ và tên"
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                placeholder="Nhập họ và tên..."
                className="rounded-xl"
              />
              <Input
                label="Số điện thoại"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="Nhập số điện thoại..."
                className="rounded-xl"
              />
            </div>
          </Modal>
        </div>
      )}
    </div>
  );
}
