import { useState } from "react";
import Card from "../../components/common/ui/Card";
import Button from "../../components/common/ui/Button";
import Avatar from "../../components/common/ui/Avatar";
import { useAuthStore } from "../../stores/auth.store";
import { mockTenants } from "../../data/tenants";
import { User, Mail, Phone, MapPin, CreditCard, Shield, Save } from "lucide-react";
import { toast } from "sonner";

// Trang ho so ca nhan cua nguoi thue
export default function ProfilePage() {
  const { user } = useAuthStore();
  const tenantId = user?.id ? user.id - 3 : 1;
  const tenant = mockTenants.find((t) => t.id === tenantId);

  const [isEditing, setIsEditing] = useState(false);

  // Map role sang tieng Viet
  const roleLabel = user?.role === "ADMIN" ? "Quan tri vien"
    : user?.role === "MANAGER" ? "Quan ly"
    : "Nguoi thue";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Ho so ca nhan</h1>
        <p className="text-sm text-gray-500">Xem va cap nhat thong tin ca nhan</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Thong tin tom tat */}
        <Card className="text-center">
          <div className="py-4">
            <Avatar
              name={tenant?.full_name || user?.email || "User"}
              size="lg"
              className="mx-auto mb-4 !w-20 !h-20 !text-2xl"
            />
            <h3 className="text-lg font-bold text-gray-800">
              {tenant?.full_name || user?.email?.split("@")[0]}
            </h3>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <div className="mt-2 inline-flex px-3 py-1 bg-primary-50 text-primary-600 rounded-lg text-xs font-medium">
              {roleLabel}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail size={16} className="text-gray-400" />
              <span className="text-gray-600">{user?.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone size={16} className="text-gray-400" />
              <span className="text-gray-600">{user?.phone || "-"}</span>
            </div>
            {tenant?.address && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin size={16} className="text-gray-400" />
                <span className="text-gray-600">{tenant.address}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Chi tiet */}
        <div className="lg:col-span-2 space-y-6">
          {/* Thong tin ca nhan */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <User size={18} className="text-primary-600" />
                <h3 className="font-semibold text-gray-800">Thong tin ca nhan</h3>
              </div>
              <Button
                variant={isEditing ? "primary" : "outline"}
                size="sm"
                onClick={() => {
                  if (isEditing) {
                    toast.success("Da cap nhat thong tin");
                  }
                  setIsEditing(!isEditing);
                }}
              >
                {isEditing ? <><Save size={14} /> Luu</> : "Chinh sua"}
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ho ten</label>
                <input
                  type="text"
                  defaultValue={tenant?.full_name || ""}
                  disabled={!isEditing}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  defaultValue={user?.email || ""}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm bg-gray-50 text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">So dien thoai</label>
                <input
                  type="tel"
                  defaultValue={user?.phone || ""}
                  disabled={!isEditing}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngay sinh</label>
                <input
                  type="date"
                  defaultValue={tenant?.date_of_birth || ""}
                  disabled={!isEditing}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Dia chi</label>
                <input
                  type="text"
                  defaultValue={tenant?.address || ""}
                  disabled={!isEditing}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              {tenant && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">CCCD</label>
                  <input
                    type="text"
                    defaultValue={tenant.citizen_id}
                    disabled
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm bg-gray-50 text-gray-500"
                  />
                </div>
              )}
            </div>
          </Card>

          {/* Doi mat khau */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Shield size={18} className="text-danger-500" />
              <h3 className="font-semibold text-gray-800">Bao mat</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mat khau hien tai</label>
                <input
                  type="password"
                  placeholder="Nhap mat khau hien tai"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div></div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mat khau moi</label>
                <input
                  type="password"
                  placeholder="Nhap mat khau moi"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Xac nhan mat khau moi</label>
                <input
                  type="password"
                  placeholder="Nhap lai mat khau moi"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>
            <Button variant="outline" className="mt-4" onClick={() => toast.success("Da doi mat khau")}>
              Doi mat khau
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
