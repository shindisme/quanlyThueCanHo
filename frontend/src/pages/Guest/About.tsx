import { Building2, Users, Award, Heart } from "lucide-react";

// Trang gioi thieu DuKiHome cho khach vang lai
export default function GuestAbout() {
  return (
    <div className="pt-20 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tieu de */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Ve DuKiHome</h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            DuKiHome la he thong quan ly va cho thue can ho chuyen nghiep hang dau tai TP. Ho Chi Minh, 
            mang den trai nghiem song tien nghi va dich vu cham soc cu dan tot nhat.
          </p>
        </div>

        {/* Gia tri cot loi */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {[
            { icon: Building2, title: "5+ Toa nha", desc: "He thong toa nha trai dai khap TP.HCM" },
            { icon: Users, title: "200+ Cu dan", desc: "Cu dan tin tuong va hai long" },
            { icon: Award, title: "3+ Nam", desc: "Kinh nghiem trong linh vuc bat dong san" },
            { icon: Heart, title: "98% Hai long", desc: "Ty le hai long cua khach hang" },
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

        {/* Su menh */}
        <div className="bg-primary-50 rounded-3xl p-8 lg:p-12 mb-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Su menh cua chung toi</h2>
            <p className="text-gray-600 leading-relaxed">
              Chung toi mong muon mang den cho moi nguoi mot noi song ly tuong, 
              noi ma su tien nghi, an toan va chat luong dich vu luon duoc dat len hang dau. 
              Voi DuKiHome, viec tim kiem va quan ly can ho chua bao gio de dang va chuyen nghiep den the.
            </p>
          </div>
        </div>

        {/* Tam nhin */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Tam nhin</h2>
          <p className="text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Tro thanh nen tang cho thue can ho so 1 Viet Nam, ung dung cong nghe AI 
            de toi uu hoa trai nghiem nguoi dung va nang cao hieu qua quan ly bat dong san.
          </p>
        </div>
      </div>
    </div>
  );
}
