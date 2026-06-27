import { Building2, Users, Award, Heart } from "lucide-react";

export default function GuestAbout() {
  return (
    <div className="pt-20 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tieu de */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Về YuKi House</h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            YuKi House là dịch vụ cho thuê căn hộ tại TP. Hồ Chí Minh,
            mang đến trải nghiệm sống tiện nghi và dịch vụ chăm sóc cư dân tốt nhất.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {[
            { icon: Building2, title: "5+ Tòa nhà", desc: "Hệ thống tòa nhà trải dài khắp TP.HCM" },
            { icon: Users, title: "200+ Cư dân", desc: "Cư dân tin tưởng và hài lòng" },
            { icon: Award, title: "3+ Năm", desc: "Kinh nghiệm trong lĩnh vực bất động sản" },
            { icon: Heart, title: "98% Hài lòng", desc: "Tỷ lệ hài lòng của khách hàng" },
          ].map((item, i) => (
            <div key={i} className="text-center p-6 bg-gray-50 rounded-2xl">
              <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <item.icon size={28} className="text-primary-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-primary-50 rounded-3xl p-8 lg:p-12 mb-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Sứ mệnh của chúng tôi</h2>
            <p className="text-gray-600 leading-relaxed">
              Chúng tôi mong muốn mang đến cho mọi người một nơi sống lý tưởng,
              nơi mà sự tiện nghi, an toàn và chất lượng dịch vụ luôn được đặt lên hàng đầu.
              Với YuKi House, việc tìm kiếm và quản lý căn hộ chưa bao giờ dễ dàng và chuyên nghiệp đến thế.
            </p>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Tầm nhìn</h2>
          <p className="text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Trở thành nền tảng cho thuê căn hộ số 1 Việt Nam, ứng dụng công nghệ AI
            để tối ưu hóa trải nghiệm người dùng và nâng cao hiệu quả quản lý bất động sản.
          </p>
        </div>
      </div>
    </div>
  );
}
