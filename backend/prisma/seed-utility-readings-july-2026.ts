import {
    ApartmentStatus,
    ContractStatus,
    Prisma,
    PrismaClient,
    Role
} from "@prisma/client";

const prisma = new PrismaClient();

const TARGET_MONTH = 7;
const TARGET_YEAR = 2026;
const BATCH_SIZE = 500;
const RECORDED_AT = new Date(Date.UTC(2026, 6, 1, 1, 0, 0)); // 2026-07-01 08:00 ICT

type ConsumptionBand = {
    minElectric: number;
    maxElectric: number;
    minWater: number;
    maxWater: number;
};

type ApartmentForSeed = {
    id: number;
    building_id: number;
    floor: number;
    room_number: string;
    building: {
        id: number;
        branch_name: string;
    };
};

const activeContractSelect = {
    id: true,
    apartment_id: true,
    tenant_id: true,
    apartment: {
        select: {
            id: true,
            building_id: true,
            floor: true,
            room_number: true,
            building: {
                select: {
                    id: true,
                    branch_name: true
                }
            }
        }
    },
    tenant: {
        select: {
            id: true,
            full_name: true,
            occupants: {
                select: {
                    id: true
                }
            }
        }
    }
} satisfies Prisma.RentalContractSelect;

type ActiveContractForSeed = Prisma.RentalContractGetPayload<{
    select: typeof activeContractSelect;
}>;

const apartmentSelect = {
    id: true,
    building_id: true,
    floor: true,
    room_number: true,
    building: {
        select: {
            id: true,
            branch_name: true
        }
    }
} satisfies Prisma.ApartmentSelect;

const staffSelect = {
    id: true,
    building_id: true,
    full_name: true,
    position: true,
    user: {
        select: {
            role: true
        }
    }
} satisfies Prisma.StaffSelect;

type StaffForSeed = Prisma.StaffGetPayload<{
    select: typeof staffSelect;
}>;

type TargetApartment = {
    apartment: ApartmentForSeed;
    contract?: ActiveContractForSeed;
    householdSize: number;
    householdNote?: string;
};

type ExistingReading = {
    id: number;
    apartment_id: number;
    month: number;
    year: number;
    electric_old: Prisma.Decimal;
    electric_new: Prisma.Decimal;
    water_old: Prisma.Decimal;
    water_new: Prisma.Decimal;
    recorded_by: number;
    created_at: Date;
};

type PlannedReading = {
    apartment: ApartmentForSeed;
    staff: StaffForSeed;
    householdSize: number;
    previous: ExistingReading;
    electricConsumption: number;
    waterConsumption: number;
    data: Prisma.UtilityReadingCreateManyInput;
};

type ReadingConflict = {
    apartment_id: number;
    room: string;
    building: string;
    existing: {
        electric_old: number;
        electric_new: number;
        water_old: number;
        water_new: number;
        recorded_by: number;
        created_at: string;
    };
    expected: {
        electric_old: number;
        electric_new: number;
        water_old: number;
        water_new: number;
        recorded_by: number;
        created_at: string;
    };
};

type ReadingPlan = {
    targetApartments: TargetApartment[];
    selectedStaffByBuilding: Map<number, StaffForSeed>;
    previousByApartmentId: Map<number, ExistingReading>;
    plannedReadings: PlannedReading[];
    toCreate: PlannedReading[];
    skipped: PlannedReading[];
    conflicts: ReadingConflict[];
};

const consumptionBands: Record<number, ConsumptionBand> = {
    1: { minElectric: 180, maxElectric: 240, minWater: 4, maxWater: 6 },
    2: { minElectric: 220, maxElectric: 280, minWater: 8, maxWater: 10 },
    3: { minElectric: 350, maxElectric: 450, minWater: 12, maxWater: 15 },
    4: { minElectric: 400, maxElectric: 500, minWater: 16, maxWater: 20 },
    5: { minElectric: 450, maxElectric: 550, minWater: 20, maxWater: 25 },
    6: { minElectric: 600, maxElectric: 700, minWater: 24, maxWater: 30 },
    7: { minElectric: 650, maxElectric: 750, minWater: 28, maxWater: 35 },
    8: { minElectric: 700, maxElectric: 850, minWater: 32, maxWater: 40 }
};

const round1 = (value: number) => Math.round(value);

const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

const toNumber = (value: Prisma.Decimal | number | string) => Number(value);

const formatMoneyless = (value: number) =>
    new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value);

const apartmentKey = (apartment: ApartmentForSeed) =>
    `${apartment.building_id}-${apartment.floor}-${apartment.room_number}-${apartment.id}`;

const readingKey = (apartmentId: number, month: number, year: number) =>
    `${apartmentId}:${month}:${year}`;

function deterministicHash(input: string): number {
    let hash = 2166136261;

    for (let index = 0; index < input.length; index += 1) {
        hash ^= input.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
}

const deterministicUnit = (key: string, salt: string) =>
    deterministicHash(`${key}:${salt}`) / 0xffffffff;

function deterministicPercentile(key: string): number {
    return 0.25 + deterministicUnit(key, "percentile") * 0.60;
}

function getConsumptionBand(householdSize: number): ConsumptionBand {
    return consumptionBands[clamp(Math.trunc(householdSize), 1, 8)];
}

function buildJulyConsumption(
    key: string,
    householdSize: number
) {
    const band = getConsumptionBand(householdSize);
    const percentile = deterministicPercentile(key);
    const baseElectric = band.minElectric
        + (band.maxElectric - band.minElectric) * percentile;
    const baseWater = band.minWater
        + (band.maxWater - band.minWater) * percentile;
    const electricJitter = (
        deterministicUnit(key, "electric-jitter-2026-7") - 0.5
    ) * 0.06;
    const waterJitter = (
        deterministicUnit(key, "water-jitter-2026-7") - 0.5
    ) * 0.06;

    return {
        electricConsumption: Math.round(clamp(
            baseElectric * 1.16 * (1 + electricJitter),
            band.minElectric,
            band.maxElectric
        )),
        waterConsumption: round1(clamp(
            baseWater * 1.08 * (1 + waterJitter),
            band.minWater,
            band.maxWater
        ))
    };
}

function getHouseholdSizeForApartment(
    target: Pick<TargetApartment, "contract">
) {
    if (!target.contract) {
        return {
            householdSize: 1,
            note: "Không có hợp đồng ACTIVE, mặc định 1 người"
        };
    }

    const rawSize = 1 + target.contract.tenant.occupants.length;

    return {
        householdSize: clamp(rawSize, 1, 8),
        note: rawSize > 8
            ? `Dữ liệu có ${rawSize} người, đã clamp về 8`
            : undefined
    };
}

function chunkArray<T>(items: T[], size: number): T[][] {
    const chunks: T[][] = [];

    for (let index = 0; index < items.length; index += size) {
        chunks.push(items.slice(index, index + size));
    }

    return chunks;
}

const sortTargets = (left: TargetApartment, right: TargetApartment) =>
    left.apartment.building_id - right.apartment.building_id
    || left.apartment.floor - right.apartment.floor
    || left.apartment.room_number.localeCompare(right.apartment.room_number)
    || left.apartment.id - right.apartment.id;

async function getTargetApartments(): Promise<TargetApartment[]> {
    const activeContracts = await prisma.rentalContract.findMany({
        where: {
            status: ContractStatus.ACTIVE
        },
        select: activeContractSelect,
        orderBy: [
            { apartment_id: "asc" },
            { id: "asc" }
        ]
    });

    if (activeContracts.length > 0) {
        const byApartmentId = new Map<number, ActiveContractForSeed>();

        for (const contract of activeContracts) {
            if (!byApartmentId.has(contract.apartment_id)) {
                byApartmentId.set(contract.apartment_id, contract);
            }
        }

        return [...byApartmentId.values()]
            .map((contract) => {
                const size = getHouseholdSizeForApartment({ contract });

                return {
                    apartment: contract.apartment,
                    contract,
                    householdSize: size.householdSize,
                    householdNote: size.note
                };
            })
            .sort(sortTargets);
    }

    const rentedApartments = await prisma.apartment.findMany({
        where: {
            status: ApartmentStatus.RENTED
        },
        select: apartmentSelect,
        orderBy: [
            { building_id: "asc" },
            { floor: "asc" },
            { room_number: "asc" },
            { id: "asc" }
        ]
    });

    return rentedApartments.map((apartment) => ({
        apartment,
        householdSize: 1,
        householdNote: "Fallback từ apartment.status = RENTED, mặc định 1 người"
    }));
}

const isManagerStaff = (staff: StaffForSeed) => {
    const position = staff.position.toLowerCase();

    return staff.user?.role === Role.MANAGER
        || position.includes("quản")
        || position.includes("manager");
};

async function getSelectedStaffByBuilding(
    buildingIds: number[]
): Promise<Map<number, StaffForSeed>> {
    const staffRows = await prisma.staff.findMany({
        where: {
            building_id: {
                in: buildingIds
            }
        },
        select: staffSelect,
        orderBy: [
            { building_id: "asc" },
            { id: "asc" }
        ]
    });
    const selected = new Map<number, StaffForSeed>();

    for (const staff of staffRows) {
        if (
            staff.building_id !== null
            && isManagerStaff(staff)
            && !selected.has(staff.building_id)
        ) {
            selected.set(staff.building_id, staff);
        }
    }

    return selected;
}

const sameDate = (left: Date, right: Date) =>
    left.getTime() === right.getTime();

const sameNumber = (
    left: Prisma.Decimal | number | string,
    right: Prisma.Decimal | number | string
) => new Prisma.Decimal(left).equals(new Prisma.Decimal(right));

function sameReadingValues(
    existing: ExistingReading,
    expected: Prisma.UtilityReadingCreateManyInput
) {
    return sameNumber(existing.electric_old, expected.electric_old)
        && sameNumber(existing.electric_new, expected.electric_new)
        && sameNumber(existing.water_old, expected.water_old)
        && sameNumber(existing.water_new, expected.water_new)
        && existing.recorded_by === expected.recorded_by
        && sameDate(existing.created_at, expected.created_at as Date);
}

async function buildUtilityReadingPlan(): Promise<ReadingPlan> {
    const targetApartments = await getTargetApartments();

    if (targetApartments.length === 0) {
        throw new Error(
            "Không tìm thấy căn hộ đang được thuê: không có hợp đồng ACTIVE và không có căn hộ RENTED."
        );
    }

    const buildingIds = [
        ...new Set(targetApartments.map((target) => target.apartment.building_id))
    ];
    const selectedStaffByBuilding = await getSelectedStaffByBuilding(buildingIds);
    const missingStaffBuildingIds = buildingIds.filter(
        (buildingId) => !selectedStaffByBuilding.has(buildingId)
    );

    if (missingStaffBuildingIds.length > 0) {
        throw new Error(
            `Thiếu quản lý tòa nhà để recorded_by cho building_id: ${missingStaffBuildingIds.join(", ")}`
        );
    }

    const apartmentIds = targetApartments.map((target) => target.apartment.id);
    const previousRows = await prisma.utilityReading.findMany({
        where: {
            apartment_id: {
                in: apartmentIds
            },
            month: 6,
            year: TARGET_YEAR
        },
        select: {
            id: true,
            apartment_id: true,
            month: true,
            year: true,
            electric_old: true,
            electric_new: true,
            water_old: true,
            water_new: true,
            recorded_by: true,
            created_at: true
        }
    });
    const previousByApartmentId = new Map<number, ExistingReading>(
        previousRows.map((reading) => [reading.apartment_id, reading])
    );
    const missingPrevious = targetApartments.filter(
        (target) => !previousByApartmentId.has(target.apartment.id)
    );

    if (missingPrevious.length > 0) {
        throw new Error(
            [
                `Thiếu chỉ số tháng 6/2026 cho ${missingPrevious.length} căn hộ, không thể seed tháng 7 an toàn.`,
                "Ví dụ: "
                    + missingPrevious.slice(0, 10)
                        .map((target) => `${target.apartment.building.branch_name} P.${target.apartment.room_number} (#${target.apartment.id})`)
                        .join(", ")
            ].join("\n")
        );
    }

    const existingRows = await prisma.utilityReading.findMany({
        where: {
            apartment_id: {
                in: apartmentIds
            },
            month: TARGET_MONTH,
            year: TARGET_YEAR
        },
        select: {
            id: true,
            apartment_id: true,
            month: true,
            year: true,
            electric_old: true,
            electric_new: true,
            water_old: true,
            water_new: true,
            recorded_by: true,
            created_at: true
        }
    });
    const existingByKey = new Map<string, ExistingReading>(
        existingRows.map((reading) => [
            readingKey(reading.apartment_id, reading.month, reading.year),
            reading
        ])
    );
    const plannedReadings: PlannedReading[] = [];

    for (const target of targetApartments) {
        const apartment = target.apartment;
        const previous = previousByApartmentId.get(apartment.id);
        const staff = selectedStaffByBuilding.get(apartment.building_id);

        if (!previous || !staff) {
            continue;
        }

        const monthly = buildJulyConsumption(
            apartmentKey(apartment),
            target.householdSize
        );
        const electricOld = toNumber(previous.electric_new);
        const waterOld = round1(toNumber(previous.water_new));
        const electricNew = electricOld + monthly.electricConsumption;
        const waterNew = round1(waterOld + monthly.waterConsumption);

        plannedReadings.push({
            apartment,
            staff,
            householdSize: target.householdSize,
            previous,
            electricConsumption: monthly.electricConsumption,
            waterConsumption: monthly.waterConsumption,
            data: {
                apartment_id: apartment.id,
                month: TARGET_MONTH,
                year: TARGET_YEAR,
                electric_old: electricOld,
                electric_new: electricNew,
                water_old: waterOld,
                water_new: waterNew,
                created_at: RECORDED_AT,
                recorded_by: staff.id
            }
        });
    }

    const toCreate: PlannedReading[] = [];
    const skipped: PlannedReading[] = [];
    const conflicts: ReadingConflict[] = [];

    for (const planned of plannedReadings) {
        const existing = existingByKey.get(readingKey(
            planned.data.apartment_id,
            planned.data.month,
            planned.data.year
        ));

        if (!existing) {
            toCreate.push(planned);
            continue;
        }

        if (sameReadingValues(existing, planned.data)) {
            skipped.push(planned);
            continue;
        }

        conflicts.push({
            apartment_id: planned.apartment.id,
            room: `P.${planned.apartment.room_number}`,
            building: planned.apartment.building.branch_name,
            existing: {
                electric_old: toNumber(existing.electric_old),
                electric_new: toNumber(existing.electric_new),
                water_old: toNumber(existing.water_old),
                water_new: toNumber(existing.water_new),
                recorded_by: existing.recorded_by,
                created_at: existing.created_at.toISOString()
            },
            expected: {
                electric_old: Number(planned.data.electric_old),
                electric_new: Number(planned.data.electric_new),
                water_old: Number(planned.data.water_old),
                water_new: Number(planned.data.water_new),
                recorded_by: Number(planned.data.recorded_by),
                created_at: (planned.data.created_at as Date).toISOString()
            }
        });
    }

    return {
        targetApartments,
        selectedStaffByBuilding,
        previousByApartmentId,
        plannedReadings,
        toCreate,
        skipped,
        conflicts
    };
}

function countBy<T>(
    items: T[],
    keyGetter: (item: T) => string
) {
    const counts = new Map<string, number>();

    for (const item of items) {
        const key = keyGetter(item);
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return [...counts.entries()].sort(([left], [right]) =>
        left.localeCompare(right, "vi")
    );
}

function average(values: number[]) {
    if (values.length === 0) {
        return 0;
    }

    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function printPlanSummary(plan: ReadingPlan) {
    console.log("Seed utility readings tháng 07/2026");
    console.log(`Ngày ghi: ${RECORDED_AT.toISOString()} (2026-07-01 08:00 ICT)`);
    console.log(`Số căn hộ mục tiêu: ${plan.targetApartments.length}`);
    console.log(`Số reading dự kiến: ${plan.plannedReadings.length}`);
    console.log(`Tạo mới: ${plan.toCreate.length}`);
    console.log(`Đã tồn tại và khớp: ${plan.skipped.length}`);
    console.log(`Conflict: ${plan.conflicts.length}`);

    console.log("\nTheo tòa nhà:");
    for (const [building, count] of countBy(
        plan.targetApartments,
        (target) => target.apartment.building.branch_name
    )) {
        console.log(`- ${building}: ${count}`);
    }

    console.log("\nQuản lý ghi chỉ số:");
    for (const staff of [...plan.selectedStaffByBuilding.values()]) {
        console.log(
            `- building_id ${staff.building_id}: staff #${staff.id} ${staff.full_name} (${staff.position})`
        );
    }

    console.log("\nTheo số người trong căn:");
    for (let size = 1; size <= 8; size += 1) {
        const rows = plan.plannedReadings.filter(
            (reading) => reading.householdSize === size
        );

        if (rows.length === 0) {
            continue;
        }

        console.log(
            [
                `- ${size} người: ${rows.length} căn`,
                `điện min/max/avg ${Math.min(...rows.map((row) => row.electricConsumption))}`
                    + `/${Math.max(...rows.map((row) => row.electricConsumption))}`
                    + `/${formatMoneyless(average(rows.map((row) => row.electricConsumption)))} kWh`,
                `nước min/max/avg ${formatMoneyless(Math.min(...rows.map((row) => row.waterConsumption)))}`
                    + `/${formatMoneyless(Math.max(...rows.map((row) => row.waterConsumption)))}`
                    + `/${formatMoneyless(average(rows.map((row) => row.waterConsumption)))} m3`
            ].join(" | ")
        );
    }

    const notes = plan.targetApartments.filter((target) => target.householdNote);
    if (notes.length > 0) {
        console.log(`\nGhi chú householdSize: ${notes.length} căn có fallback/clamp`);
    }

    console.log("\nSample 10 căn đầu:");
    for (const reading of plan.plannedReadings.slice(0, 10)) {
        console.log(
            [
                `- apt #${reading.apartment.id}`,
                reading.apartment.building.branch_name,
                `tầng ${reading.apartment.floor}`,
                `P.${reading.apartment.room_number}`,
                `${reading.householdSize} người`,
                `điện ${reading.data.electric_old} -> ${reading.data.electric_new}`,
                `nước ${reading.data.water_old} -> ${reading.data.water_new}`,
                `staff #${reading.staff.id}`
            ].join(" | ")
        );
    }

    if (plan.conflicts.length > 0) {
        console.log("\nConflict mẫu:");
        console.table(plan.conflicts.slice(0, 10));
    }
}

async function validateAfterExecute(plan: ReadingPlan) {
    const apartmentIds = plan.targetApartments.map((target) => target.apartment.id);
    const rows = await prisma.utilityReading.findMany({
        where: {
            apartment_id: {
                in: apartmentIds
            },
            month: TARGET_MONTH,
            year: TARGET_YEAR
        },
        select: {
            apartment_id: true,
            electric_old: true,
            electric_new: true,
            water_old: true,
            water_new: true
        }
    });
    const rowByApartment = new Map(rows.map((row) => [row.apartment_id, row]));
    const missing = apartmentIds.filter((id) => !rowByApartment.has(id));
    const invalid = rows.filter((row) =>
        toNumber(row.electric_new) < toNumber(row.electric_old)
        || toNumber(row.water_new) < toNumber(row.water_old)
    );
    const discontinuous = plan.targetApartments.filter((target) => {
        const previous = plan.previousByApartmentId.get(target.apartment.id);
        const current = rowByApartment.get(target.apartment.id);

        return !previous
            || !current
            || !sameNumber(previous.electric_new, current.electric_old)
            || !sameNumber(previous.water_new, current.water_old);
    });

    console.log("\nValidation sau execute:");
    console.log(`- rows tháng 07/2026: ${rows.length}/${plan.targetApartments.length}`);
    console.log(`- thiếu row: ${missing.length}`);
    console.log(`- chỉ số âm/giảm: ${invalid.length}`);
    console.log(`- không liên tục với tháng 6: ${discontinuous.length}`);

    if (missing.length || invalid.length || discontinuous.length) {
        throw new Error("Validation sau execute thất bại.");
    }
}

async function runDryRun() {
    const plan = await buildUtilityReadingPlan();
    printPlanSummary(plan);

    if (plan.conflicts.length > 0) {
        process.exitCode = 1;
    }
}

async function runExecute() {
    const plan = await buildUtilityReadingPlan();
    printPlanSummary(plan);

    if (plan.conflicts.length > 0) {
        throw new Error("Có conflict tháng 07/2026, dừng để tránh ghi đè dữ liệu.");
    }

    for (const batch of chunkArray(plan.toCreate, BATCH_SIZE)) {
        await prisma.utilityReading.createMany({
            data: batch.map((reading) => reading.data)
        });
    }

    console.log(`\nĐã tạo ${plan.toCreate.length} utility_readings tháng 07/2026.`);
    await validateAfterExecute(plan);
}

async function main() {
    const execute = process.argv.includes("--execute");

    if (execute) {
        await runExecute();
        return;
    }

    await runDryRun();
}

main()
    .catch((error) => {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
