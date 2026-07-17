import { Link } from "react-router-dom";
import {
  Search, ArrowRight, Building2, Users, Shield, Star,
  MapPin, Maximize2, Phone, CheckCircle2,
} from "lucide-react";
import { formatCurrency } from "../../../../utils/currency";
import { formatApartmentDisplay } from "../../../../utils/string";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import { useHomePage } from "../hooks/useHomePage";
import type { ApartmentData } from "../../../../services/apartmentService";
import type { ApartmentImage } from "../../../../types";

function getApartmentThumbnail(apt: ApartmentData): string {
  if (apt && apt.images && Array.isArray(apt.images) && apt.images.length > 0) {
    const thumb = (apt.images as ApartmentImage[]).find((img) => img.is_thumbnail);
    if (thumb) return thumb.image_url;
    return apt.images[0].image_url;
  }
  return "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80";
}

export default function GuestHomePage() {
  const {
    searchQuery,
    setSearchQuery,
    heroTitle,
    heroSubtitle,
    buildings,
    loading,
    featuredApartments,
  } = useHomePage();

  return (
    <div className="font-sans">
      {/* HERO SECTION */}
      <section className="relative pt-16 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 50%, #DDD6FE 100%)" }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold mb-6">
                <Star size={14} />
                <span>Nền tảng quản lý căn hộ #1 TP.HCM</span>
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6 whitespace-pre-line">
                {heroTitle}
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-lg">
                {heroSubtitle}
              </p>

              {/* Search bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm theo tên, địa chỉ, giá..."
                    className="w-full pl-11 pr-4 py-4 rounded-xl border border-gray-300 text-sm bg-white
                      focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100
                      shadow-sm"
                  />
                </div>
                <Link
                  to={`/apartments?search=${encodeURIComponent(searchQuery)}`}
                  className="px-6 py-4 text-white rounded-xl font-medium hover:opacity-90 transition-all
                    flex items-center justify-center gap-2 shadow-md w-full sm:w-auto"
                  style={{ background: "linear-gradient(135deg, #7C3AED, #6D28D9)" }}
                >
                  Tìm kiếm
                  <ArrowRight size={18} />
                </Link>
              </div>

              {/* Stats */}
              <div className="flex gap-10 mt-10">
                {[
                  { value: "5+", label: "Tòa nhà" },
                  { value: "1000+", label: "Căn hộ" },
                  { value: "98%", label: "Hài lòng" },
                ].map((stat, i) => (
                  <div key={i}>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden lg:block relative">
              <div className="w-full h-96 rounded-2xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.1), rgba(167,139,250,0.15))" }}>
                <div className="text-center">
                  <Building2 size={80} className="text-primary-400 mx-auto mb-4" />
                  <p className="text-primary-500 font-medium">YuKi House Apartment</p>
                </div>
              </div>
              {/* Floating card */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg p-4 animate-slide-in-up border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-success-50 rounded-lg flex items-center justify-center">
                    <Star size={20} className="text-success-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">4.9/5.0</p>
                    <p className="text-xs text-gray-400">Đánh giá từ khách</p>
                  </div>
                </div>
              </div>
              {/* Floating card 2 */}
              <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-4 animate-slide-in-up border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                    <CheckCircle2 size={20} className="text-primary-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">500+</p>
                    <p className="text-xs text-gray-400">Cư dân tin tưởng</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED APARTMENTS */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between mb-10">
            <div>
              <p className="text-xs font-semibold text-primary-600 uppercase tracking-wider mb-2">Căn hộ</p>
              <h2 className="text-3xl font-bold text-gray-900">Căn hộ nổi bật</h2>
              <p className="text-gray-500 mt-1">Các căn hộ đang sẵn sàng cho thuê</p>
            </div>
            <Link
              to="/apartments"
              className="text-primary-600 font-medium text-sm hover:text-primary-700 flex items-center gap-1 transition-colors"
            >
              Xem tất cả <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <LoadingSpinner size={32} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {featuredApartments.map((apt: ApartmentData) => {
                const building = buildings.find((b) => b.id === apt.building_id);
                return (
                  <Link
                    key={apt.id}
                    to={`/apartments/${apt.id}`}
                    className="bg-white rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-primary-200 group block"
                  >
                    <div className="w-full h-48 bg-gray-100 overflow-hidden relative">
                      <img
                        src={getApartmentThumbnail(apt)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-350"
                        alt="Ảnh căn hộ"
                      />
                      {["RENTED", "rented"].includes(apt.status) ? (
                        <span className="absolute top-3 left-3 text-xs px-2.5 py-1 rounded-full bg-blue-500 text-white font-semibold">
                          Đang thuê
                        </span>
                      ) : (
                        <span className="absolute top-3 left-3 text-xs px-2.5 py-1 rounded-full bg-success-500 text-white font-semibold">
                          Còn trống
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-gray-800 group-hover:text-primary-600 transition-colors">
                        {formatApartmentDisplay(apt.room_number, apt.floor, "ADMIN", building?.branch_name)}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-400">
                        <MapPin size={12} />
                        <span>{building?.address_new || building?.address_old}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2">{apt.description}</p>
                      <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Maximize2 size={12} />
                          <span>{apt.area} m²</span>
                        </div>
                        <span className="text-lg font-bold text-primary-600">{formatCurrency(apt.rental_price)}/tháng</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-primary-600 uppercase tracking-wider mb-2">Tại sao chọn chúng tôi</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Tại sao chọn YuKi House?</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Chúng tôi cung cấp trải nghiệm cho thuê căn hộ tốt nhất với dịch vụ chuyên nghiệp
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Building2,
                title: "Căn hộ cao cấp",
                desc: "Thiết kế hiện đại, nội thất đầy đủ, không gian sống thoải mái với view đẹp.",
                color: "text-primary-600",
                bg: "bg-primary-50",
              },
              {
                icon: Shield,
                title: "An ninh 24/7",
                desc: "Hệ thống camera giám sát, bảo vệ túc trực, ra vào bằng thẻ từ thông minh.",
                color: "text-success-600",
                bg: "bg-success-50",
              },
              {
                icon: Users,
                title: "Dịch vụ chuyên nghiệp",
                desc: "Đội ngũ hỗ trợ nhiệt tình, xử lý nhanh mọi yêu cầu của cư dân 24/7.",
                color: "text-info-600",
                bg: "bg-info-50",
              },
            ].map((item, i) => (
              <div key={i} className="text-center p-8 rounded-xl bg-gray-50 hover:shadow-md transition-all duration-300 border border-transparent hover:border-gray-200">
                <div className={`w-14 h-14 ${item.bg} rounded-xl flex items-center justify-center mx-auto mb-5`}>
                  <item.icon size={28} className={item.color} />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-20 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 50%, #4C1D95 100%)" }}>
        {/* Decorative */}
        <div className="absolute top-10 left-10 w-64 h-64 rounded-full opacity-10 bg-white" />
        <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full opacity-10 bg-white" />

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Bạn muốn xem phòng?
          </h2>
          <p className="text-lg text-purple-200 mb-8 max-w-2xl mx-auto">
            Đặt lịch xem phòng miễn phí ngay hôm nay.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/apartments"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-lg"
            >
              Xem căn hộ
              <ArrowRight size={20} />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
            >
              <Phone size={18} />
              Liên hệ tư vấn
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
