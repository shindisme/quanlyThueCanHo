import { useState, useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { buildingSchema, type BuildingFormValues } from "../schemas/building.schema"
import * as buildingService from "../services/buildingService"
import type { Staff } from "../types"

interface UseBuildingCreateProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function useBuildingCreate({ isOpen, onClose, onSuccess }: UseBuildingCreateProps) {
  const [saving, setSaving] = useState(false)
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<BuildingFormValues>({
    resolver: zodResolver(buildingSchema),
    defaultValues: {
      branch_name: "",
      address_old: "",
      address_new: "",
      total_floors: 0,
      staff_id: null,
      description: "",
    },
  })

  const staffIdValue = useWatch({ control, name: "staff_id" })

  async function fetchManagers() {
    try {
      const { getAllStaff } = await import("../services/staffService")
      const staffRes = await getAllStaff()
      setStaffList(staffRes.data)
    } catch {
      toast.error("Không thể tải danh sách người quản lý")
    }
  }

  useEffect(() => {
    if (isOpen) {
      reset({
        branch_name: "",
        address_old: "",
        address_new: "",
        total_floors: 0,
        staff_id: null,
        description: "",
      })
      setTimeout(() => {
        setThumbnailFile(null)
        setPreviewUrl("")
        fetchManagers()
      }, 0)
    }
  }, [isOpen, reset])

  const availableManagers = staffList.filter((m) => {
    const isManager = m.position === "Quản lý" || m.user?.role === "MANAGER"
    if (!isManager) return false
    if (m.user?.role === "ADMIN") return false
    if (!m.building_id) return true
    return false
  })

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setThumbnailFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      toast.success("Đã chọn ảnh")
    }
  }

  function handleRemoveImage() {
    setThumbnailFile(null)
    setPreviewUrl("")
  }

  async function onSubmit(data: BuildingFormValues) {
    setSaving(true)
    try {
      const formDataToSend = new FormData()
      formDataToSend.append("name", data.branch_name)
      formDataToSend.append("branch_name", data.branch_name)
      formDataToSend.append("address_old", data.address_old)
      formDataToSend.append("address_new", data.address_new)
      formDataToSend.append("total_floors", String(data.total_floors))
      formDataToSend.append("description", data.description || "")
      if (data.staff_id) {
        formDataToSend.append("staff_id", String(data.staff_id))
      }
      if (thumbnailFile) {
        formDataToSend.append("image", thumbnailFile)
      }

      await buildingService.createBuilding(formDataToSend)
      toast.success("Đã thêm tòa nhà mới")
      onSuccess()
      onClose()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string; message?: string } } };
      toast.error(err.response?.data?.error || err.response?.data?.message || "Thao tác thất bại")
    } finally {
      setSaving(false)
    }
  }

  return {
    register,
    handleSubmit,
    setValue,
    onSubmit,
    errors,
    saving,
    availableManagers,
    previewUrl,
    handleImageUpload,
    handleRemoveImage,
    staffIdValue,
  }
}
