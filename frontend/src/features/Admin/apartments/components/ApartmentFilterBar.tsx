import Combobox from "../../../../components/ui/Combobox";
import { APARTMENT_STATUS_OPTIONS } from "../../../../constants/enums";
import type { Building } from "../../../../types";

interface ApartmentFilterBarProps {
  role: string | null;
  buildings: Building[];
  filterBuilding: number | undefined;
  setFilterBuilding: (val: number | undefined) => void;
  filterFloor: number | "";
  setFilterFloor: (val: number | "") => void;
  availableFloors: number[];
  filterStatus: string;
  setFilterStatus: (val: string) => void;
  onFilterChange: () => void;
}

export default function ApartmentFilterBar({
  role,
  buildings,
  filterBuilding,
  setFilterBuilding,
  filterFloor,
  setFilterFloor,
  availableFloors,
  filterStatus,
  setFilterStatus,
  onFilterChange,
}: ApartmentFilterBarProps) {
  return (
    <div className="grid grid-cols-12 gap-3 w-full">
      {role !== "MANAGER" && (
        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Combobox
            options={buildings.map((b) => ({ value: String(b.id), label: b.branch_name }))}
            value={filterBuilding ? String(filterBuilding) : ""}
            onChange={(val) => {
              setFilterBuilding(val ? Number(val) : undefined);
              onFilterChange();
            }}
            placeholder="Tất cả chi nhánh"
            className="w-full"
            triggerClassName="h-[42px] rounded-xl border-gray-300 px-4 py-2.5"
            clearable={true}
          />
        </div>
      )}

      <div className="col-span-12 sm:col-span-6 md:col-span-3">
        <Combobox
          options={availableFloors.map((f) => ({ value: String(f), label: `Tầng ${f}` }))}
          value={filterFloor !== "" ? String(filterFloor) : ""}
          onChange={(val) => {
            setFilterFloor(val ? Number(val) : "");
            onFilterChange();
          }}
          placeholder="Tất cả tầng"
          className="w-full"
          triggerClassName="h-[42px] rounded-xl border-gray-300 px-4 py-2.5"
          clearable={true}
        />
      </div>

      <div className="col-span-12 sm:col-span-6 md:col-span-3">
        <Combobox
          options={APARTMENT_STATUS_OPTIONS}
          value={filterStatus}
          onChange={(val) => {
            setFilterStatus(val);
            onFilterChange();
          }}
          placeholder="Tất cả trạng thái"
          searchable={false}
          className="w-full"
          triggerClassName="h-[42px] rounded-xl border-gray-300 px-4 py-2.5"
          clearable={true}
        />
      </div>
    </div>
  );
}
