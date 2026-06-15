import { Mail, Phone, MapPin, Send } from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { toast } from "sonner";

// Trang liên hệ cho khách vãng lai
export default function GuestContact() {
  return (
    <div className="pt-20 pb-16 font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900">Liên hệ với chúng tôi</h1>
          <p className="text-gray-500 mt-2">Hãy liên hệ nếu bạn có bất kỳ câu hỏi nào</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Thông tin liên hệ */}
          <div className="space-y-4">
            <Card className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
                <MapPin size={22} className="text-primary-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Địa chỉ</p>
                <p className="text-sm text-gray-500">123 Nguyễn Huệ, Quận 1, TP.HCM</p>
              </div>
            </Card>
            <Card className="flex items-center gap-4">
              <div className="w-12 h-12 bg-success-50 rounded-xl flex items-center justify-center">
                <Phone size={22} className="text-success-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Điện thoại</p>
                <p className="text-sm text-gray-500">1900-1234</p>
              </div>
            </Card>
            <Card className="flex items-center gap-4">
              <div className="w-12 h-12 bg-info-50 rounded-xl flex items-center justify-center">
                <Mail size={22} className="text-info-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Email</p>
                <p className="text-sm text-gray-500">info@yukihouse.vn</p>
              </div>
            </Card>
          </div>

          {/* Form liên hệ */}
          <Card className="lg:col-span-2">
            <h3 className="font-semibold text-gray-800 mb-4">Gửi tin nhắn cho chúng tôi</h3>
            <div className="space-y-6">
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 sm:col-span-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Họ tên *</label>
                  <input type="text" placeholder="Nguyễn Văn A" className="premium-input rounded-xl" />
                </div>
                <div className="col-span-12 sm:col-span-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                  <input type="email" placeholder="email@example.com" className="premium-input rounded-xl" />
                </div>

                <div className="col-span-12">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Chủ đề</label>
                  <input type="text" placeholder="Chủ đề tin nhắn" className="premium-input rounded-xl" />
                </div>

                <div className="col-span-12">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nội dung *</label>
                  <textarea rows={5} placeholder="Nội dung tin nhắn..." className="premium-input rounded-xl resize-none" />
                </div>

                <div className="col-span-12">
                  <Button onClick={() => toast.success("Đã gửi tin nhắn thành công! Chúng tôi sẽ phản hồi sớm.")}>
                    <Send size={16} />
                    Gửi tin nhắn
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
