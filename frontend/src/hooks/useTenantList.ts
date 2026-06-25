import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { removeVietnameseTones } from "../utils/format"
import * as tenantService from "../services/tenantService"
import * as contractService from "../services/contractService"
import * as apartmentService from "../services/apartmentService"
import * as buildingService from "../services/buildingService"
import type { Tenant, RentalContract } from "../types"
import type { ApartmentData } from "../services/apartmentService"
import type { BuildingData } from "../services/buildingService"

interface UseTenantListProps {
  role: string | null
  managedBuildingId: number | null
}

export function useTenantList({ role, managedBuildingId }: UseTenantListProps) {
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showModifyModal, setShowModifyModal] = useState(false)
  const [editItem, setEditItem] = useState<Tenant | null>(null)
  const [deleteItem, setDeleteItem] = useState<Tenant | null>(null)
  const [viewItem, setViewItem] = useState<Tenant | null>(null)

  const [tenants, setTenants] = useState<Tenant[]>([])
  const [contracts, setContracts] = useState<RentalContract[]>([])
  const [apartments, setApartments] = useState<ApartmentData[]>([])
  const [buildings, setBuildings] = useState<BuildingData[]>([])

  const loadData = useCallback(async () => {
    try {
      const res = await tenantService.getAllTenants({ page: currentPage })
      setTenants(res.data)
      if (res.data.length === 10) {
        setTotalPages(currentPage + 1)
      } else {
        setTotalPages(currentPage)
      }

      const [cRes, aptRes, bRes] = await Promise.all([
        contractService.getAllContracts().catch(() => []),
        apartmentService.getAllApartments({ limit: 100 }).catch(() => ({ data: [] })),
        buildingService.getAllBuildings({ limit: 100 }).catch(() => ({ data: [] })),
      ])
      setContracts(cRes)
      setApartments(aptRes.data)
      setBuildings(bRes.data)
    } catch {
      toast.error("Không thể tải danh sách người thuê")
    }
  }, [currentPage])

  useEffect(() => {
    const handler = setTimeout(() => {
      loadData()
    }, 0)
    return () => clearTimeout(handler)
  }, [loadData])

  const displayTenants = (() => {
    if (role === "MANAGER" && managedBuildingId) {
      const managerApartmentIds = apartments
        .filter((a) => a.building_id === managedBuildingId)
        .map((a) => a.id)
      const managerTenantIds = contracts
        .filter((c: RentalContract) => managerApartmentIds.includes(c.apartment_id))
        .map((c: RentalContract) => c.tenant_id)
      return tenants.filter((t) => managerTenantIds.includes(t.id))
    }
    return tenants
  })()

  const displayTenantsWithContracts = displayTenants.map((t) => {
    const tenantContracts = contracts.filter((c) => c.tenant_id === t.id)
    const activeContract = tenantContracts.find((c) => c.status === "ACTIVE") || tenantContracts[0]

    if (activeContract) {
      const apt = apartments.find((a) => a.id === activeContract.apartment_id)
      const bld = apt ? buildings.find((b) => b.id === apt.building_id) : null
      return {
        ...t,
        contracts: [
          {
            ...activeContract,
            apartment: apt ? {
              ...apt,
              building: bld,
            } : undefined,
          },
        ],
      } as unknown as Tenant
    }
    return { ...t, contracts: [] } as unknown as Tenant
  })

  const filtered = displayTenantsWithContracts.filter((t) => {
    const term = removeVietnameseTones(search)
    const nameNorm = removeVietnameseTones(t.full_name)
    const citizenNorm = removeVietnameseTones(t.citizen_id)
    return nameNorm.includes(term) || citizenNorm.includes(term)
  })

  async function handleDelete() {
    if (!deleteItem) return
    try {
      await tenantService.deleteTenant(deleteItem.id)
      setDeleteItem(null)
      toast.success("Đã xóa người thuê")
      loadData()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Xóa người thuê thất bại")
    }
  }

  return {
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    totalPages,
    showCreateModal,
    setShowCreateModal,
    showModifyModal,
    setShowModifyModal,
    editItem,
    setEditItem,
    deleteItem,
    setDeleteItem,
    viewItem,
    setViewItem,
    filtered,
    loadData,
    handleDelete,
  }
}
