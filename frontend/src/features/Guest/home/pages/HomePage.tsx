import { Link, useNavigate } from "react-router-dom";
import { Search, ArrowRight, Building2, Shield, Users, Phone } from "lucide-react";
import { useHomePage } from "../hooks/useHomePage";
import AvailableApartmentsSection from "../components/AvailableApartmentsSection";

export default function GuestHomePage() {
  const navigate = useNavigate();
  const {
    searchQuery,
    setSearchQuery,
    heroTitle,
    heroSubtitle,
    buildings,
    loading,
    availableApartments,
  } = useHomePage();

  const locationSearchUrl = searchQuery.trim()
    ? `/apartments?location=${encodeURIComponent(searchQuery.trim())}`
    : "/apartments";

  const handleSearchSubmit = () => {
    navigate(locationSearchUrl);
  };

  return (
    <div className="font-sans text-gray-900 bg-white">
      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 overflow-hidden bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Hero Left */}
            <div className="lg:col-span-7">
              {/* Badge */}
              <div className="inline-block px-3 py-1 bg-violet-100 text-violet-800 text-xs font-bold mb-6 border-l-2 border-violet-600 uppercase tracking-wider">
                Nền tảng quản lý căn hộ #1 TP.HCM
              </div>

              <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-6 whitespace-pre-line">
                {heroTitle}
              </h1>
              <p className="text-base text-gray-600 mb-8 leading-relaxed max-w-xl">
                {heroSubtitle}
              </p>

              {/* Search bar */}
              <div className="flex flex-col sm:flex-row gap-2 max-w-xl shadow-md border border-gray-300 p-1.5 bg-white rounded-xl">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSearchSubmit();
                      }
                    }}
                    placeholder="Tìm kiếm theo địa chỉ..."
                    className="w-full pl-10 pr-3 py-3 text-sm bg-transparent focus:outline-none text-gray-800"
                  />
                </div>
                <Link
                  to={locationSearchUrl}
                  className="px-6 py-3 bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-all flex items-center justify-center gap-2 w-full sm:w-auto shrink-0 rounded-lg"
                >
                  Tìm kiếm
                  <ArrowRight size={16} />
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-gray-200 max-w-lg">
                {[
                  { value: "5+", label: "Tòa nhà chi nhánh" },
                  { value: "1000+", label: "Căn hộ cao cấp" },
                  { value: "98%", label: "Khách thuê hài lòng" },
                ].map((stat, i) => (
                  <div key={i}>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Right*/}
            <div className="lg:col-span-5 relative">
              <div className="relative border border-gray-300 shadow-xl overflow-hidden bg-gray-100 rounded-lg">
                <img
                  src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80"
                  alt="YuKi House Building"
                  className="w-full h-105 object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
                  <div className="text-white">
                    <p className="text-xs font-bold uppercase tracking-wider text-violet-300">Hệ thống căn hộ YuKi House</p>
                    <p className="text-lg font-bold mt-1">Không gian sống hiện đại & Đầy đủ tiện nghi</p>
                  </div>
                </div>
              </div>

              {/* hình ảnh gthieu */}
              <div className="absolute -bottom-18 -left-6 bg-white border rounded-lg border-gray-300 shadow-xl p-1 flex items-center gap-3 sm:flex">
                <img
                  src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=200&q=80"
                  alt="Phòng mẫu"
                  className="w-20 h-20 object-cover border border-gray-200 rounded-lg"
                />
                <div>
                  <p className="text-sm font-bold text-gray-900">Nội thất cao cấp</p>
                  <p className="text-xs text-gray-500">Được trang bị sẵn 100%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GALLERY SHOWCASE SECTION */}
      <section className="py-16 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-gray-200">
            <div>
              <p className="text-xs font-bold text-violet-600 uppercase tracking-wider mb-1">Hình ảnh</p>
              <h2 className="text-2xl font-bold text-gray-900">Không gian sống tiêu chuẩn tại YuKi House</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Phòng khách hiện đại", img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80" },
              { title: "Phòng ngủ ấm cúng", img: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80" },
              { title: "Khu vực bếp sang trọng", img: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80" },
              { title: "Nhà vệ sinh sạch đẹp", img: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80" },
            ].map((item, index) => (
              <div key={index} className="relative group border border-gray-200 overflow-hidden bg-gray-100">
                <img
                  src={item.img}
                  alt={item.title}
                  className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <span className="text-xs font-semibold text-white">{item.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AvailableApartmentsSection
        apartments={availableApartments}
        buildings={buildings}
        loading={loading}
      />

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
