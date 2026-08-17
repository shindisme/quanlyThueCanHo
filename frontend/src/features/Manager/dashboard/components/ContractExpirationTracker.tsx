import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

interface ContractExpirationTrackerProps {
  expiredCount: number;
  expiring30Count: number;
  expiring60Count: number;
  expiring90Count: number;
  contractsRoute?: string;
}

export default function ContractExpirationTracker({
  expiredCount,
  expiring30Count,
  expiring60Count,
  expiring90Count,
  contractsRoute = "/manager/contracts",
}: ContractExpirationTrackerProps) {
  return (
    <div className="bg-white border border-gray-200 p-5 shadow-sm font-sans">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            Theo dõi thời hạn hợp đồng đến hạn
          </h3>
        </div>
        <Link
          to={contractsRoute}
          className="text-xs text-primary-600 font-semibold hover:underline flex items-center gap-1"
        >
          Quản lý hợp đồng <ArrowUpRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-12 gap-4 items-stretch">
        {/* Đã hết hạn */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 p-4 border border-rose-100 bg-rose-50/40 shadow-sm hover:shadow-md transition-all flex flex-col justify-center">
          <span className="text-xs text-rose-600 font-bold uppercase tracking-wider flex items-center gap-1">
            Đã hết hạn
          </span>
          <p className="text-2xl font-black text-rose-700 mt-1">{expiredCount}</p>
        </div>

        {/* Trong 30 ngày */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 p-4 border border-orange-100 bg-orange-50/40 shadow-sm hover:shadow-md transition-all flex flex-col justify-center">
          <span className="text-xs text-orange-600 font-bold uppercase tracking-wider flex items-center gap-1">
            Trong 30 ngày
          </span>
          <p className="text-2xl font-black text-orange-700 mt-1">{expiring30Count}</p>
        </div>

        {/* Từ 31 - 60 ngày */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 p-4 border border-amber-100 bg-amber-50/40 shadow-sm hover:shadow-md transition-all flex flex-col justify-center">
          <span className="text-xs text-amber-600 font-bold uppercase tracking-wider">
            Từ 31 - 60 ngày
          </span>
          <p className="text-2xl font-black text-amber-700 mt-1">{expiring60Count}</p>
        </div>

        {/* Từ 61 - 90 ngày */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 p-4 border border-blue-100 bg-blue-50/40 shadow-sm hover:shadow-md transition-all flex flex-col justify-center">
          <span className="text-xs text-blue-600 font-bold uppercase tracking-wider">
            Từ 61 - 90 ngày
          </span>
          <p className="text-2xl font-black text-blue-700 mt-1">{expiring90Count}</p>
        </div>
      </div>
    </div>
  );
}
