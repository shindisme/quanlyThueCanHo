import { useParams } from "react-router-dom"
import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import * as apartmentService from "../services/apartmentService"
import * as buildingService from "../services/buildingService"
import * as contractService from "../services/contractService"
import * as tenantService from "../services/tenantService"
import * as authService from "../services/authService"
import { getApartmentReviews, type ReviewData, type ReviewMeta } from "../services/reviewService"
import type { ApartmentData } from "../services/apartmentService"
import type { BuildingData } from "../services/buildingService"
import type { ApartmentImage, RentalContract, Tenant, User } from "../types"

interface Occupant {
  id: string
  name: string
  cccd: string
  dob: string
  phone: string
}

export function useApartmentDetail() {
  const { id } = useParams()
  const [apartment, setApartment] = useState<ApartmentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [images, setImages] = useState<ApartmentImage[]>([])
  const [uploading, setUploading] = useState(false)
  const [buildings, setBuildings] = useState<BuildingData[]>([])
  const [showModifyModal, setShowModifyModal] = useState(false)
  const [contracts, setContracts] = useState<RentalContract[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [occupants, setOccupants] = useState<Occupant[]>([])
  const [reviews, setReviews] = useState<ReviewData[]>([])
  const [reviewMeta, setReviewMeta] = useState<ReviewMeta>({ averageRating: 0, totalReviews: 0, currentPage: 1, totalPages: 1 })
  const [activeTab, setActiveTab] = useState<"tenant" | "tenantHistory" | "reviews">("tenant")

  const activeContract = contracts.find(
    (c) => c.apartment_id === Number(id) && c.status === "ACTIVE"
  )
  const activeTenant = activeContract
    ? tenants.find((t) => t.id === activeContract.tenant_id)
    : null
  const activeTenantUser = activeTenant
    ? users.find((u) => u.id === activeTenant.user_id)
    : null

  const historyContracts = contracts.filter((c) => c.apartment_id === Number(id))
  const tenantContracts = activeTenant
    ? historyContracts.filter((c) => c.tenant_id === activeTenant.id)
    : []

  useEffect(() => {
    let active = true
    setTimeout(() => {
      if (!active) return
      if (activeTenantUser?.email) {
        const stored = localStorage.getItem(`occupants-${activeTenantUser.email}`)
        if (stored) {
          try {
            setOccupants(JSON.parse(stored))
          } catch {
            setOccupants([])
          }
        } else {
          setOccupants([])
        }
      } else {
        setOccupants([])
      }
    }, 0)
    return () => {
      active = false
    }
  }, [activeTenantUser])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [bRes, aptData, contractsData, tenantsRes, usersData, reviewsRes] = await Promise.all([
        buildingService.getAllBuildings(),
        apartmentService.getApartmentById(Number(id)),
        contractService.getAllContracts().catch(() => []),
        tenantService.getAllTenants({ limit: 1000 }).catch(() => ({ data: [] })),
        authService.getAllUsers().catch(() => []),
        getApartmentReviews(Number(id)).catch(() => ({ data: [], meta: { averageRating: 0, totalReviews: 0, currentPage: 1, totalPages: 1 } })),
      ])
      setBuildings(bRes.data)
      setApartment(aptData)
      setImages(aptData.images || [])
      setContracts(contractsData)
      setTenants(tenantsRes.data)
      setUsers(usersData as unknown as User[])
      setReviews(reviewsRes.data)
      setReviewMeta(reviewsRes.meta)
    } catch {
      toast.error("Không thể tải dữ liệu")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (!id) return
    const handler = setTimeout(() => {
      fetchData()
    }, 0)
    return () => clearTimeout(handler)
  }, [id, fetchData])

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formDataToSend = new FormData()
      formDataToSend.append("images", file)

      await apartmentService.updateApartment(Number(id), formDataToSend)
      toast.success("Tải ảnh lên thành công")
      await fetchData()
    } catch {
      toast.error("Không thể tải ảnh lên")
    } finally {
      setUploading(false)
    }
  }

  function handleSetThumbnail(imgId: number) {
    const updated = images.map((img) => ({
      ...img,
      is_thumbnail: img.id === imgId
    }))
    setImages(updated)
    toast.success("Đã đặt làm ảnh đại diện")
  }

  function handleDeleteImage(imgId: number) {
    const updated = images.filter((img) => img.id !== imgId)
    if (images.find((img) => img.id === imgId)?.is_thumbnail && updated.length > 0) {
      updated[0].is_thumbnail = true
    }
    setImages(updated)
    toast.success("Đã xóa hình ảnh")
  }

  return {
    id,
    apartment,
    loading,
    images,
    uploading,
    buildings,
    showModifyModal,
    setShowModifyModal,
    contracts,
    tenants,
    users,
    occupants,
    reviews,
    reviewMeta,
    activeTab,
    setActiveTab,
    activeContract,
    activeTenant,
    activeTenantUser,
    tenantContracts,
    fetchData,
    handleImageUpload,
    handleSetThumbnail,
    handleDeleteImage,
  }
}
