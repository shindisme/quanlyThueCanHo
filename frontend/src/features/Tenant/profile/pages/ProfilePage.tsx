import { useState } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Phone,
  Pencil,
  Lock,
  Eye,
  EyeOff,
  Home,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import Button from "../../../../components/ui/Button";
import PageHeader from "../../../../components/PageHeader";
import Modal from "../../../../components/ui/Modal";
import Input from "../../../../components/ui/Input";
import { formatApartmentDisplay } from "../../../../utils/string";
import { useProfile } from "../hooks/useProfile";

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
    currentStaff,
    staffBuildingInfo,
    occupants,
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

  const [activeTab, setActiveTab] = useState<"info" | "security">("info");
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const displayName = fullName || email?.split("@")[0] || "Người dùng";
  const roleLabel =
    role === "ADMIN" ? "Quản trị viên" :
      role === "MANAGER" ? "Quản lý tòa nhà" :
        role === "STAFF" ? "Nhân viên kỹ thuật" : "Cư dân thuê căn hộ";

  const roleColorClass =
    role === "ADMIN" ? "bg-purple-100 text-purple-700 border-purple-200" :
      role === "MANAGER" ? "bg-indigo-100 text-indigo-700 border-indigo-200" :
        role === "STAFF" ? "bg-sky-100 text-sky-700 border-sky-200" : "bg-emerald-100 text-emerald-700 border-emerald-200";

  return (
    <div className="space-y-6 max-w-5xl font-sans p-2">
      <PageHeader
        icon={User}
        title="Hồ sơ tài khoản"
        subtitle="Quản lý thông tin cá nhân, cài đặt bảo mật và thông tin hợp đồng thuê"
        iconColor="linear-gradient(135deg, #6366F1, #8B5CF6)"
      />

      {/* Hero Profile Banner */}
      <div className="bg-white border border-gray-200 shadow-md p-6 overflow-hidden transition-all space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            {/* Hexagon Logo Badge */}
            <div
              className="w-20 h-20 bg-[#6366F1] text-white font-extrabold text-3xl flex items-center justify-center shadow-xl ring-4 ring-white shrink-0"
              style={{
                clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold text-gray-900">{displayName}</h2>
                <span className={`px-3 py-0.5 text-xs font-semibold border ${roleColorClass}`}>
                  {roleLabel}
                </span>
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-2">
                {phone && (
                  <>
                    <Phone size={14} className="text-gray-400" /> {phone}
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Hạn ngạch phòng nếu là cư dân */}
            {role === "TENANT" && userContract && (
              <div className="bg-violet-50/70 border border-violet-100 p-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-600 text-white flex items-center justify-center">
                  <Home size={18} />
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-gray-800">
                    {apartmentInfo ? formatApartmentDisplay(apartmentInfo.room_number, apartmentInfo.floor) : "Căn hộ của tôi"}
                  </p>
                  <p className="text-violet-600 font-medium mt-0.5">
                    {buildingInfo?.branch_name || "Yuki House"}
                  </p>
                </div>
              </div>
            )}

            {role === "MANAGER" && (
              <div className="bg-violet-50/70 border border-violet-100 p-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-600 text-white flex items-center justify-center">
                  <Home size={18} />
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-gray-800">
                    Chi nhánh phụ trách
                  </p>
                  <p className="text-violet-600 font-bold mt-0.5">
                    {staffBuildingInfo?.branch_name || "Tất cả chi nhánh"}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleOpenEditProfile}
              className="px-4 py-2.5 bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-violet-200 shadow-sm rounded-xl"
            >
              <Pencil size={14} /> Chỉnh sửa hồ sơ
            </button>
          </div>
        </div>

        {/* Tab Header Navigation */}
        <div className="border-t border-gray-200 pt-2 flex items-center gap-8 overflow-x-auto text-sm font-medium">
          <button
            onClick={() => setActiveTab("info")}
            className={`py-3.5 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === "info"
              ? "border-violet-600 text-violet-600 font-bold"
              : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
          >
            <User size={16} /> Thông tin cá nhân
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`py-3.5 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === "security"
              ? "border-violet-600 text-violet-600 font-bold"
              : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
          >
            <Lock size={16} /> Đổi mật khẩu & Bảo mật
          </button>
        </div>
      </div>

      {/* TAB CONTENT: Thông tin cá nhân */}
      {activeTab === "info" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-bold text-gray-800 text-base">Chi tiết tài khoản</h3>
                <button
                  onClick={handleOpenEditProfile}
                  className="text-xs font-semibold text-violet-600 hover:text-violet-700 hover:bg-violet-50 px-2.5 py-1 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Pencil size={12} /> Cập nhật
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-gray-50/70 border border-gray-100">
                  <p className="text-xs text-gray-400 font-medium">Họ và tên hiển thị</p>
                  <p className="text-sm font-semibold text-gray-800 mt-1">{displayName}</p>
                </div>

                <div className="p-3.5 bg-gray-50/70 border border-gray-100">
                  <p className="text-xs text-gray-400 font-medium">Địa chỉ Email</p>
                  <p className="text-sm font-semibold text-gray-800 mt-1">{email || "Chưa khai báo"}</p>
                </div>

                <div className="p-3.5 bg-gray-50/70 border border-gray-100">
                  <p className="text-xs text-gray-400 font-medium">Số điện thoại liên hệ</p>
                  <p className="text-sm font-semibold text-gray-800 mt-1">{phone || "Chưa cập nhật"}</p>
                </div>

                <div className="p-3.5 bg-gray-50/70 border border-gray-100">
                  <p className="text-xs text-gray-400 font-medium">Vai trò hệ thống</p>
                  <p className="text-sm font-semibold text-gray-800 mt-1">{roleLabel}</p>
                </div>

                {(role === "STAFF" || role === "MANAGER") && (
                  <>
                    <div className="p-3.5 bg-gray-50/70 border border-gray-100">
                      <p className="text-xs text-gray-400 font-medium">Chi nhánh phụ trách</p>
                      <p className="text-sm font-semibold text-gray-800 mt-1">{staffBuildingInfo?.branch_name || "Tất cả chi nhánh"}</p>
                    </div>
                    <div className="p-3.5 bg-gray-50/70 border border-gray-100">
                      <p className="text-xs text-gray-400 font-medium">Vị trí công tác</p>
                      <p className="text-sm font-semibold text-gray-800 mt-1">{currentStaff?.position || roleLabel}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* khai báo người ở cùng cho cư dân */}
            {role === "TENANT" && (
              <div className="bg-indigo-600 p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white/20 backdrop-blur-md text-xs font-semibold text-white">
                    Cư dân cùng ở
                  </span>
                  <h4 className="text-lg font-bold text-white">Khai báo người ở cùng</h4>
                  <p className="text-xs text-white/80 max-w-md">
                    Đã khai báo <strong className="text-white">{occupants.length}</strong> / <strong className="text-white">{maxOccupantsLimit} người</strong> sinh hoạt cùng bạn tại căn hộ.
                  </p>
                </div>
                <Link
                  to="/tenant/occupants"
                  className="px-4 py-2.5 bg-white text-indigo-700 hover:bg-gray-50 text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer shrink-0"
                >
                  Quản lý danh sách <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-800 text-base border-b border-gray-100 pb-3">
                Trạng thái bảo mật
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="font-medium flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600" /> Tài khoản hoạt động
                  </span>
                  <span className="font-bold">Đã xác thực</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Đổi mật khẩu & Bảo mật  */}
      {activeTab === "security" && (
        <div className="bg-white p-8 border border-gray-200 shadow-md w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="w-12 h-12 bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
              <Lock size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Đổi Mật Khẩu Tài Khoản</h3>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleChangePassword();
            }}
            className="space-y-6 max-w-2xl"
          >
            <div className="relative">
              <Input
                label="Mật khẩu hiện tại *"
                type={showOldPass ? "text" : "password"}
                placeholder="Nhập mật khẩu hiện tại"
                value={oldPass}
                onChange={(e) => setOldPass(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowOldPass(!showOldPass)}
                className="absolute right-3 top-8.5 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showOldPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Mật khẩu mới *"
                type={showNewPass ? "text" : "password"}
                placeholder="Nhập mật khẩu mới"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute right-3 top-8.5 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Xác nhận mật khẩu mới *"
                type={showConfirmPass ? "text" : "password"}
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="pt-4 flex justify-start gap-3">
              <Button type="submit" isLoading={saving} className="px-6 py-3 shadow-md font-bold">
                Lưu thay đổi
              </Button>
              <Button type="button" variant="secondary" onClick={() => setActiveTab("info")}>
                Hủy bỏ
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Chỉnh sửa hồ sơ cá nhân */}
      <Modal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        title="Chỉnh sửa thông tin tài khoản"
      >
        <div className="space-y-4 font-sans">
          <Input
            label="Họ và tên hiển thị *"
            placeholder="Nhập họ và tên"
            value={editFullName}
            onChange={(e) => setEditFullName(e.target.value)}
          />

          <Input
            label="Số điện thoại liên hệ"
            placeholder="Nhập số điện thoại"
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setShowEditProfileModal(false)}>
              Hủy
            </Button>
            <Button onClick={handleSaveProfile}>
              Lưu thay đổi
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
