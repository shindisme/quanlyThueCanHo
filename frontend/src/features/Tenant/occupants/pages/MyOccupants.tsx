import { Users, Plus, Pencil, Trash2, ShieldCheck, UserCheck, Phone, CreditCard, Calendar } from "lucide-react";
import PageHeader from "../../../../components/layout/PageHeader";
import Button from "../../../../components/ui/Button";
import Modal from "../../../../components/ui/Modal";
import Input from "../../../../components/ui/Input";
import { DatePicker } from "../../../../components/ui/DatePicker";
import { useMyOccupants, type OccupantItem } from "../hooks/useMyOccupants";

export default function MyOccupants() {
  const {
    occupants,
    isLoading,
    maxOccupantsLimit,
    showOccupantModal,
    setShowOccupantModal,
    editOccupant,
    occupantForm,
    setOccupantForm,
    handleOpenOccupantForm,
    handleSaveOccupant,
    handleDeleteOccupant,
    isSaving,
  } = useMyOccupants();

  const isLimitReached = occupants.length >= maxOccupantsLimit;

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Thành viên ở cùng"
        subtitle="Danh sách các thành viên cùng sinh sống trong căn hộ"
        actions={
          <Button
            onClick={() => handleOpenOccupantForm(null)}
            disabled={isLimitReached}
            className="shadow-md"
          >
            <Plus size={18} /> Khai báo người ở cùng
          </Button>
        }
      />

      {/* Thống kê hạn ngạch */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 border border-gray-100 flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-400">Đã khai báo</p>
            <p className="text-2xl font-bold text-gray-800">{occupants.length} người</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
            <UserCheck size={24} />
          </div>
        </div>

        <div className="bg-white p-5  border border-gray-100 shadow-lg flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-400">Tối đa theo hợp đồng</p>
            <p className="text-2xl font-bold text-gray-800">{maxOccupantsLimit} người</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-white p-5 border border-gray-100 shadow-lg flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-400">Trạng thái khai báo</p>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${isLimitReached
              ? "bg-amber-50 text-amber-700 border border-amber-200"
              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}>
              {isLimitReached ? "Đã đạt hạn ngạch" : "Còn chỗ khai báo"}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <ShieldCheck size={24} />
          </div>
        </div>
      </div>

      {/* Cảnh báo khi đạt hạn ngạch */}
      {isLimitReached && (
        <div className="p-4 bg-amber-50/80 border border-amber-200/60 rounded-xl text-amber-800 text-sm flex items-start gap-3">
          <ShieldCheck size={20} className="shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-semibold">Căn hộ đã đạt số lượng người ở cùng tối đa ({maxOccupantsLimit} người)</p>
            <p className="text-xs text-amber-700 mt-0.5">Nếu có sự thay đổi cư dân, vui lòng chỉnh sửa hoặc xoá thông tin người ở cùng hiện tại trước khi thêm mới.</p>
          </div>
        </div>
      )}

      {/* Danh sách người ở cùng */}
      <div className="bg-white border border-gray-100 shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-800 text-base">Danh sách thành viên đăng ký</h3>
            <p className="text-xs text-gray-400 mt-0.5">Thông tin dùng cho khai báo tạm trú và ban quản lý tòa nhà</p>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Đang tải danh sách người ở cùng...</div>
        ) : occupants.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-16 h-16 bg-sky-50 text-sky-500 rounded-full flex items-center justify-center mx-auto">
              <Users size={32} />
            </div>
            <p className="text-gray-700 font-semibold">Chưa có thông tin người ở cùng</p>
            <Button size="sm" onClick={() => handleOpenOccupantForm(null)} className="mt-2">
              <Plus size={16} /> Khai báo ngay
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {occupants.map((occ: OccupantItem, index: number) => (
              <div key={occ.id} className="p-5 hover:bg-gray-50/70 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-linear-to-tr from-sky-500 to-indigo-500 text-white font-bold text-lg flex items-center justify-center shrink-0 shadow-sm">
                    {occ.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-800 text-base">{occ.name}</h4>
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 font-medium text-gray-600">
                        Thành viên #{index + 1}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <CreditCard size={14} className="text-gray-400" />
                        CCCD: <strong className="text-gray-700">{occ.cccd}</strong>
                      </span>
                      {occ.dob && (
                        <span className="flex items-center gap-1">
                          <Calendar size={14} className="text-gray-400" />
                          Ngày sinh: <strong className="text-gray-700">{new Date(occ.dob).toLocaleDateString("vi-VN")}</strong>
                        </span>
                      )}
                      {occ.phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={14} className="text-gray-400" />
                          SĐT: <strong className="text-gray-700">{occ.phone}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => handleOpenOccupantForm(occ)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Pencil size={14} /> Chỉnh sửa
                  </button>
                  <button
                    onClick={() => handleDeleteOccupant(occ.id)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-red-600 hover:bg-red-50 hover:border-red-200 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={14} /> Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal thêm/sửa người ở cùng */}
      <Modal
        isOpen={showOccupantModal}
        onClose={() => setShowOccupantModal(false)}
        title={editOccupant ? "Chỉnh sửa người ở cùng" : "Khai báo người ở cùng"}
      >
        <div className="space-y-4 font-sans">
          <Input
            label="Họ và tên *"
            placeholder="Ví dụ: Nguyễn Văn A"
            value={occupantForm.name}
            onChange={(e) => setOccupantForm({ ...occupantForm, name: e.target.value })}
          />

          <Input
            label="Số CCCD / CMND *"
            placeholder="Nhập 9-12 chữ số"
            value={occupantForm.cccd}
            onChange={(e) => setOccupantForm({ ...occupantForm, cccd: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Ngày tháng năm sinh</label>
            <DatePicker
              value={occupantForm.dob ? new Date(occupantForm.dob) : undefined}
              onChange={(date) =>
                setOccupantForm({
                  ...occupantForm,
                  dob: date ? date.toISOString().slice(0, 10) : "",
                })
              }
              placeholder="Chọn ngày sinh"
            />
          </div>

          <Input
            label="Số điện thoại"
            placeholder="Ví dụ: 0912345678"
            value={occupantForm.phone || ""}
            onChange={(e) => setOccupantForm({ ...occupantForm, phone: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setShowOccupantModal(false)}>
              Hủy
            </Button>
            <Button onClick={handleSaveOccupant} isLoading={isSaving}>
              {editOccupant ? "Lưu thay đổi" : "Khai báo ngay"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
