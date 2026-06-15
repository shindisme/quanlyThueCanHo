import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import { Settings as SettingsIcon, Zap, Building2, Shield } from "lucide-react";
import Button from "../../components/ui/Button";
import { toast } from "sonner";

// Trang cai dat tong quan he thong
export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={SettingsIcon}
        title="Cài đặt hệ thống"
        subtitle="Cấu hình tổng quan cho hệ thống YuKi House"
        iconColor="linear-gradient(135deg, #7C3AED, #A78BFA)"
      />

      <div className="grid grid-cols-12 gap-6">
        {/* Thong tin he thong */}
        <Card className="col-span-12 lg:col-span-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
              <Building2 size={20} className="text-primary-600" />
            </div>
            <h3 className="font-semibold text-gray-800">Thông tin hệ thống</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên hệ thống</label>
              <input type="text" defaultValue="YuKi House" className="premium-input rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email liên hệ</label>
              <input type="email" defaultValue="info@yukihouse.vn" className="premium-input rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Số điện thoại</label>
              <input type="tel" defaultValue="1900-1234" className="premium-input rounded-xl" />
            </div>
          </div>
        </Card>

        {/* Don gia dien nuoc */}
        <Card className="col-span-12 lg:col-span-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-warning-50 rounded-xl flex items-center justify-center">
              <Zap size={20} className="text-warning-600" />
            </div>
            <h3 className="font-semibold text-gray-800">Đơn giá điện nước</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Giá điện (VND/kWh)</label>
              <input type="number" defaultValue="3500" className="premium-input rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Giá nước (VND/m3)</label>
              <input type="number" defaultValue="15000" className="premium-input rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phí dịch vụ cơ bản (VND/tháng)</label>
              <input type="number" defaultValue="300000" className="premium-input rounded-xl" />
            </div>
          </div>
        </Card>

        {/* Bao mat */}
        <Card className="col-span-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-danger-50 rounded-xl flex items-center justify-center">
              <Shield size={20} className="text-danger-500" />
            </div>
            <h3 className="font-semibold text-gray-800">Bảo mật</h3>
          </div>
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Thời gian hết phiên (phút)</label>
              <input type="number" defaultValue="60" className="premium-input rounded-xl" />
            </div>
            <div className="col-span-12 sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Số lần đăng nhập sai tối đa</label>
              <input type="number" defaultValue="5" className="premium-input rounded-xl" />
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => toast.success("Da luu cai dat")}>
          Lưu cài đặt
        </Button>
      </div>
    </div>
  );
}
