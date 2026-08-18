import { Plus, ShieldCheck, UserCheck, Users } from "lucide-react";
import PageHeader from "../../../../components/layout/PageHeader";
import Button from "../../../../components/ui/Button";
import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import DefaultPagination from "../../../../components/ui/Pagination";
import SearchInput from "../../../../components/ui/SearchInput";
import OccupantFormModal from "../components/OccupantFormModal";
import OccupantList from "../components/OccupantList";
import { useMyOccupants } from "../hooks/useMyOccupants";

export default function MyOccupants() {
  const occupants = useMyOccupants();

  return (
    <div className="max-w-6xl space-y-6">
      <PageHeader
        title="Thành viên ở cùng"
        subtitle="Quản lý thông tin nhân khẩu cùng sinh sống trong căn hộ"
        count={occupants.occupantCount}
        actions={
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <SearchInput value={occupants.search} onChange={occupants.setSearch} placeholder="Tên, CCCD, số điện thoại..." className="w-full sm:w-64" />
            <Button onClick={() => occupants.handleOpenOccupantForm(null)} disabled={!occupants.hasActiveContract || occupants.isLimitReached} className="shadow-md">
              <Plus size={18} /> Khai báo người ở cùng
            </Button>
          </div>
        }
      />

      {!occupants.hasActiveContract && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          Bạn cần có hợp đồng thuê đang hoạt động để khai báo người ở cùng.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Stat icon={UserCheck} label="Đã khai báo" value={`${occupants.occupantCount} người`} color="sky" />
        <Stat icon={Users} label="Tối đa theo hợp đồng" value={`${occupants.maxTotalOccupants} người`} color="purple" />
        <Stat icon={ShieldCheck} label="Chỗ khai báo còn lại" value={`${Math.max(0, occupants.maxCompanions - occupants.occupantCount)} người`} color="emerald" />
      </div>

      {occupants.isLimitReached && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200/60 bg-amber-50/80 p-4 text-sm text-amber-800">
          <ShieldCheck size={20} className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold">Đã đạt số người tối đa của hợp đồng.</p>
            <p className="mt-0.5 text-xs text-amber-700">Giới hạn {occupants.maxTotalOccupants} người đã bao gồm người đứng tên hợp đồng.</p>
          </div>
        </div>
      )}

      {occupants.error ? (
        <div className="border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
          <p>Không thể tải danh sách người ở cùng.</p>
          <Button variant="outline" onClick={() => void occupants.refetch()} className="mt-3">Thử lại</Button>
        </div>
      ) : occupants.isLoading ? (
        <div className="p-12 text-center text-sm text-gray-400">Đang tải danh sách người ở cùng...</div>
      ) : (
        <OccupantList
          occupants={occupants.occupants}
          startIdx={occupants.startIdx}
          totalItems={occupants.filteredCount}
          sortConfig={occupants.sortConfig}
          onSort={(key) => { occupants.requestSort(key); occupants.setCurrentPage(1); }}
          onEdit={occupants.handleOpenOccupantForm}
          onDelete={occupants.setDeleteTarget}
        />
      )}

      {occupants.totalPages > 1 && (
        <DefaultPagination currentPage={occupants.currentPage} totalPages={occupants.totalPages} onPageChange={occupants.setCurrentPage} />
      )}

      <OccupantFormModal
        isOpen={occupants.showOccupantModal}
        isEditing={Boolean(occupants.editOccupant)}
        isSaving={occupants.isSaving}
        form={occupants.occupantForm}
        onChange={occupants.setOccupantForm}
        onClose={occupants.closeOccupantModal}
        onSave={occupants.handleSaveOccupant}
      />
      <ConfirmDialog
        isOpen={Boolean(occupants.deleteTarget)}
        onClose={() => occupants.setDeleteTarget(null)}
        onConfirm={occupants.confirmDelete}
        title="Xóa người ở cùng"
        message={`Bạn có chắc muốn xóa thông tin ${occupants.deleteTarget?.name || "người này"}?`}
        confirmText="Xóa"
        isLoading={occupants.isDeleting}
      />
    </div>
  );
}

interface StatProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  color: "sky" | "purple" | "emerald";
}

function Stat({ icon: Icon, label, value, color }: StatProps) {
  const colors = {
    sky: "bg-sky-50 text-sky-600",
    purple: "bg-purple-50 text-purple-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };
  return (
    <div className="flex items-center justify-between border border-gray-100 bg-white p-5 shadow-lg">
      <div className="space-y-1">
        <p className="text-xs font-medium text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors[color]}`}><Icon size={24} /></div>
    </div>
  );
}
