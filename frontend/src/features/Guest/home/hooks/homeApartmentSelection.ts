import type { ApartmentData } from "../../../../services/apartmentService";

export function selectAvailableApartmentsByBuilding(
  apartments: ApartmentData[],
  limit = 6
): ApartmentData[] {
  if (limit <= 0) return [];

  const byBuilding = new Map<number, ApartmentData[]>();
  for (const apartment of apartments) {
    if (apartment.status !== "AVAILABLE") continue;

    const group = byBuilding.get(apartment.building_id);
    if (group) {
      group.push(apartment);
    } else {
      byBuilding.set(apartment.building_id, [apartment]);
    }
  }

  const groups = [...byBuilding.values()];
  const selected: ApartmentData[] = [];

  for (let round = 0; selected.length < limit; round += 1) {
    let added = false;

    for (const group of groups) {
      const apartment = group[round];
      if (!apartment) continue;

      selected.push(apartment);
      added = true;
      if (selected.length === limit) return selected;
    }

    if (!added) break;
  }

  return selected;
}
