import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, ArrowRight, Building2, Users, Shield, Star } from "lucide-react";
import { mockApartments } from "../../data/apartments";
import { mockBuildings } from "../../data/buildings";
import { formatCurrency } from "../../utils/format";
import Badge from "../../components/common/ui/Badge";

// Landing page cho khach vang lai
export default function GuestHomePage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Lay can ho noi bat (con trong)
  const featuredApartments = mockApartments
    .filter((a) => a.status === "AVAILABLE")
    .slice(0, 6);

  return (
    <div>
      {/* Hero Section - Banner chinh */}
      <section className="relative pt-16 pb-20 overflow-hidden" style={{ backgroundColor: "#F5F3FF" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">
                Tim can ho <br />
                <span className="text-primary-600">ly tuong</span> cua ban
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                DuKiHome cung cap cac can ho cho thue chat luong cao tai TP. Ho Chi Minh 
                voi day du tien nghi, an ninh 24/7 va dich vu chuyen nghiep.
              </p>

              {/* Thanh tim kiem */}
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tim kiem theo ten, dia chi, gia..."
                    className="w-full pl-11 pr-4 py-4 rounded-2xl border border-gray-300 text-sm bg-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <Link
                  to="/apartments"
                  className="px-6 py-4 bg-primary-600 text-white rounded-2xl font-medium hover:bg-primary-700 transition-colors flex items-center gap-2"
                >
                  Tim kiem
                  <ArrowRight size={18} />
                </Link>
              </div>

              {/* Thong ke nhanh */}
              <div className="flex gap-8 mt-10">
                <div>
                  <p className="text-3xl font-bold text-gray-900">{mockBuildings.length}</p>
                  <p className="text-sm text-gray-500">Toa nha</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">{mockApartments.length}+</p>
                  <p className="text-sm text-gray-500">Can ho</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">98%</p>
                  <p className="text-sm text-gray-500">Hai long</p>
                </div>
              </div>
            </div>

            {/* Hinh minh hoa ben phai */}
            <div className="hidden lg:block relative">
              <div className="w-full h-96 bg-primary-200/30 rounded-3xl flex items-center justify-center">
                <div className="text-center">
                  <Building2 size={80} className="text-primary-400 mx-auto mb-4" />
                  <p className="text-primary-500 font-medium">DuKiHome Apartment</p>
                </div>
              </div>
              {/* Card noi tren anh */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-card p-4 animate-slide-in-up">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-success-50 rounded-xl flex items-center justify-center">
                    <Star size={20} className="text-success-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">4.9/5.0</p>
                    <p className="text-xs text-gray-400">Danh gia tu khach</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Diem noi bat */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Tai sao chon DuKiHome?</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Chung toi cung cap trai nghiem cho thue can ho tot nhat</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Building2, title: "Can ho cao cap", desc: "Thiet ke hien dai, noi that day du, khong gian song thoai mai." },
              { icon: Shield, title: "An ninh 24/7", desc: "He thong camera giam sat, bao ve tuc truc, ra vao bang the tu." },
              { icon: Users, title: "Dich vu chuyen nghiep", desc: "Doi ngu ho tro nhiet tinh, xu ly nhanh moi yeu cau cua cu dan." },
            ].map((item, i) => (
              <div key={i} className="text-center p-8 rounded-2xl bg-gray-50 hover:bg-primary-50 transition-colors">
                <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <item.icon size={28} className="text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Can ho noi bat */}
      <section className="py-16" style={{ backgroundColor: "#FAFAFC" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Can ho noi bat</h2>
              <p className="text-gray-500 mt-1">Cac can ho dang san sang cho thue</p>
            </div>
            <Link
              to="/apartments"
              className="text-primary-600 font-medium text-sm hover:underline flex items-center gap-1"
            >
              Xem tat ca <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredApartments.map((apt) => {
              const building = mockBuildings.find((b) => b.id === apt.building_id);
              return (
                <Link
                  key={apt.id}
                  to={`/apartments/${apt.id}`}
                  className="bg-white rounded-2xl shadow-card overflow-hidden hover:shadow-card-hover transition-shadow"
                >
                  <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-300 text-sm">Hinh anh can ho</span>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-800">{apt.title}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{building?.name} - {building?.address}</p>
                      </div>
                      <Badge variant="success">Con trong</Badge>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{apt.description}</p>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <span className="text-sm text-gray-500">{apt.area} m2</span>
                      <span className="text-lg font-bold text-primary-600">{formatCurrency(apt.rental_price)}/thang</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA - Keu goi hanh dong */}
      <section className="py-16 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ban muon xem phong?
          </h2>
          <p className="text-lg text-primary-100 mb-8">
            Dat lich xem phong mien phi ngay hom nay. Khong can dang ky tai khoan.
          </p>
          <Link
            to="/apartments"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-600 font-semibold rounded-2xl hover:bg-gray-50 transition-colors"
          >
            Xem can ho
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
}
