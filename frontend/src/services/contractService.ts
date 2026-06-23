import type { RentalContract } from "../types";
import { mockContracts } from "../data/contracts";

function getMigratedContracts(): RentalContract[] {
  const stored = localStorage.getItem("custom-contracts");
  let contracts: RentalContract[] = stored ? JSON.parse(stored) : [...mockContracts];

  let hasTimestamps = contracts.some(c => c.id > 1000000);
  if (hasTimestamps) {
    contracts = contracts.map((c, index) => {
      if (c.id > 1000000) {
        c.id = index + 1;
      }
      return c;
    });
    localStorage.setItem("custom-contracts", JSON.stringify(contracts));
  }
  return contracts;
}

export async function getAllContracts(params?: {
  buildingId?: number;
  status?: string;
  search?: string;
  tenantId?: number;
}): Promise<RentalContract[]> {
  let contracts = getMigratedContracts();

  try {
    const { getAllTenants } = await import("./tenantService");
    const tRes = await getAllTenants({ limit: 1000 });
    const dbTenants = tRes.data;

    const storedTenants = localStorage.getItem("custom-tenants");
    const { mockTenants } = await import("../data/tenants");
    const localTenants: any[] = storedTenants ? JSON.parse(storedTenants) : mockTenants;

    let changed = false;
    contracts = contracts.map((c) => {
      const localT = localTenants.find((lt) => lt.id === c.tenant_id);
      if (localT) {
        const dbT = dbTenants.find(
          (dt) =>
            dt.citizen_id === localT.citizen_id ||
            dt.full_name.toLowerCase().trim() === localT.full_name.toLowerCase().trim()
        );
        if (dbT && dbT.id !== c.tenant_id) {
          c.tenant_id = dbT.id;
          changed = true;
        }
      }
      return c;
    });

    if (changed) {
      localStorage.setItem("custom-contracts", JSON.stringify(contracts));
    }
  } catch (err) {
    console.error("Lỗi đồng bộ ID người thuê:", err);
  }

  if (params?.buildingId) {
    const storedApts = localStorage.getItem("custom-apartments");
    const { mockApartments } = await import("../data/apartments");
    const apartments = storedApts ? JSON.parse(storedApts) : mockApartments;

    const buildingApartmentIds = apartments
      .filter((a: any) => a.building_id === params.buildingId)
      .map((a: any) => a.id);

    contracts = contracts.filter((c) => buildingApartmentIds.includes(c.apartment_id));
  }

  if (params?.tenantId) {
    contracts = contracts.filter((c) => c.tenant_id === params.tenantId);
  }

  if (params?.status) {
    contracts = contracts.filter((c) => c.status === params.status);
  }

  if (params?.search) {
    const searchLow = params.search.toLowerCase();
    contracts = contracts.filter(
      (c) =>
        String(c.id).includes(searchLow) ||
        `HD-${c.id}`.toLowerCase().includes(searchLow)
    );
  }

  return contracts;
}

export async function getContractById(id: number): Promise<RentalContract | null> {
  const contracts = getMigratedContracts();
  return contracts.find((c) => c.id === id) || null;
}

export async function createContract(data: Partial<RentalContract>): Promise<RentalContract> {
  const contracts = getMigratedContracts();

  const maxId = contracts.reduce((max, c) => (c.id > max ? c.id : max), 0);
  const newId = maxId + 1;

  const newContract: RentalContract = {
    id: data.id && data.id <= 1000000 ? data.id : newId,
    apartment_id: Number(data.apartment_id),
    tenant_id: Number(data.tenant_id),
    start_date: data.start_date || new Date().toISOString().split("T")[0],
    end_date: data.end_date || new Date().toISOString().split("T")[0],
    deposit_amount: Number(data.deposit_amount),
    monthly_rent: Number(data.monthly_rent),
    status: (data.status as any) || "ACTIVE",
    contractFile: data.contractFile || null,
    signedAt: data.signedAt || new Date().toISOString().split("T")[0],
    createdBy: data.createdBy || 1,
    created_at: new Date().toISOString(),
    actual_occupants: data.actual_occupants || 1,
    max_occupants: data.max_occupants || 2,
  };

  contracts.push(newContract);
  localStorage.setItem("custom-contracts", JSON.stringify(contracts));
  return newContract;
}

export async function extendContract(id: number, newEndDate: string): Promise<RentalContract> {
  const contracts = getMigratedContracts();

  const index = contracts.findIndex((c) => c.id === id);
  if (index === -1) {
    throw new Error("Không tìm thấy hợp đồng");
  }

  contracts[index] = {
    ...contracts[index],
    end_date: newEndDate,
    extended_at: new Date().toISOString(),
  } as any;

  localStorage.setItem("custom-contracts", JSON.stringify(contracts));
  return contracts[index];
}
