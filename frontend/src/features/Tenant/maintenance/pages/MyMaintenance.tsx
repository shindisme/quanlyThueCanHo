import { Plus } from "lucide-react";
import PageHeader from "../../../../components/layout/PageHeader";
import Button from "../../../../components/ui/Button";
import Combobox from "../../../../components/ui/Combobox";
import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import DefaultPagination from "../../../../components/ui/Pagination";
import SearchInput from "../../../../components/ui/SearchInput";
import { PRIORITY_OPTIONS, REQUEST_STATUS_OPTIONS } from "../../../../constants";
import MaintenanceDetailModal from "../../../Admin/maintenance/components/MaintenanceDetailModal";
import MaintenanceCreateModal from "../components/MaintenanceCreateModal";
import MaintenanceList from "../components/MaintenanceList";
import { useTenantMaintenance } from "../hooks/useTenantMaintenance";

export default function MyMaintenance() {
  const maintenance = useTenantMaintenance();

  if (maintenance.loading) {
    return (
      <div className="flex min-h-100 flex-col items-center justify-center">
        <LoadingSpinner size={36} />
        <span className="mt-2 text-sm text-gray-400">Đang tải danh sách yêu cầu...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Yêu cầu sửa chữa"
        subtitle="Gửi yêu cầu và theo dõi tiến độ xử lý sự cố thiết bị"
        count={maintenance.requestCount}
        actions={
          <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
            <SearchInput
              value={maintenance.search}
              onChange={maintenance.setSearch}
              placeholder="Tiêu đề, mô tả, phòng..."
              className="w-full sm:w-64"
            />
            <Button
              onClick={maintenance.createModal.onOpen}
              disabled={!maintenance.activeContract}
              className="gap-2 whitespace-nowrap font-semibold"
            >
              <Plus size={16} /> Tạo yêu cầu mới
            </Button>
          </div>
        }
      />

      <div className="grid w-full grid-cols-12 gap-3">
        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Combobox
            options={REQUEST_STATUS_OPTIONS}
            value={maintenance.statusFilter}
            onChange={maintenance.setStatusFilter}
            placeholder="Trạng thái"
            searchable={false}
            className="w-full"
            clearable
          />
        </div>
        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Combobox
            options={PRIORITY_OPTIONS}
            value={maintenance.priorityFilter}
            onChange={maintenance.setPriorityFilter}
            placeholder="Độ ưu tiên"
            searchable={false}
            className="w-full"
            clearable
          />
        </div>
      </div>

      {!maintenance.activeContract && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          Bạn cần có hợp đồng thuê đang hoạt động để tạo yêu cầu bảo trì, sửa chữa.
        </div>
      )}

      {maintenance.error ? (
        <div className="border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
          <p>Không thể tải danh sách yêu cầu sửa chữa.</p>
          <Button variant="outline" onClick={() => void maintenance.refetch()} className="mt-3">
            Thử lại
          </Button>
        </div>
      ) : (
        <MaintenanceList
          requests={maintenance.requests}
          startIdx={maintenance.startIdx}
          totalItems={maintenance.filteredCount}
          saving={maintenance.saving}
          sortConfig={maintenance.sortConfig}
          onSort={(key) => { maintenance.requestSort(key); maintenance.setCurrentPage(1); }}
          onDetail={maintenance.setDetailRequest}
          onCancel={maintenance.setCancelTarget}
        />
      )}

      {maintenance.totalPages > 1 && (
        <DefaultPagination
          currentPage={maintenance.currentPage}
          totalPages={maintenance.totalPages}
          onPageChange={maintenance.setCurrentPage}
        />
      )}

      <MaintenanceCreateModal
        isOpen={maintenance.createModal.isOpen}
        saving={maintenance.saving}
        title={maintenance.title}
        description={maintenance.description}
        imageFile={maintenance.imageFile}
        imagePreviewUrl={maintenance.imagePreviewUrl}
        onClose={maintenance.closeCreateModal}
        onTitleChange={maintenance.setTitle}
        onDescriptionChange={maintenance.setDescription}
        onImageChange={maintenance.handleImageChange}
        onSubmit={maintenance.handleCreateMaintenanceRequest}
      />

      <ConfirmDialog
        isOpen={Boolean(maintenance.cancelTarget)}
        onClose={() => maintenance.setCancelTarget(null)}
        onConfirm={maintenance.confirmCancel}
        title="Xác nhận hủy yêu cầu"
        message="Bạn có chắc muốn hủy yêu cầu sửa chữa này? Thao tác này không thể hoàn tác."
        confirmText="Xác nhận hủy"
        cancelText="Giữ lại"
        isLoading={maintenance.saving}
      />

      <MaintenanceDetailModal
        isOpen={Boolean(maintenance.detailRequest)}
        onClose={() => maintenance.setDetailRequest(null)}
        detailRequest={maintenance.detailRequest}
        role="TENANT"
      />
    </div>
  );
}
