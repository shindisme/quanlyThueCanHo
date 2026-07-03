import { useState, useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { contractSchema, type ContractFormValues } from "../schemas/contract.schema"
import * as apartmentService from "../services/apartmentService"
import * as authService from "../services/authService"
import * as tenantService from "../services/tenantService"
import { createContract } from "../services/contractService"
import type { ApartmentData } from "../services/apartmentService"
import type { RentalContract } from "../types"

interface UseContractCreateProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  currentUser: { id: number }
  role: string | null
  managerBuildingId?: number
  initialTenantId?: number
  initialBuildingId?: number
  apartments: ApartmentData[]
}

export function useContractCreate({
  isOpen,
  onClose,
  onSuccess,
  currentUser,
  role,
  managerBuildingId,
  initialTenantId,
  initialBuildingId,
  apartments,
}: UseContractCreateProps) {
  const queryClient = useQueryClient();
  const createMutation = useMutation({
    mutationFn: async (data: ContractFormValues) => {
      let finalTenantId: number

      if (data.is_new_tenant) {
        const cleanCCCD = data.new_tenant_cccd!.trim()
        const last6Digits = cleanCCCD.slice(-6)
        const username = `YH${last6Digits}`
        const defaultEmail = `${username}@yukihouse.vn`
        const finalEmail = data.new_tenant_email?.trim() || defaultEmail
        const finalPhone = data.new_tenant_phone?.trim() || null

        const allTenantsRes = await tenantService.getAllTenants({ limit: 100 }).catch(() => ({ data: [] }));
        const allTenants = allTenantsRes.data || [];

        if (finalPhone) {
          const dup = allTenants.find((t) => t.phone === finalPhone);
          if (dup) {
            throw new Error("Số điện thoại này đã tồn tại trong hệ thống.");
          }
        }

        if (finalEmail) {
          const dup = allTenants.find(
            (t) => t.email && t.email.toLowerCase() === finalEmail.toLowerCase()
          );
          if (dup) {
            throw new Error("Email này đã tồn tại trong hệ thống.");
          }
        }

        if (cleanCCCD) {
          const dup = allTenants.find((t) => t.citizen_id === cleanCCCD);
          if (dup) {
            throw new Error("Số CCCD này đã tồn tại trong hệ thống.");
          }
        }

        const userRes = await authService.createUser({
          username,
          role: "TENANT",
        })

        let tenant
        try {
          tenant = await tenantService.createTenant({
            full_name: data.new_tenant_name!,
            citizen_id: cleanCCCD,
            date_of_birth: data.new_tenant_dob ? new Date(data.new_tenant_dob).toISOString() : null,
            address: data.new_tenant_address || null,
            email: finalEmail,
            phone: finalPhone,
            user_id: userRes.userId,
          })
        } catch (tenantError) {
          await authService.deleteUser(userRes.userId).catch((err) => {
            console.error("Cleanup user account failed:", err);
          });
          throw tenantError;
        }

        finalTenantId = tenant.id
        toast.success(`Đã tự động tạo tài khoản "${username}" cho người thuê mới!`)
      } else {
        finalTenantId = Number(data.tenant_id)
      }

      const newContract = {
        tenant_id: finalTenantId,
        apartment_id: Number(data.apartment_id),
        start_date: data.start_date,
        end_date: data.end_date,
        monthly_rent: data.monthly_rent,
        deposit_amount: data.deposit_amount,
        status: "ACTIVE",
        contractFile: null,
        signedAt: new Date().toISOString().split("T")[0],
        createdBy: currentUser?.id || 1,
        actual_occupants: Number(data.actual_occupants) || 1,
        max_occupants: maxOccupants,
      }

      await createContract(newContract as unknown as Partial<RentalContract>)

      try {
        await apartmentService.updateApartment(Number(data.apartment_id), { status: "RENTED" })
      } catch (err) {
        console.error("Failed to update apartment status:", err);
      }
    },
    onSuccess: () => {
      toast.success("Đã tạo hợp đồng thành công và cập nhật trạng thái căn hộ!")
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["apartments"] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      onSuccess()
      onClose()
    },
    onError: (error: unknown) => {
      const err = error as { message?: string; response?: { data?: { message?: string } } };
      toast.error(err.message || err.response?.data?.message || "Không thể tạo hợp đồng")
    }
  });
  const saving = createMutation.isPending;
  const [buildingApartments, setBuildingApartments] = useState<ApartmentData[]>([])
  const [maxOccupants, setMaxOccupants] = useState<number>(2)
  const [prevApartmentId, setPrevApartmentId] = useState<number | undefined>()

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      is_new_tenant: false,
      tenant_id: null,
      new_tenant_name: "",
      new_tenant_cccd: "",
      new_tenant_dob: "",
      new_tenant_email: "",
      new_tenant_phone: "",
      new_tenant_address: "",
      building_id: undefined,
      floor: undefined,
      apartment_id: undefined,
      start_date: "",
      end_date: "",
      actual_occupants: 1,
      monthly_rent: 0,
      deposit_amount: 0,
    },
  })

  const isNewTenant = useWatch({ control, name: "is_new_tenant" })
  const tenantIdValue = useWatch({ control, name: "tenant_id" })
  const buildingIdValue = useWatch({ control, name: "building_id" })
  const floorValue = useWatch({ control, name: "floor" })
  const apartmentIdValue = useWatch({ control, name: "apartment_id" })
  const actualOccupantsValue = useWatch({ control, name: "actual_occupants" })
  const monthlyRentValue = useWatch({ control, name: "monthly_rent" })
  const depositAmountValue = useWatch({ control, name: "deposit_amount" })
  const newTenantDobValue = useWatch({ control, name: "new_tenant_dob" })
  const startDateValue = useWatch({ control, name: "start_date" })
  const endDateValue = useWatch({ control, name: "end_date" })

  useEffect(() => {
    if (isOpen) {
      reset({
        is_new_tenant: false,
        tenant_id: initialTenantId || null,
        new_tenant_name: "",
        new_tenant_cccd: "",
        new_tenant_dob: "",
        new_tenant_email: "",
        new_tenant_phone: "",
        new_tenant_address: "",
        building_id: initialBuildingId || (role === "MANAGER" ? managerBuildingId : undefined),
        floor: undefined,
        apartment_id: undefined,
        start_date: "",
        end_date: "",
        actual_occupants: 1,
        monthly_rent: 0,
        deposit_amount: 0,
      })
      setTimeout(() => {
        setPrevApartmentId(undefined)
      }, 0)
    }
  }, [isOpen, initialTenantId, initialBuildingId, role, managerBuildingId, reset])

  useEffect(() => {
    let active = true
    if (buildingIdValue) {
      Promise.all([
        apartmentService.getAllApartments({ building_id: buildingIdValue, limit: 100, page: 1 }),
        apartmentService.getAllApartments({ building_id: buildingIdValue, limit: 100, page: 2 }),
      ])
        .then(([res1, res2]) => {
          if (active) {
            const combined = [...res1.data, ...res2.data]
            const unique = combined.filter((a, index, self) => self.findIndex((t) => t.id === a.id) === index)
            setBuildingApartments(unique)
          }
        })
        .catch(() => {
          toast.error("Không thể tải danh sách căn hộ của tòa nhà")
        })
    } else {
      setTimeout(() => {
        if (active) {
          setBuildingApartments((prev) => {
            if (prev.length > 0) return []
            return prev
          })
        }
      }, 0)
    }
    return () => {
      active = false
    }
  }, [buildingIdValue])

  useEffect(() => {
    const handler = setTimeout(() => {
      if (apartmentIdValue) {
        const apt = buildingApartments.find((a) => a.id === apartmentIdValue) || apartments.find((a) => a.id === apartmentIdValue)
        if (apt) {
          const calculatedMax = Math.max(2, apt.bedrooms * 2)
          setMaxOccupants(calculatedMax)

          const occupantsCount = Number(actualOccupantsValue) || 1
          const extraPeople = occupantsCount > calculatedMax ? occupantsCount - calculatedMax : 0
          const baseRent = Number(apt.rental_price)
          const calculatedRent = baseRent + extraPeople * 1000000
          setValue("monthly_rent", calculatedRent)

          if (apartmentIdValue !== prevApartmentId) {
            setValue("deposit_amount", baseRent)
            setPrevApartmentId(apartmentIdValue)
          }
        }
      } else {
        setValue("monthly_rent", 0)
        setValue("deposit_amount", 0)
        setMaxOccupants(2)
        setPrevApartmentId(undefined)
      }
    }, 0)
    return () => clearTimeout(handler)
  }, [apartmentIdValue, actualOccupantsValue, buildingApartments, apartments, prevApartmentId, setValue])

  const formFloors = (() => {
    if (!buildingIdValue) return []
    const buildingApts = buildingApartments.filter((a) => ["available", "vacant", "AVAILABLE"].includes(a.status))
    const floors = buildingApts.map((a) => a.floor)
    return [...new Set(floors)].sort((a, b) => a - b)
  })()

  const formApartments = (() => {
    if (!buildingIdValue || !floorValue) return []
    return buildingApartments.filter(
      (a) =>
        a.building_id === buildingIdValue &&
        a.floor === floorValue &&
        ["available", "vacant", "AVAILABLE"].includes(a.status)
    )
  })()

  function onSubmit(data: ContractFormValues) {
    createMutation.mutate(data)
  }

  const handleFormSubmit = handleSubmit(onSubmit)

  return {
    register,
    handleFormSubmit,
    setValue,
    errors,
    saving,
    isNewTenant,
    tenantIdValue,
    buildingIdValue,
    floorValue,
    apartmentIdValue,
    actualOccupantsValue,
    monthlyRentValue,
    depositAmountValue,
    maxOccupants,
    formFloors,
    formApartments,
    buildingApartments,
    newTenantDobValue,
    startDateValue,
    endDateValue,
  }
}
