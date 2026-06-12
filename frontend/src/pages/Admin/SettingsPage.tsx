import Card from "../../components/common/ui/Card";
import { Settings as SettingsIcon, Zap, Droplets, Building2, Shield } from "lucide-react";
import Button from "../../components/common/ui/Button";
import { toast } from "sonner";

// Trang cai dat tong quan he thong
export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Cai dat he thong</h1>
        <p className="text-sm text-gray-500">Cau hinh tong quan cho he thong DuKiHome</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Thong tin he thong */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
              <Building2 size={20} className="text-primary-600" />
            </div>
            <h3 className="font-semibold text-gray-800">Thong tin he thong</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ten he thong</label>
              <input type="text" defaultValue="DuKiHome" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email lien he</label>
              <input type="email" defaultValue="info@dukihome.vn" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">So dien thoai</label>
              <input type="tel" defaultValue="1900-1234" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
            </div>
          </div>
        </Card>

        {/* Don gia dien nuoc */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-warning-50 rounded-xl flex items-center justify-center">
              <Zap size={20} className="text-warning-600" />
            </div>
            <h3 className="font-semibold text-gray-800">Don gia dien nuoc</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Gia dien (VND/kWh)</label>
              <input type="number" defaultValue="3500" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Gia nuoc (VND/m3)</label>
              <input type="number" defaultValue="15000" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phi dich vu co ban (VND/thang)</label>
              <input type="number" defaultValue="300000" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
            </div>
          </div>
        </Card>

        {/* Bao mat */}
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-danger-50 rounded-xl flex items-center justify-center">
              <Shield size={20} className="text-danger-500" />
            </div>
            <h3 className="font-semibold text-gray-800">Bao mat</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Thoi gian het phien (phut)</label>
              <input type="number" defaultValue="60" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">So lan dang nhap sai toi da</label>
              <input type="number" defaultValue="5" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => toast.success("Da luu cai dat")}>
          Luu cai dat
        </Button>
      </div>
    </div>
  );
}
