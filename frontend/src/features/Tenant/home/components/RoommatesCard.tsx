import { Link } from "react-router-dom";
import { Users, ArrowUpRight } from "lucide-react";
import { ROUTES } from "../../../../constants";

interface OccupantItem {
  id: number;
  name: string;
  cccd: string;
  dob: string;
  phone: string;
}

interface RoommatesCardProps {
  occupants: OccupantItem[];
}

export default function RoommatesCard({ occupants }: RoommatesCardProps) {
  return (
    <div className="w-full bg-white border border-gray-100 p-4 sm:p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 mb-3 sm:mb-4">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
            <Users size={18} className="text-primary-600" />
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-gray-800 text-sm sm:text-base truncate">Thành viên cùng căn hộ</h4>
            <p className="text-[11px] sm:text-xs text-gray-400 truncate">Danh sách người ở cùng đã khai báo</p>
          </div>
        </div>
        <Link
          to={ROUTES.TENANT.OCCUPANTS}
          className="self-start sm:self-auto text-xs px-3 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-700 font-semibold rounded-lg inline-flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
        >
          <span>Khai báo thêm</span>
          <ArrowUpRight size={13} />
        </Link>
      </div>

      <div className="border-t border-gray-100 pt-3 sm:pt-4">
        {occupants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {occupants.map((occ) => (
              <div
                key={occ.id}
                className="p-3 sm:p-3.5 border border-gray-100 rounded-xl bg-gray-50/30 flex flex-col justify-center shadow-sm hover:shadow-md transition-all duration-200"
              >
                <p className="text-sm font-semibold text-gray-850">{occ.name}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-500">
                  <span>CCCD: {occ.cccd}</span>
                  {occ.phone && <span>SĐT: {occ.phone}</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-450">
            <Users size={28} className="mx-auto mb-2 text-gray-200" />
            <p className="text-xs">Chưa khai báo người ở cùng nào</p>
          </div>
        )}
      </div>
    </div>
  );
}
