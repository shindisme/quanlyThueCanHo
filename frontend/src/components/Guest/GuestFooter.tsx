import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";

// Footer cho Guest Website
export default function GuestFooter() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo va gioi thieu */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">DK</span>
              </div>
              <span className="text-lg font-bold text-white">DuKiHome</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              He thong quan ly cho thue can ho hien dai, chuyen nghiep tai TP. Ho Chi Minh.
            </p>
          </div>

          {/* Lien ket nhanh */}
          <div>
            <h4 className="text-white font-semibold mb-4">Lien ket</h4>
            <div className="space-y-2">
              <Link to="/" className="block text-sm text-gray-400 hover:text-white transition-colors">Trang chu</Link>
              <Link to="/apartments" className="block text-sm text-gray-400 hover:text-white transition-colors">Can ho</Link>
              <Link to="/buildings" className="block text-sm text-gray-400 hover:text-white transition-colors">Toa nha</Link>
              <Link to="/about" className="block text-sm text-gray-400 hover:text-white transition-colors">Gioi thieu</Link>
            </div>
          </div>

          {/* Ho tro */}
          <div>
            <h4 className="text-white font-semibold mb-4">Ho tro</h4>
            <div className="space-y-2">
              <Link to="/contact" className="block text-sm text-gray-400 hover:text-white transition-colors">Lien he</Link>
              <a href="#" className="block text-sm text-gray-400 hover:text-white transition-colors">Cau hoi thuong gap</a>
              <a href="#" className="block text-sm text-gray-400 hover:text-white transition-colors">Dieu khoan</a>
              <a href="#" className="block text-sm text-gray-400 hover:text-white transition-colors">Chinh sach</a>
            </div>
          </div>

          {/* Lien he */}
          <div>
            <h4 className="text-white font-semibold mb-4">Lien he</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <MapPin size={16} className="flex-shrink-0" />
                <span>123 Nguyen Hue, Quan 1, TP.HCM</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Phone size={16} className="flex-shrink-0" />
                <span>1900-1234</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Mail size={16} className="flex-shrink-0" />
                <span>info@dukihome.vn</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-800 text-center">
          <p className="text-sm text-gray-500">
            2026 DuKiHome. Tat ca quyen duoc bao luu.
          </p>
        </div>
      </div>
    </footer>
  );
}
