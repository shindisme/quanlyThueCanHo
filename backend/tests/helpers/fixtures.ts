export const managerIds = {
    userId: 101,
    staffId: 201,
    buildingId: 301
} as const;

export const validBuildingPayload = {
    branch_name: "Chi nhánh Quận 1",
    address_old: "12 Nguyễn Huệ, Quận 1",
    address_new: "12 Nguyễn Huệ, Phường Sài Gòn",
    description: "Tòa nhà căn hộ trung tâm",
    status: "ACTIVE",
    total_floors: 8
} as const;

export const validTenantPayload = {
    full_name: "Nguyễn Văn An",
    phone: "0901234567",
    email: "an.nguyen@example.com",
    date_of_birth: "1995-05-15",
    citizen_id: "079095001234",
    address: "25 Lê Lợi, Thành phố Hồ Chí Minh"
} as const;

export const validContractPayload = {
    apartment_id: 401,
    tenant_id: 501,
    start_date: "2026-07-01",
    end_date: "2027-06-30",
    deposit_amount: 12000000,
    monthly_rent: 6000000,
    signed_at: "2026-06-28",
    status: "ACTIVE"
} as const;

export const validStaffPayload = {
    full_name: "Trần Minh Bình",
    phone: "0912345678",
    position: "Quản lý tòa nhà",
    building_id: managerIds.buildingId
} as const;
