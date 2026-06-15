import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";

export default function GuestFooter() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg font-bold text-white">YuKi House</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Hệ thống quản lý cho thuê căn hộ hiện đại, chuyên nghiệp tại TP. Hồ Chí Minh.
            </p>
          </div>

          {/* Tab liên kết */}
          <div>
            <h4 className="text-white font-semibold mb-4">Liên kết</h4>
            <div className="space-y-2">
              <Link to="/" className="block text-sm text-gray-400 hover:text-white transition-colors">Trang chủ</Link>
              <Link to="/apartments" className="block text-sm text-gray-400 hover:text-white transition-colors">Căn hộ</Link>
              <Link to="/about" className="block text-sm text-gray-400 hover:text-white transition-colors">Giới thiệu</Link>
            </div>
          </div>

          {/* Tab hỗ trợ */}
          <div>
            <h4 className="text-white font-semibold mb-4">Hỗ trợ</h4>
            <div className="space-y-2">
              <Link to="/contact" className="block text-sm text-gray-400 hover:text-white transition-colors">
                Liên hệ
              </Link>
            </div>
          </div>

          {/* Tab liên hệ */}
          <div>
            <h4 className="text-white font-semibold mb-4">Liên hệ</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <MapPin size={16} className="shrink-0" />
                <span>180 Cao Lỗ, Quận 8, TP. Hồ Chí Minh</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Phone size={16} className="shrink-0" />
                <span>1900-1234</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Mail size={16} className="shrink-0" />
                <span>info@yukihouse.vn</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-800 text-center">
          <p className="text-sm text-gray-500">
            © 2026 YuKi House
          </p>
        </div>
      </div>
    </footer>
  );
}
