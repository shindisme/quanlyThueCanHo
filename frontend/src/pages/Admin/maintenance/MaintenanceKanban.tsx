import { useAuthStore } from "../../../stores/auth.store";
import { mockMaintenanceRequests } from "../../../data/maintenance";
import { mockApartments } from "../../../data/apartments";

export default function MaintenanceKanban() {
  const { role, managedBuildingId } = useAuthStore();

  const displayRequests = (() => {
    if (role === "MANAGER" && managedBuildingId) {
      const managerApartmentIds = mockApartments
        .filter((a) => a.building_id === managedBuildingId)
        .map((a) => a.id);
      return mockMaintenanceRequests.filter((r) => managerApartmentIds.includes(r.apartment_id));
    }
    return mockMaintenanceRequests;
  })();

  return (
    <div className="p-6 font-sans">
      <h2 className="text-xl font-bold mb-4">Yêu cầu sửa chữa ({displayRequests.length})</h2>
      <div className="bg-white p-8 text-center text-gray-500 rounded-xl border border-gray-200">
        Tính năng Kanban yêu cầu sửa chữa đang được hoàn thiện.
      </div>
    </div>
  );
}
