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

    </div>
  );
}
