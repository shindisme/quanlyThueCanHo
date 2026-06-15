import { useState, useEffect } from "react";
import PageHeader from "../../../components/ui/PageHeader";
import Card from "../../../components/ui/Card";
import { Settings as SettingsIcon, Zap, Building2, LayoutGrid } from "lucide-react";
import Button from "../../../components/ui/Button";
import { toast } from "sonner";

// Trang cài đặt tổng quan hệ thống và Landing Page
export default function SettingsPage() {
  const [settings, setSettings] = useState({
    systemName: "YuKi House",
    contactEmail: "info@yukihouse.vn",
    contactPhone: "1900-1234",
    mainAddress: "123 Nguyễn Huệ, Quận 1, TP.HCM",
    heroTitle: "Tìm căn hộ lý tưởng của bạn",
    heroSubtitle: "YuKi House cung cấp các căn hộ cho thuê chất lượng cao tại TP. Hồ Chí Minh với đầy đủ tiện nghi, an ninh 24/7 và dịch vụ chuyên nghiệp.",
    electricPrice: 3500,
    waterPrice: 15000,
    serviceFee: 300000,
  });

  useEffect(() => {
    const stored = localStorage.getItem("landing-page-settings");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings((prev) => ({ ...prev, ...parsed }));
      } catch {
        // ignore
      }
    }
  }, []);

  function handleSave() {
    localStorage.setItem("landing-page-settings", JSON.stringify(settings));
    toast.success("Đã lưu tất cả cài đặt hệ thống và Landing Page!");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={SettingsIcon}
        title="Cài đặt hệ thống"
        subtitle="Cấu hình tổng quan cho hệ thống và thông tin Landing Page"
        iconColor="linear-gradient(135deg, #7C3AED, #A78BFA)"
      />

      <div className="grid grid-cols-12 gap-6">
        {/* Cấu hình Landing Page */}
        <Card className="col-span-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
              <LayoutGrid size={20} className="text-primary-600" />
            </div>
            <h3 className="font-semibold text-gray-800">Cấu hình Landing Page (Trang chủ)</h3>
          </div>
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tiêu đề chính (Hero Title)</label>
              <input
                type="text"
                value={settings.heroTitle}
                onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                className="premium-input rounded-xl"
              />
            </div>
            <div className="col-span-12">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phụ đề (Hero Subtitle)</label>
              <textarea
                value={settings.heroSubtitle}
                onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
                rows={3}
                className="premium-input rounded-xl resize-none"
              />
            </div>
            <div className="col-span-12">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Địa chỉ trụ sở chính (Hiển thị ở Footer)</label>
              <input
                type="text"
                value={settings.mainAddress}
                onChange={(e) => setSettings({ ...settings, mainAddress: e.target.value })}
                className="premium-input rounded-xl"
              />
            </div>
          </div>
        </Card>

        {/* Thông tin hệ thống */}
        <Card className="col-span-12 lg:col-span-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <Building2 size={20} className="text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-800">Thông tin liên hệ liên lạc</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên thương hiệu hệ thống</label>
              <input
                type="text"
                value={settings.systemName}
                onChange={(e) => setSettings({ ...settings, systemName: e.target.value })}
                className="premium-input rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email liên hệ</label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="premium-input rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Số hotline</label>
              <input
                type="tel"
                value={settings.contactPhone}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                className="premium-input rounded-xl"
              />
            </div>
          </div>
        </Card>

        {/* Đơn giá điện nước */}
        <Card className="col-span-12 lg:col-span-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-warning-50 rounded-xl flex items-center justify-center">
              <Zap size={20} className="text-warning-600" />
            </div>
            <h3 className="font-semibold text-gray-800">Đơn giá dịch vụ</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Đơn giá điện (VND/kWh)</label>
              <input
                type="number"
                value={settings.electricPrice}
                onChange={(e) => setSettings({ ...settings, electricPrice: Number(e.target.value) })}
                className="premium-input rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Đơn giá nước (VND/m³)</label>
              <input
                type="number"
                value={settings.waterPrice}
                onChange={(e) => setSettings({ ...settings, waterPrice: Number(e.target.value) })}
                className="premium-input rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phí quản lý & dịch vụ cơ bản (VND/tháng)</label>
              <input
                type="number"
                value={settings.serviceFee}
                onChange={(e) => setSettings({ ...settings, serviceFee: Number(e.target.value) })}
                className="premium-input rounded-xl"
              />
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} size="lg">
          Lưu cài đặt
        </Button>
      </div>
    </div>
  );
}
