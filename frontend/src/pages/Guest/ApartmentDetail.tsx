import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Maximize2, Calendar, Phone, Mail, User } from "lucide-react";
import Card from "../../components/common/ui/Card";
import Button from "../../components/common/ui/Button";
import Badge from "../../components/common/ui/Badge";
import Modal from "../../components/common/ui/Modal";
import { mockApartments } from "../../data/apartments";
import { mockBuildings } from "../../data/buildings";
import { APARTMENT_STATUS_LABELS, APARTMENT_STATUS_COLORS } from "../../constants/enums";
import { formatCurrency } from "../../utils/format";
import { toast } from "sonner";

// Trang chi tiet can ho cho khach vang lai
// Bao gom: thong tin, hinh anh, form dat lich xem phong
export default function GuestApartmentDetail() {
  const { id } = useParams();
  const apartment = mockApartments.find((a) => a.id === Number(id));
  const building = apartment ? mockBuildings.find((b) => b.id === apartment.building_id) : null;
  const [showScheduleForm, setShowScheduleForm] = useState(false);

  if (!apartment) {
    return (
      <div className="pt-24 text-center">
        <p className="text-gray-500">Khong tim thay can ho</p>
        <Link to="/apartments" className="text-primary-600 hover:underline text-sm mt-2 inline-block">
          Quay lai danh sach
        </Link>
      </div>
    );
  }

  function handleSubmitSchedule() {
    toast.success("Da gui yeu cau dat lich xem phong! Chung toi se lien he ban som.");
    setShowScheduleForm(false);
  }

  return (
    <div className="pt-20 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Quay lai */}
        <Link to="/apartments" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft size={16} /> Quay lai danh sach
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cot trai - Thong tin chi tiet */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hinh anh */}
            <div className="w-full h-72 lg:h-96 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden">
              <span className="text-gray-300">Hinh anh can ho</span>
            </div>

            {/* Thong tin co ban */}
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{apartment.apartment_code} - {apartment.title}</h1>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                    <MapPin size={14} />
                    <span>{building?.name} - {building?.address}</span>
                  </div>
                </div>
                <Badge variant={APARTMENT_STATUS_COLORS[apartment.status] as "success" | "info" | "warning"}>
                  {APARTMENT_STATUS_LABELS[apartment.status]}
                </Badge>
              </div>

              <p className="text-2xl font-bold text-primary-600 mt-4">
                {formatCurrency(apartment.rental_price)}<span className="text-sm text-gray-400 font-normal">/thang</span>
              </p>
            </div>

            {/* Thong so */}
            <Card>
              <h3 className="font-semibold text-gray-800 mb-4">Thong tin can ho</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <Maximize2 size={18} className="text-primary-600 mx-auto mb-1" />
                  <p className="text-sm font-semibold text-gray-800">{apartment.area} m2</p>
                  <p className="text-xs text-gray-400">Dien tich</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-sm font-semibold text-gray-800">Toa {building?.name}</p>
                  <p className="text-xs text-gray-400">Toa nha</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-sm font-semibold text-gray-800">{building?.totalFloors} tang</p>
                  <p className="text-xs text-gray-400">Tong tang</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-sm font-semibold text-gray-800">{apartment.status === "AVAILABLE" ? "San sang" : "Dang thue"}</p>
                  <p className="text-xs text-gray-400">Trang thai</p>
                </div>
              </div>
            </Card>

            {/* Mo ta */}
            <Card>
              <h3 className="font-semibold text-gray-800 mb-3">Mo ta</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{apartment.description}</p>
            </Card>
          </div>

          {/* Cot phai - Dat lich xem phong */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <h3 className="font-semibold text-gray-800 mb-4">Dat lich xem phong</h3>
              <p className="text-sm text-gray-500 mb-4">
                Khong can dang ky tai khoan. Chi can de lai thong tin, chung toi se lien he ban.
              </p>
              <Button className="w-full" onClick={() => setShowScheduleForm(true)}>
                <Calendar size={18} />
                Dat lich ngay
              </Button>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal form dat lich */}
      <Modal
        isOpen={showScheduleForm}
        onClose={() => setShowScheduleForm(false)}
        title="Dat lich xem phong"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowScheduleForm(false)}>Huy</Button>
            <Button onClick={handleSubmitSchedule}>Gui yeu cau</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500 mb-2">
            Can ho: <span className="font-medium text-gray-800">{apartment.apartment_code} - {apartment.title}</span>
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ho ten *</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Nguyen Van A" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">So dien thoai *</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="tel" placeholder="0901234567" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="email" placeholder="email@example.com" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Thoi gian muon xem *</label>
            <input type="datetime-local" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ghi chu</label>
            <textarea rows={3} placeholder="Luu y gi them..." className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
