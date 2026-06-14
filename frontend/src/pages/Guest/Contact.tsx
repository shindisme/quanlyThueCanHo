import { Mail, Phone, MapPin, Send } from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { toast } from "sonner";

// Trang lien he cho khach vang lai
export default function GuestContact() {
  return (
    <div className="pt-20 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900">Lien he voi chung toi</h1>
          <p className="text-gray-500 mt-2">Hay lien he neu ban co bat ky cau hoi nao</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Thong tin lien he */}
          <div className="space-y-4">
            <Card className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
                <MapPin size={22} className="text-primary-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Dia chi</p>
                <p className="text-sm text-gray-500">123 Nguyen Hue, Quan 1, TP.HCM</p>
              </div>
            </Card>
            <Card className="flex items-center gap-4">
              <div className="w-12 h-12 bg-success-50 rounded-xl flex items-center justify-center">
                <Phone size={22} className="text-success-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Dien thoai</p>
                <p className="text-sm text-gray-500">1900-1234</p>
              </div>
            </Card>
            <Card className="flex items-center gap-4">
              <div className="w-12 h-12 bg-info-50 rounded-xl flex items-center justify-center">
                <Mail size={22} className="text-info-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Email</p>
                <p className="text-sm text-gray-500">info@dukihome.vn</p>
              </div>
            </Card>
          </div>

          {/* Form lien he */}
          <Card className="lg:col-span-2">
            <h3 className="font-semibold text-gray-800 mb-4">Gui tin nhan cho chung toi</h3>
            <div className="space-y-6">
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 sm:col-span-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Ho ten *</label>
                  <input type="text" placeholder="Nguyen Van A" className="premium-input rounded-xl" />
                </div>
                <div className="col-span-12 sm:col-span-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                  <input type="email" placeholder="email@example.com" className="premium-input rounded-xl" />
                </div>

                <div className="col-span-12">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Chu de</label>
                  <input type="text" placeholder="Chu de tin nhan" className="premium-input rounded-xl" />
                </div>

                <div className="col-span-12">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Noi dung *</label>
                  <textarea rows={5} placeholder="Noi dung tin nhan..." className="premium-input rounded-xl resize-none" />
                </div>

                <div className="col-span-12">
                  <Button onClick={() => toast.success("Da gui tin nhan! Chung toi se phan hoi som.")}>
                    <Send size={16} />
                    Gui tin nhan
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
