import { useMemo } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import DataTable, { type Column } from "../../../../components/ui/DataTable";
import type { Tenant } from "../../../../types";
import { maskPhone, maskCCCD, formatApartmentDisplay } from "../../../../utils/string";
import { getPreferredContract } from "../../../../utils/contract";
import { getTableRowNumber } from "../../../../utils/table";

interface TenantListProps {
  paginatedTenants: Tenant[];
  role: string | null;
  startIdx: number;
  totalItems: number;
  sortConfig: { key: string; direction: "asc" | "desc" } | null;
  onSort: (key: string) => void;
  setViewItem: (item: Tenant | null) => void;
  setEditItem: (item: Tenant | null) => void;
  onOpenModifyModal: () => void;
  setDeleteItem: (item: Tenant | null) => void;
}

const isTenantDeletable = (tenant: Tenant) => {
  const activeContract = getPreferredContract(tenant.contracts);
  if (activeContract) return false;
  const count = tenant._count;
  if (!count) {
    return !tenant.contracts || tenant.contracts.length === 0;
  }
  const totalRelations =
    (count.contracts || 0) +
    (count.invoices || 0) +
    (count.reservations || 0) +
    (count.maintenance || 0) +
    (count.reviews || 0);
  return totalRelations === 0;
};

export default function TenantList({
  paginatedTenants,
  role,
  startIdx,
  totalItems,
  sortConfig,
  onSort,
  setViewItem,
  setEditItem,
  onOpenModifyModal,
  setDeleteItem,
}: TenantListProps) {
  const columns: Column<Tenant>[] = useMemo(
    () => [
      {
        key: "index",
        label: "STT",
        className: "w-4",
        preserveRenderIndex: true,
        render: (_, index: number) => (
          <span className="font-semibold text-gray-800">{getTableRowNumber(index, startIdx, totalItems, sortConfig)}</span>
        ),
      },
      {
        key: "name",
        label: "Họ tên",
        sortable: false,
        sortValue: (t) => t.full_name,
        render: (t) => <span className="font-medium">{t.full_name}</span>,
      },
      {
        key: "apartment",
        label: "Căn hộ",
        sortValue: (t) => {
          const activeContract = getPreferredContract(t.contracts);
          if (activeContract?.apartment) {
            return `${activeContract.apartment.building?.branch_name || ""} - P.${activeContract.apartment.room_number}`;
          }
          const endedContract = t.contracts?.find((c) => c.status === "ENDED" && c.apartment);
          if (endedContract?.apartment) {
            return `${endedContract.apartment.building?.branch_name || ""} - P.${endedContract.apartment.room_number}`;
          }
          return "Chưa thuê";
        },
        render: (t) => {
          const activeContract = getPreferredContract(t.contracts);
          if (activeContract && activeContract.apartment) {
            const apt = activeContract.apartment;
            const bld = apt.building;
            const roomNum = formatApartmentDisplay(apt.room_number, apt.floor);
            return (
              <div className="flex flex-col">
                <span className="font-semibold text-gray-800">{roomNum}</span>
                {role === "ADMIN" && bld?.branch_name && (
                  <span className="text-[10px] font-semibold text-primary-600">{bld.branch_name}</span>
                )}
              </div>
            );
          }

          const endedContract = t.contracts?.find((c) => c.status === "ENDED" && c.apartment);
          if (endedContract && endedContract.apartment) {
            const apt = endedContract.apartment;
            const bld = apt.building;
            const roomNum = formatApartmentDisplay(apt.room_number, apt.floor);
            return (
              <div className="flex flex-col">
                <span className="font-medium text-gray-700 text-xs">
                  {roomNum} {bld?.branch_name ? `(${bld.branch_name})` : ""}
                </span>
                <span className="text-[10px] text-amber-600 font-medium">Đã từng thuê</span>
              </div>
            );
          }

          return <span className="text-gray-450 italic text-xs">Chưa thuê</span>;
        },
      },
      {
        key: "phone",
        label: "Số điện thoại",
        sortable: false,
        sortValue: (t) => t.phone || "",
        render: (t) => (t.phone ? maskPhone(t.phone) : "-"),
      },
      {
        key: "citizen_id",
        label: "CCCD",
        sortable: false,
        sortValue: (t) => t.citizen_id,
        render: (t) => maskCCCD(t.citizen_id),
      },
      {
        key: "actions",
        label: "Chức năng",
        render: (t) => {
          return (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewItem(t)}
                className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer"
                title="Xem chi tiết"
              >
                <Eye size={16} />
              </button>
              {role !== "STAFF" && (
                <>
                  <button
                    onClick={() => {
                      setEditItem(t);
                      onOpenModifyModal();
                    }}
                    className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer"
                    title="Chỉnh sửa"
                  >
                    <Pencil size={16} />
                  </button>
                  {isTenantDeletable(t) && (
                    <button
                      onClick={() => setDeleteItem(t)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                      title="Xóa người thuê"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </>
              )}
            </div>
          );
        },
      },
    ],
    [role, startIdx, totalItems, sortConfig, setViewItem, setEditItem, onOpenModifyModal, setDeleteItem]
  );

  return (
    <div className="space-y-4">
      {/* Mobile Card View */}
      <div className="grid grid-cols-1 gap-4 md:hidden font-sans">
        {paginatedTenants.map((t) => {
          const activeContract = getPreferredContract(t.contracts);
          const apt = activeContract?.apartment;
          const bld = apt?.building;
          return (
            <div key={t.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800 text-base">{t.full_name}</span>
              </div>

              <div className="text-sm text-gray-500 space-y-1">
                <p>
                  <span className="font-semibold text-gray-700">Số điện thoại:</span>{" "}
                  {t.phone ? maskPhone(t.phone) : "-"}
                </p>
                <p>
                  <span className="font-semibold text-gray-700">Căn hộ:</span>{" "}
                  {apt ? (
                    <>
                      <span className="font-bold text-gray-900">
                        {formatApartmentDisplay(apt.room_number, apt.floor)}
                      </span>{" "}
                      {role === "ADMIN" && bld?.branch_name && (
                        <span className="text-xs font-semibold text-purple-650">({bld.branch_name})</span>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-450 italic text-xs">Chưa thuê</span>
                  )}
                </p>
                <p>
                  <span className="font-semibold text-gray-700">CCCD:</span>{" "}
                  {maskCCCD(t.citizen_id)}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => setViewItem(t)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-primary-600 hover:bg-primary-50 flex items-center gap-1 text-xs cursor-pointer"
                >
                  <Eye size={14} /> Chi tiết
                </button>
                {role !== "STAFF" && (
                  <>
                    <button
                      onClick={() => {
                        setEditItem(t);
                        onOpenModifyModal();
                      }}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-primary-600 hover:bg-primary-50 flex items-center gap-1 text-xs cursor-pointer"
                    >
                      <Pencil size={14} /> Sửa
                    </button>
                    {isTenantDeletable(t) && (
                      <button
                        onClick={() => setDeleteItem(t)}
                        className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1 text-xs cursor-pointer"
                      >
                        <Trash2 size={14} /> Xóa
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={paginatedTenants}
          sortConfig={sortConfig}
          onSort={onSort}
        />
      </div>
    </div>
  );
}
