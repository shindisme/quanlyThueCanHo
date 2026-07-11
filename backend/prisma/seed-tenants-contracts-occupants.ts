import { existsSync } from "node:fs";
import {
    fileURLToPath,
    pathToFileURL
} from "node:url";
import {
    ApartmentStatus,
    ContractStatus,
    Prisma,
    PrismaClient,
    Role,
    UserStatus
} from "@prisma/client";
import xlsx from "xlsx";
import {
    createInitialCredential,
    tenantUsername
} from "../src/services/account.service.js";

const prisma = new PrismaClient();

const EXCEL_URL = new URL(
    "./data/danh_sach_400_nguoi_thue_va_600_nguoi_o_cung.xlsx",
    import.meta.url
);
const EXCEL_PATH = fileURLToPath(EXCEL_URL);
const TENANT_SHEET = "400 người thuê";
const OCCUPANT_SHEET = "600 người ở cùng";
const TENANT_COUNT = 400;
const OCCUPANT_COUNT = 600;
const BUILDING_COUNT = 5;
const TENANTS_PER_BUILDING = 80;
const PASSWORD = "123123";

type Mode = "dry-run" | "execute";

type TenantRow = {
    stt: number;
    fullName: string;
    citizenId: string;
    phone: string;
    dateOfBirth: Date;
    email: string;
    address: string;
};

type OccupantRow = {
    stt: number;
    fullName: string;
    citizenId: string;
    phone: string;
    dateOfBirth: Date;
};

type BuildingForSeed = {
    id: number;
    branch_name: string;
};

type ApartmentForSeed = {
    id: number;
    building_id: number;
    floor: number;
    room_number: string;
    bedrooms: number;
    rental_price: Prisma.Decimal;
};

type ContractPeriod = {
    startDate: Date;
    endDate: Date;
    status: ContractStatus;
};

type TenantPlan = {
    tenant: TenantRow;
    building: BuildingForSeed;
    apartment: ApartmentForSeed;
    startDate: Date;
    contractPeriods: ContractPeriod[];
    occupants: OccupantRow[];
};

type Counters = {
    usersCreated: number;
    usersReused: number;
    tenantsCreated: number;
    tenantsReused: number;
    apartmentsRented: number;
    occupantsCreated: number;
    occupantsReused: number;
    contractsCreatedEnded: number;
    contractsCreatedActive: number;
    contractsReusedEnded: number;
    contractsReusedActive: number;
};

type ExcludedCounts = {
    invoices: number;
    invoiceItems: number;
    payments: number;
    notifications: number;
    reviews: number;
    viewingSchedules: number;
    maintenanceRequests: number;
};

const emptyCounters = (): Counters => ({
    usersCreated: 0,
    usersReused: 0,
    tenantsCreated: 0,
    tenantsReused: 0,
    apartmentsRented: 0,
    occupantsCreated: 0,
    occupantsReused: 0,
    contractsCreatedEnded: 0,
    contractsCreatedActive: 0,
    contractsReusedEnded: 0,
    contractsReusedActive: 0
});

const mergeCounters = (target: Counters, source: Counters) => {
    for (const key of Object.keys(target) as Array<keyof Counters>) {
        target[key] += source[key];
    }
};

function assert(condition: unknown, message: string): asserts condition {
    if (!condition) {
        throw new Error(message);
    }
}

const pad2 = (value: number) => value.toString().padStart(2, "0");
const dateKey = (date: Date) =>
    `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;

export const getMaximumOccupants = (bedrooms: number): number => {
    if (bedrooms <= 1) {
        return 2;
    }

    if (bedrooms === 2) {
        return 4;
    }

    if (bedrooms === 3) {
        return 6;
    }

    return 8;
};

export const getMaximumAdditionalOccupants = (bedrooms: number): number =>
    getMaximumOccupants(bedrooms) - 1;

export const normalizeCitizenId = (value: unknown) => {
    const digits = String(value ?? "").replace(/\D/g, "");
    const normalized = digits.padStart(12, "0");

    if (!/^\d{12}$/.test(normalized)) {
        throw new Error(`CCCD không hợp lệ: ${value}`);
    }

    return normalized;
};

export const normalizePhone = (value: unknown) => {
    const digits = String(value ?? "").replace(/\D/g, "");

    if (!/^0\d{9,10}$/.test(digits)) {
        throw new Error(`SĐT không hợp lệ: ${value}`);
    }

    return digits;
};

const stripVietnameseMarks = (value: string) =>
    value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

const hasHoChiMinhAddress = (address: string) => {
    const normalized = stripVietnameseMarks(address)
        .replace(/[.,]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    return normalized.includes("ho chi minh")
        || normalized.includes("tp hcm")
        || normalized.includes("tphcm");
};

const parseMode = (): Mode => {
    const execute = process.argv.includes("--execute");
    const dryRun = process.argv.includes("--dry-run");

    assert(!(execute && dryRun), "Chỉ được dùng một trong --dry-run hoặc --execute.");

    return execute ? "execute" : "dry-run";
};

const assertNotProduction = () => {
    const rawUrl = process.env.DATABASE_URL ?? "";
    const parsed = rawUrl ? new URL(rawUrl) : null;
    const fingerprint = `${parsed?.hostname ?? ""} ${parsed?.pathname ?? ""}`.toLowerCase();
    const productionMarkers = ["prod", "production", "live"];

    assert(
        !productionMarkers.some((marker) => fingerprint.includes(marker)),
        "DATABASE_URL có dấu hiệu production; script chỉ chạy dry-run."
    );
};

const readWorkbook = () => {
    assert(
        existsSync(EXCEL_PATH),
        `Thiếu file Excel: ${EXCEL_PATH}. Hãy sao chép file vào backend/prisma/data rồi chạy lại.`
    );

    return xlsx.readFile(EXCEL_PATH, {
        cellDates: true
    });
};

const sheetRows = (workbook: xlsx.WorkBook, sheetName: string) => {
    const sheet = workbook.Sheets[sheetName];
    assert(sheet, `Không tìm thấy sheet "${sheetName}".`);

    return xlsx.utils.sheet_to_json<string[]>(sheet, {
        header: 1,
        defval: "",
        raw: false,
        blankrows: false
    });
};

const findHeaderIndex = (rows: string[][], sheetName: string) => {
    const index = rows.findIndex((row) => String(row[0]).trim() === "STT");

    assert(index >= 0, `Sheet "${sheetName}" thiếu dòng header STT.`);

    return index;
};

const parseUtcDate = (value: unknown, label: string) => {
    const text = String(value ?? "").trim();
    const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
        ?? text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

    assert(match, `${label} không đúng định dạng ngày: ${text}`);

    const yearFirst = text.includes("-");
    const year = Number(yearFirst ? match[1] : match[3]);
    const month = Number(yearFirst ? match[2] : match[2]);
    const day = Number(yearFirst ? match[3] : match[1]);
    const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

    assert(
        date.getUTCFullYear() === year
        && date.getUTCMonth() === month - 1
        && date.getUTCDate() === day,
        `${label} không phải ngày hợp lệ: ${text}`
    );

    return date;
};

const requireText = (value: unknown, label: string) => {
    const text = String(value ?? "").trim();

    assert(text.length > 0, `Thiếu ${label}.`);

    return text;
};

const readTenantRows = (workbook: xlsx.WorkBook): TenantRow[] => {
    const rows = sheetRows(workbook, TENANT_SHEET);
    const headerIndex = findHeaderIndex(rows, TENANT_SHEET);
    const dataRows = rows.slice(headerIndex + 1).filter((row) => String(row[0]).trim() !== "");

    assert(dataRows.length === TENANT_COUNT, `Sheet người thuê có ${dataRows.length}/${TENANT_COUNT} dòng.`);

    return dataRows.map((row, index) => {
        const tenant = {
            stt: Number(row[0]),
            fullName: requireText(row[1], `họ tên người thuê dòng ${index + 1}`),
            citizenId: normalizeCitizenId(row[2]),
            phone: normalizePhone(row[3]),
            dateOfBirth: parseUtcDate(row[4], `ngày sinh người thuê dòng ${index + 1}`),
            email: requireText(row[5], `email người thuê dòng ${index + 1}`).toLowerCase(),
            address: requireText(row[6], `địa chỉ người thuê dòng ${index + 1}`)
        };

        assert(Number.isInteger(tenant.stt), `STT người thuê dòng ${index + 1} không hợp lệ.`);
        assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tenant.email), `Email không hợp lệ: ${tenant.email}`);
        assert(!hasHoChiMinhAddress(tenant.address), `Địa chỉ thuộc TP.HCM: ${tenant.address}`);

        return tenant;
    });
};

const readOccupantRows = (workbook: xlsx.WorkBook): OccupantRow[] => {
    const rows = sheetRows(workbook, OCCUPANT_SHEET);
    const headerIndex = findHeaderIndex(rows, OCCUPANT_SHEET);
    const dataRows = rows.slice(headerIndex + 1).filter((row) => String(row[0]).trim() !== "");

    assert(dataRows.length === OCCUPANT_COUNT, `Sheet người ở cùng có ${dataRows.length}/${OCCUPANT_COUNT} dòng.`);

    return dataRows.map((row, index) => {
        const occupant = {
            stt: Number(row[0]),
            fullName: requireText(row[1], `họ tên người ở cùng dòng ${index + 1}`),
            citizenId: normalizeCitizenId(row[2]),
            phone: normalizePhone(row[3]),
            dateOfBirth: parseUtcDate(row[4], `ngày sinh người ở cùng dòng ${index + 1}`)
        };

        assert(Number.isInteger(occupant.stt), `STT người ở cùng dòng ${index + 1} không hợp lệ.`);

        return occupant;
    });
};

const assertUniqueInput = (tenants: TenantRow[], occupants: OccupantRow[]) => {
    const citizenIds = new Set<string>();
    const phones = new Set<string>();
    const emails = new Set<string>();
    const tenantSuffixes = new Set<string>();

    for (const person of [...tenants, ...occupants]) {
        assert(!citizenIds.has(person.citizenId), `Trùng CCCD trong Excel: ${person.citizenId}`);
        assert(!phones.has(person.phone), `Trùng SĐT trong Excel: ${person.phone}`);
        citizenIds.add(person.citizenId);
        phones.add(person.phone);
    }

    for (const tenant of tenants) {
        const suffix = tenant.citizenId.slice(-6);

        assert(!emails.has(tenant.email), `Trùng email trong Excel: ${tenant.email}`);
        assert(!tenantSuffixes.has(suffix), `Trùng 6 số cuối CCCD người thuê: ${suffix}`);
        emails.add(tenant.email);
        tenantSuffixes.add(suffix);
    }
};

const startOfUtcDay = (date: Date) =>
    new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const addUtcDays = (date: Date, days: number) =>
    new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));

const addUtcYears = (date: Date, years: number) =>
    new Date(Date.UTC(date.getUTCFullYear() + years, date.getUTCMonth(), date.getUTCDate()));

const daysBetweenInclusive = (start: Date, end: Date) =>
    Math.floor((startOfUtcDay(end).getTime() - startOfUtcDay(start).getTime()) / 86_400_000) + 1;

export const buildInitialStartDate = (tenantIndex: number, todayInput: Date) => {
    const year = 2022 + Math.floor(tenantIndex / TENANTS_PER_BUILDING);
    const localIndex = tenantIndex % TENANTS_PER_BUILDING;
    const startOfYear = new Date(Date.UTC(year, 0, 1));
    const today = startOfUtcDay(todayInput);
    const availableDays = year === today.getUTCFullYear()
        ? Math.max(1, daysBetweenInclusive(startOfYear, today))
        : 365;
    let date = addUtcDays(startOfYear, (localIndex * 17) % availableDays);

    if (date.getUTCMonth() === 1 && date.getUTCDate() === 29) {
        date = addUtcDays(date, 1);
    }

    return date > today ? today : date;
};

export const buildContractPeriods = (
    startDate: Date,
    todayInput: Date
): ContractPeriod[] => {
    const today = startOfUtcDay(todayInput);
    const periods: ContractPeriod[] = [];
    let periodStart = startDate;

    while (periodStart <= today) {
        const periodEnd = addUtcYears(periodStart, 1);
        const status = periodEnd <= today
            ? ContractStatus.ENDED
            : ContractStatus.ACTIVE;

        periods.push({
            startDate: periodStart,
            endDate: periodEnd,
            status
        });

        if (status === ContractStatus.ACTIVE) {
            break;
        }

        periodStart = periodEnd;
    }

    assert(periods.some((period) => period.status === ContractStatus.ACTIVE), "Không tạo được hợp đồng ACTIVE.");

    return periods;
};

const RETRYABLE_TRANSACTION_PATTERNS = [
    /Transaction API error/i,
    /Transaction not found/i,
    /Transaction already closed/i,
    /Timed out fetching a new connection/i,
    /Unable to start a transaction/i
];

const getErrorCode = (error: unknown) => {
    if (typeof error === "object" && error !== null && "code" in error) {
        return String((error as { code?: unknown }).code ?? "");
    }

    return "";
};

const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) {
        return error.message;
    }

    if (typeof error === "object" && error !== null && "message" in error) {
        return String((error as { message?: unknown }).message ?? "");
    }

    return String(error);
};

export const isRetryableTransactionError = (error: unknown) => {
    const code = getErrorCode(error);
    const message = getErrorMessage(error);

    return code === "P2028"
        || RETRYABLE_TRANSACTION_PATTERNS.some((pattern) => pattern.test(message));
};

const sleep = (milliseconds: number) =>
    new Promise((resolve) => {
        setTimeout(resolve, milliseconds);
    });

const runTenantTransaction = async <T>(
    work: (tx: Prisma.TransactionClient) => Promise<T>,
    label: string
) => {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
            return await prisma.$transaction(work, {
                maxWait: 30_000,
                timeout: 60_000
            });
        } catch (error) {
            if (attempt === 3 || !isRetryableTransactionError(error)) {
                throw error;
            }

            console.warn(`Transaction tạm lỗi với ${label}; thử lại ${attempt + 1}/3.`);
            await sleep(attempt * 1_000);
        }
    }

    throw new Error(`Không hoàn tất transaction cho ${label}.`);
};

const readExcludedCounts = async (): Promise<ExcludedCounts> => {
    const [
        invoices,
        invoiceItems,
        payments,
        notifications,
        reviews,
        viewingSchedules,
        maintenanceRequests
    ] = await prisma.$transaction([
        prisma.invoice.count(),
        prisma.invoiceItem.count(),
        prisma.payment.count(),
        prisma.notification.count(),
        prisma.review.count(),
        prisma.viewingSchedule.count(),
        prisma.maintenanceRequest.count()
    ]);

    return {
        invoices,
        invoiceItems,
        payments,
        notifications,
        reviews,
        viewingSchedules,
        maintenanceRequests
    };
};

const assertExcludedUnchanged = (before: ExcludedCounts, after: ExcludedCounts) => {
    for (const key of Object.keys(before) as Array<keyof ExcludedCounts>) {
        assert(before[key] === after[key], `${key} đã thay đổi ngoài phạm vi seed.`);
    }
};

const readBuildings = async () => {
    const buildings = await prisma.building.findMany({
        orderBy: { id: "asc" },
        select: {
            id: true,
            branch_name: true
        }
    });

    assert(buildings.length === BUILDING_COUNT, `Database phải có đúng ${BUILDING_COUNT} tòa nhà, hiện có ${buildings.length}.`);

    return buildings;
};

const readAvailableApartments = async (
    buildingId: number,
    tenantCitizenIds: string[]
) => {
    const existingSeedContracts = await prisma.rentalContract.findMany({
        where: {
            status: ContractStatus.ACTIVE,
            tenant: {
                citizen_id: { in: tenantCitizenIds }
            },
            apartment: {
                building_id: buildingId
            }
        },
        include: {
            tenant: {
                select: { citizen_id: true }
            },
            apartment: {
                select: {
                    id: true,
                    building_id: true,
                    floor: true,
                    room_number: true,
                    bedrooms: true,
                    rental_price: true
                }
            }
        }
    });
    const available = await prisma.apartment.findMany({
        where: {
            building_id: buildingId,
            status: ApartmentStatus.AVAILABLE
        },
        orderBy: [
            { building_id: "asc" },
            { floor: "asc" },
            { room_number: "asc" },
            { id: "asc" }
        ],
        select: {
            id: true,
            building_id: true,
            floor: true,
            room_number: true,
            bedrooms: true,
            rental_price: true
        }
    });

    return {
        existingSeedContracts,
        available
    };
};

const assertDatabaseCollisions = async (
    tenants: TenantRow[],
    occupants: OccupantRow[]
) => {
    const tenantCitizenIds = tenants.map((tenant) => tenant.citizenId);
    const tenantPhones = tenants.map((tenant) => tenant.phone);
    const tenantEmails = tenants.map((tenant) => tenant.email);
    const usernames = tenants.map((tenant) => tenantUsername(tenant.citizenId));
    const peopleCitizenIds = [...tenantCitizenIds, ...occupants.map((occupant) => occupant.citizenId)];
    const peoplePhones = [...tenantPhones, ...occupants.map((occupant) => occupant.phone)];

    const existingTenants = await prisma.tenant.findMany({
        where: {
            OR: [
                { citizen_id: { in: tenantCitizenIds } },
                { phone: { in: tenantPhones } },
                { email: { in: tenantEmails } }
            ]
        },
        include: { user: true }
    });

    for (const existing of existingTenants) {
        const expected = tenants.find((tenant) => tenant.citizenId === existing.citizen_id);

        assert(expected, `SĐT/email người thuê đã thuộc tenant khác: ${existing.id}.`);
        assert(existing.phone === expected.phone, `${expected.citizenId} có SĐT khác Excel.`);
        assert(existing.email?.toLowerCase() === expected.email, `${expected.citizenId} có email khác Excel.`);
        assert(
            existing.user === null || existing.user.username === tenantUsername(expected.citizenId),
            `${expected.citizenId} đã liên kết username khác.`
        );
    }

    const existingUsers = await prisma.user.findMany({
        where: { username: { in: usernames } },
        include: { tenant: true }
    });

    for (const user of existingUsers) {
        const expected = tenants.find((tenant) => tenantUsername(tenant.citizenId) === user.username);

        assert(expected, `Username collision: ${user.username}.`);
        assert(user.role === Role.TENANT, `${user.username} không phải TENANT.`);
        assert(user.status === UserStatus.ACTIVE, `${user.username} không ACTIVE.`);
        assert(
            user.tenant === null || user.tenant.citizen_id === expected.citizenId,
            `${user.username} đã thuộc tenant khác.`
        );
        assert(!user.username.includes("_"), `${user.username} có hậu tố không hợp lệ.`);
    }

    const existingOccupants = await prisma.occupant.findMany({
        where: {
            OR: [
                { citizen_id: { in: peopleCitizenIds } },
                { phone: { in: peoplePhones } }
            ]
        },
        include: {
            tenant: {
                select: { citizen_id: true }
            }
        }
    });

    for (const occupant of existingOccupants) {
        assert(
            tenantCitizenIds.includes(occupant.tenant.citizen_id),
            `Occupant ${occupant.citizen_id} đã thuộc tenant ngoài file Excel.`
        );
    }
};

const buildPlans = async (
    tenants: TenantRow[],
    occupants: OccupantRow[],
    today: Date
) => {
    const buildings = await readBuildings();
    const plans: TenantPlan[] = [];

    for (const [buildingIndex, building] of buildings.entries()) {
        const buildingTenants = tenants.slice(
            buildingIndex * TENANTS_PER_BUILDING,
            (buildingIndex + 1) * TENANTS_PER_BUILDING
        );
        const { existingSeedContracts, available } = await readAvailableApartments(
            building.id,
            buildingTenants.map((tenant) => tenant.citizenId)
        );
        const existingApartmentByCitizenId = new Map(
            existingSeedContracts.map((contract) => [
                contract.tenant.citizen_id,
                contract.apartment
            ])
        );
        let availableIndex = 0;

        assert(
            existingSeedContracts.length + available.length >= TENANTS_PER_BUILDING,
            `${building.branch_name}: còn ${available.length} căn AVAILABLE, thiếu ${TENANTS_PER_BUILDING - existingSeedContracts.length - available.length}.`
        );

        for (const [localIndex, tenant] of buildingTenants.entries()) {
            const globalIndex = buildingIndex * TENANTS_PER_BUILDING + localIndex;
            const existingApartment = existingApartmentByCitizenId.get(tenant.citizenId);
            const apartment = existingApartment ?? available[availableIndex++];

            assert(apartment, `${building.branch_name}: thiếu căn hộ cho ${tenant.fullName}.`);
            assert(apartment.building_id === building.id, `${tenant.fullName} đã thuê căn ở tòa khác.`);

            const startDate = buildInitialStartDate(globalIndex, today);

            plans.push({
                tenant,
                building,
                apartment,
                startDate,
                contractPeriods: buildContractPeriods(startDate, today),
                occupants: []
            });
        }
    }

    const capacity = plans.reduce(
        (sum, plan) => sum + getMaximumAdditionalOccupants(plan.apartment.bedrooms),
        0
    );
    const bedroomStats = new Map<number, { apartments: number; capacity: number }>();

    for (const plan of plans) {
        const current = bedroomStats.get(plan.apartment.bedrooms) ?? { apartments: 0, capacity: 0 };
        current.apartments += 1;
        current.capacity += getMaximumAdditionalOccupants(plan.apartment.bedrooms);
        bedroomStats.set(plan.apartment.bedrooms, current);
    }

    if (capacity < OCCUPANT_COUNT) {
        console.table([...bedroomStats.entries()].map(([bedrooms, stats]) => ({
            bedrooms,
            apartments: stats.apartments,
            capacity: stats.capacity
        })));
        throw new Error(`Tổng sức chứa người ở cùng ${capacity}/${OCCUPANT_COUNT}, thiếu ${OCCUPANT_COUNT - capacity}.`);
    }

    const rotatedPlans = plans
        .map((plan, index) => ({
            plan,
            sortKey: (index * 37) % plans.length
        }))
        .sort((left, right) => left.sortKey - right.sortKey)
        .map(({ plan }) => plan);
    let occupantIndex = 0;

    for (let level = 0; occupantIndex < occupants.length; level += 1) {
        for (const plan of rotatedPlans) {
            if (occupantIndex >= occupants.length) {
                break;
            }

            if (getMaximumAdditionalOccupants(plan.apartment.bedrooms) > level) {
                plan.occupants.push(occupants[occupantIndex++]);
            }
        }
    }

    return {
        buildings,
        plans,
        capacity,
        bedroomStats
    };
};

const readInput = () => {
    const workbook = readWorkbook();
    const tenants = readTenantRows(workbook);
    const occupants = readOccupantRows(workbook);

    assertUniqueInput(tenants, occupants);

    return {
        tenants,
        occupants
    };
};

const findOrCreateUserAndTenant = async (
    tx: Prisma.TransactionClient,
    tenant: TenantRow,
    passwordHash: string,
    counters: Counters
) => {
    const username = tenantUsername(tenant.citizenId);
    let user = await tx.user.findUnique({
        where: { username },
        include: { tenant: true }
    });
    let tenantRecord = await tx.tenant.findUnique({
        where: { citizen_id: tenant.citizenId },
        include: { user: true }
    });

    if (user) {
        assert(user.role === Role.TENANT, `${username} không phải TENANT.`);
        assert(user.status === UserStatus.ACTIVE, `${username} không ACTIVE.`);
        assert(user.tenant === null || user.tenant.citizen_id === tenant.citizenId, `${username} đã thuộc tenant khác.`);
        counters.usersReused += 1;
    } else {
        user = await tx.user.create({
            data: {
                username,
                password_hash: passwordHash,
                role: Role.TENANT,
                status: UserStatus.ACTIVE
            },
            include: { tenant: true }
        });
        counters.usersCreated += 1;
    }

    if (tenantRecord) {
        assert(tenantRecord.phone === tenant.phone, `${tenant.citizenId} có SĐT khác Excel.`);
        assert(tenantRecord.email?.toLowerCase() === tenant.email, `${tenant.citizenId} có email khác Excel.`);
        assert(tenantRecord.user_id === null || tenantRecord.user_id === user.id, `${tenant.citizenId} đã liên kết User khác.`);
        counters.tenantsReused += 1;

        if (tenantRecord.user_id === null) {
            tenantRecord = await tx.tenant.update({
                where: { id: tenantRecord.id },
                data: { user_id: user.id },
                include: { user: true }
            });
        }
    } else {
        tenantRecord = await tx.tenant.create({
            data: {
                user_id: user.id,
                onboarding_building_id: null,
                full_name: tenant.fullName,
                phone: tenant.phone,
                email: tenant.email,
                date_of_birth: tenant.dateOfBirth,
                citizen_id: tenant.citizenId,
                address: tenant.address,
                is_verified: true
            },
            include: { user: true }
        });
        counters.tenantsCreated += 1;
    }

    assert(tenantRecord.user_id === user.id, `${tenant.citizenId} không liên kết đúng User.`);

    return tenantRecord;
};

const ensureContracts = async (
    tx: Prisma.TransactionClient,
    plan: TenantPlan,
    tenantId: number,
    counters: Counters
) => {
    const otherTenantActive = await tx.rentalContract.findFirst({
        where: {
            tenant_id: tenantId,
            status: ContractStatus.ACTIVE,
            apartment_id: { not: plan.apartment.id }
        }
    });
    assert(!otherTenantActive, `${plan.tenant.citizenId} đã có hợp đồng ACTIVE ở căn khác.`);

    const otherApartmentActive = await tx.rentalContract.findFirst({
        where: {
            apartment_id: plan.apartment.id,
            status: ContractStatus.ACTIVE,
            tenant_id: { not: tenantId }
        }
    });
    assert(!otherApartmentActive, `Căn hộ ${plan.apartment.id} đã có hợp đồng ACTIVE của tenant khác.`);

    for (const period of plan.contractPeriods) {
        const existing = await tx.rentalContract.findFirst({
            where: {
                tenant_id: tenantId,
                apartment_id: plan.apartment.id,
                start_date: period.startDate,
                end_date: period.endDate
            }
        });

        if (existing) {
            assert(existing.status === period.status, `Hợp đồng ${existing.id} sai trạng thái.`);
            if (period.status === ContractStatus.ACTIVE) {
                counters.contractsReusedActive += 1;
            } else {
                counters.contractsReusedEnded += 1;
            }
            continue;
        }

        await tx.rentalContract.create({
            data: {
                apartment_id: plan.apartment.id,
                tenant_id: tenantId,
                start_date: period.startDate,
                end_date: period.endDate,
                deposit_amount: plan.apartment.rental_price,
                monthly_rent: plan.apartment.rental_price,
                status: period.status,
                signed_at: period.startDate,
                contract_file: null,
                extended_at: null
            }
        });

        if (period.status === ContractStatus.ACTIVE) {
            counters.contractsCreatedActive += 1;
        } else {
            counters.contractsCreatedEnded += 1;
        }
    }

    const apartment = await tx.apartment.findUnique({
        where: { id: plan.apartment.id },
        select: { status: true }
    });
    assert(apartment, `Không tìm thấy căn hộ ${plan.apartment.id}.`);

    if (apartment.status === ApartmentStatus.AVAILABLE) {
        await tx.apartment.update({
            where: { id: plan.apartment.id },
            data: { status: ApartmentStatus.RENTED }
        });
        counters.apartmentsRented += 1;
    } else {
        assert(apartment.status === ApartmentStatus.RENTED, `Căn hộ ${plan.apartment.id} không AVAILABLE/RENTED.`);
    }
};

const ensureOccupants = async (
    tx: Prisma.TransactionClient,
    plan: TenantPlan,
    tenantId: number,
    counters: Counters
) => {
    for (const occupant of plan.occupants) {
        const existing = await tx.occupant.findFirst({
            where: { citizen_id: occupant.citizenId },
            include: {
                tenant: {
                    select: { id: true }
                }
            }
        });

        if (existing) {
            assert(existing.tenant.id === tenantId, `Occupant ${occupant.citizenId} thuộc tenant khác.`);
            assert(existing.phone === occupant.phone, `Occupant ${occupant.citizenId} sai SĐT.`);
            counters.occupantsReused += 1;
            continue;
        }

        await tx.occupant.create({
            data: {
                tenant_id: tenantId,
                full_name: occupant.fullName,
                phone: occupant.phone,
                citizen_id: occupant.citizenId,
                date_of_birth: occupant.dateOfBirth
            }
        });
        counters.occupantsCreated += 1;
    }
};

const executePlans = async (plans: TenantPlan[]) => {
    const counters = emptyCounters();
    const credential = await createInitialCredential();

    for (const [index, plan] of plans.entries()) {
        const transactionCounters = await runTenantTransaction(async (tx) => {
            const attemptCounters = emptyCounters();
            const tenant = await findOrCreateUserAndTenant(
                tx,
                plan.tenant,
                credential.password_hash,
                attemptCounters
            );

            await ensureContracts(tx, plan, tenant.id, attemptCounters);
            await ensureOccupants(tx, plan, tenant.id, attemptCounters);

            return attemptCounters;
        }, `${index + 1}/${plans.length} ${plan.tenant.citizenId}`);

        mergeCounters(counters, transactionCounters);

        if ((index + 1) % 20 === 0) {
            console.log(`Đã xử lý ${index + 1}/${plans.length} người thuê.`);
        }
    }

    return counters;
};

const verifyAfterExecute = async (
    tenants: TenantRow[],
    occupants: OccupantRow[],
    plans: TenantPlan[],
    buildings: BuildingForSeed[],
    excludedBefore: ExcludedCounts
) => {
    const tenantCitizenIds = tenants.map((tenant) => tenant.citizenId);
    const occupantCitizenIds = occupants.map((occupant) => occupant.citizenId);
    const tenantRecords = await prisma.tenant.findMany({
        where: { citizen_id: { in: tenantCitizenIds } },
        include: {
            user: true,
            occupants: true,
            contracts: {
                orderBy: { start_date: "asc" },
                include: { apartment: true }
            }
        }
    });
    const occupantCount = await prisma.occupant.count({
        where: { citizen_id: { in: occupantCitizenIds } }
    });

    assert(tenantRecords.length === TENANT_COUNT, `Sau seed có ${tenantRecords.length}/${TENANT_COUNT} tenant.`);
    assert(occupantCount === OCCUPANT_COUNT, `Sau seed có ${occupantCount}/${OCCUPANT_COUNT} occupant.`);

    const usedApartmentIds = new Set<number>();
    const buildingStats = new Map<number, {
        apartments: Set<number>;
        tenants: number;
        occupants: number;
        endedContracts: number;
        activeContracts: number;
    }>();

    for (const building of buildings) {
        buildingStats.set(building.id, {
            apartments: new Set<number>(),
            tenants: 0,
            occupants: 0,
            endedContracts: 0,
            activeContracts: 0
        });
    }

    for (const tenant of tenantRecords) {
        assert(tenant.user, `${tenant.citizen_id} thiếu User.`);
        assert(tenant.user?.role === Role.TENANT, `${tenant.citizen_id} user không phải TENANT.`);
        assert(tenant.user?.status === UserStatus.ACTIVE, `${tenant.citizen_id} user không ACTIVE.`);
        assert(tenant.user?.username === tenantUsername(tenant.citizen_id), `${tenant.citizen_id} sai username.`);
        assert(!tenant.user?.username.includes("_"), `${tenant.user?.username} có hậu tố.`);

        const activeContracts = tenant.contracts.filter((contract) => contract.status === ContractStatus.ACTIVE);
        assert(activeContracts.length === 1, `${tenant.citizen_id} không có đúng 1 hợp đồng ACTIVE.`);

        const activeContract = activeContracts[0];
        assert(activeContract.start_date <= startOfUtcDay(new Date()), `${tenant.citizen_id} có hợp đồng tương lai.`);
        assert(activeContract.apartment.status === ApartmentStatus.RENTED, `Căn hộ ${activeContract.apartment_id} chưa RENTED.`);
        usedApartmentIds.add(activeContract.apartment_id);

        for (let index = 1; index < tenant.contracts.length; index += 1) {
            assert(
                dateKey(tenant.contracts[index - 1].end_date) === dateKey(tenant.contracts[index].start_date),
                `${tenant.citizen_id} có khoảng trống hợp đồng.`
            );
        }

        const maximumPeople = getMaximumOccupants(activeContract.apartment.bedrooms);
        assert(
            tenant.occupants.length + 1 <= maximumPeople,
            `${tenant.citizen_id} vượt sức chứa căn hộ.`
        );

        const stats = buildingStats.get(activeContract.apartment.building_id);
        assert(stats, `Thiếu thống kê tòa ${activeContract.apartment.building_id}.`);
        stats.apartments.add(activeContract.apartment_id);
        stats.tenants += 1;
        stats.occupants += tenant.occupants.length;
        stats.endedContracts += tenant.contracts.filter((contract) => contract.status === ContractStatus.ENDED).length;
        stats.activeContracts += activeContracts.length;
    }

    assert(usedApartmentIds.size === TENANT_COUNT, `Có ${usedApartmentIds.size}/${TENANT_COUNT} căn hộ được phân bổ.`);

    for (const building of buildings) {
        const stats = buildingStats.get(building.id);
        assert(stats, `Thiếu thống kê tòa ${building.id}.`);
        assert(stats.apartments.size === TENANTS_PER_BUILDING, `${building.branch_name} không có đúng 80 căn.`);
        assert(stats.tenants === TENANTS_PER_BUILDING, `${building.branch_name} không có đúng 80 tenant.`);
    }

    const activeByApartment = await prisma.rentalContract.groupBy({
        by: ["apartment_id"],
        where: { status: ContractStatus.ACTIVE },
        _count: { _all: true }
    });
    assert(
        activeByApartment.every((row) => row._count._all === 1),
        "Có căn hộ có nhiều hơn 1 hợp đồng ACTIVE."
    );

    const excludedAfter = await readExcludedCounts();
    assertExcludedUnchanged(excludedBefore, excludedAfter);

    return {
        buildingStats,
        bedroomStats: summarizeBedrooms(plans)
    };
};

const summarizeBedrooms = (plans: TenantPlan[]) => {
    const stats = new Map<number, {
        apartments: number;
        tenants: number;
        occupants: number;
        capacity: number;
    }>();

    for (const plan of plans) {
        const current = stats.get(plan.apartment.bedrooms) ?? {
            apartments: 0,
            tenants: 0,
            occupants: 0,
            capacity: 0
        };

        current.apartments += 1;
        current.tenants += 1;
        current.occupants += plan.occupants.length;
        current.capacity += getMaximumAdditionalOccupants(plan.apartment.bedrooms);
        stats.set(plan.apartment.bedrooms, current);
    }

    return stats;
};

const printDryRunReport = (
    buildings: BuildingForSeed[],
    plans: TenantPlan[],
    totalCapacity: number
) => {
    console.log("DRY-RUN: không ghi database.");
    console.table(buildings.map((building) => {
        const buildingPlans = plans.filter((plan) => plan.building.id === building.id);

        return {
            building_id: building.id,
            branch_name: building.branch_name,
            "căn hộ dùng": buildingPlans.length,
            "người thuê": buildingPlans.length,
            "người ở cùng": buildingPlans.reduce((sum, plan) => sum + plan.occupants.length, 0)
        };
    }));
    console.table([...summarizeBedrooms(plans).entries()].map(([bedrooms, stats]) => ({
        "Số phòng ngủ": bedrooms,
        "Số căn hộ": stats.apartments,
        "Người thuê chính": stats.tenants,
        "Người ở cùng": stats.occupants,
        "Tổng sức chứa": stats.capacity,
        "Sức chứa còn lại": stats.capacity - stats.occupants
    })));
    console.log(`Tổng sức chứa người ở cùng: ${totalCapacity}`);
    console.log(`Tài khoản mẫu: ${tenantUsername(plans[0].tenant.citizenId)} / ${PASSWORD}`);
};

const main = async () => {
    const mode = parseMode();
    const today = startOfUtcDay(new Date());

    if (mode === "execute") {
        assertNotProduction();
    }

    const { tenants, occupants } = readInput();
    const excludedBefore = await readExcludedCounts();

    await assertDatabaseCollisions(tenants, occupants);

    const {
        buildings,
        plans,
        capacity
    } = await buildPlans(tenants, occupants, today);

    if (mode === "dry-run") {
        printDryRunReport(buildings, plans, capacity);
        return;
    }

    const counters = await executePlans(plans);
    const verification = await verifyAfterExecute(
        tenants,
        occupants,
        plans,
        buildings,
        excludedBefore
    );

    console.table([{
        "Người thuê mới tạo": counters.tenantsCreated,
        "Người thuê đã tồn tại": counters.tenantsReused,
        "Tài khoản mới tạo": counters.usersCreated,
        "Tài khoản đã tồn tại": counters.usersReused,
        "Căn hộ chuyển RENTED": counters.apartmentsRented,
        "Occupant mới tạo": counters.occupantsCreated,
        "Occupant đã tồn tại": counters.occupantsReused,
        "Hợp đồng ENDED": counters.contractsCreatedEnded + counters.contractsReusedEnded,
        "Hợp đồng ACTIVE": counters.contractsCreatedActive + counters.contractsReusedActive,
        "Tổng hợp đồng": counters.contractsCreatedEnded
            + counters.contractsReusedEnded
            + counters.contractsCreatedActive
            + counters.contractsReusedActive
    }]);
    console.table(buildings.map((building) => {
        const stats = verification.buildingStats.get(building.id);

        return {
            building_id: building.id,
            branch_name: building.branch_name,
            "số căn hộ được sử dụng": stats?.apartments.size ?? 0,
            "số người thuê": stats?.tenants ?? 0,
            "số người ở cùng": stats?.occupants ?? 0,
            "số hợp đồng ENDED": stats?.endedContracts ?? 0,
            "số hợp đồng ACTIVE": stats?.activeContracts ?? 0
        };
    }));
    console.table([...verification.bedroomStats.entries()].map(([bedrooms, stats]) => ({
        "Số phòng ngủ": bedrooms,
        "Số căn hộ": stats.apartments,
        "Số người thuê chính": stats.tenants,
        "Số người ở cùng": stats.occupants,
        "Tổng sức chứa": stats.capacity,
        "Sức chứa còn lại": stats.capacity - stats.occupants
    })));
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main()
        .catch((error: unknown) => {
            console.error(error instanceof Error ? error.message : error);
            process.exitCode = 1;
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
