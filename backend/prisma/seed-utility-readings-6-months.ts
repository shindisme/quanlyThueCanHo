import {
    ApartmentStatus,
    ContractStatus,
    Prisma,
    PrismaClient
} from "@prisma/client";

const prisma = new PrismaClient();

const TARGET_YEAR = 2026;
const TARGET_MONTH_NUMBERS = [1, 2, 3, 4, 5, 6] as const;
const HISTORICAL_MONTHS = 48;
const BATCH_SIZE = 500;

type TargetMonth = {
    month: number;
    year: number;
    label: string;
    createdAt: Date;
};

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
    position: true
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

type PlannedReading = {
    apartment: ApartmentForSeed;
    householdSize: number;
    month: TargetMonth;
    electricConsumption: number;
    waterConsumption: number;
    data: Prisma.UtilityReadingCreateManyInput;
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
};

type ReadingConflict = {
    apartment_id: number;
    month: number;
    year: number;
    existing: {
        electric_old: number;
        electric_new: number;
        water_old: number;
        water_new: number;
    };
    expected: {
        electric_old: number;
        electric_new: number;
        water_old: number;
        water_new: number;
    };
};

type ReadingPlan = {
    targetApartments: TargetApartment[];
    months: TargetMonth[];
    selectedStaffByBuilding: Map<number, StaffForSeed>;
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

const electricSeasonFactor: Record<number, number> = {
    1: 0.93,
    2: 0.90,
    3: 0.97,
    4: 1.04,
    5: 1.10,
    6: 1.15
};

const waterSeasonFactor: Record<number, number> = {
    1: 0.96,
    2: 0.95,
    3: 1.00,
    4: 1.03,
    5: 1.05,
    6: 1.07
};

const pad2 = (value: number) => value.toString().padStart(2, "0");

const round1 = (value: number) => Math.round(value);

const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

const toNumber = (value: Prisma.Decimal | number) => Number(value);

const readingKey = (apartmentId: number, month: number, year: number) =>
    `${apartmentId}:${month}:${year}`;

const apartmentKey = (apartment: ApartmentForSeed) =>
    `${apartment.building_id}-${apartment.floor}-${apartment.room_number}-${apartment.id}`;

const createdAtIct = (year: number, month: number) => {
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;

    return new Date(Date.UTC(nextYear, nextMonth - 1, 1, 1, 0, 0));
};

function getTargetMonths(): TargetMonth[] {
    return TARGET_MONTH_NUMBERS.map((month) => ({
        month,
        year: TARGET_YEAR,
        label: `${pad2(month)}/${TARGET_YEAR}`,
        createdAt: createdAtIct(TARGET_YEAR, month)
    }));
}

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
    const householdSize = clamp(rawSize, 1, 8);

    return {
        householdSize,
        note: rawSize > 8
            ? `Dữ liệu có ${rawSize} người, đã clamp về 8`
            : undefined
    };
}

function buildHistoricalBaseMeters(
    key: string,
    baseElectric: number,
    baseWater: number
) {
    const historicalFactor = 0.88
        + deterministicUnit(key, "historical-factor") * 0.24;
    const baseElectricOffset = 300
        + deterministicUnit(key, "electric-offset") * 1200;
    const baseWaterOffset = 10
        + deterministicUnit(key, "water-offset") * 70;

    return {
        electricOldJan2026: Math.round(
            baseElectric * HISTORICAL_MONTHS * historicalFactor
            + baseElectricOffset
        ),
        waterOldJan2026: round1(
            baseWater * HISTORICAL_MONTHS * historicalFactor
            + baseWaterOffset
        )
    };
}

function buildMonthlyConsumptions(
    key: string,
    householdSize: number,
    months: TargetMonth[]
) {
    const band = getConsumptionBand(householdSize);
    const percentile = deterministicPercentile(key);
    const baseElectric = band.minElectric
        + (band.maxElectric - band.minElectric) * percentile;
    const baseWater = band.minWater
        + (band.maxWater - band.minWater) * percentile;

    const monthly = months.map((month) => {
        const electricJitter = (
            deterministicUnit(key, `electric-jitter-${month.year}-${month.month}`)
            - 0.5
        ) * 0.06;
        const waterJitter = (
            deterministicUnit(key, `water-jitter-${month.year}-${month.month}`)
            - 0.5
        ) * 0.06;
        const electricValue = baseElectric
            * electricSeasonFactor[month.month]
            * (1 + electricJitter);
        const waterValue = baseWater
            * waterSeasonFactor[month.month]
            * (1 + waterJitter);

        return {
            month,
            electricConsumption: Math.round(clamp(
                electricValue,
                band.minElectric,
                band.maxElectric
            )),
            waterConsumption: round1(clamp(
                waterValue,
                band.minWater,
                band.maxWater
            ))
        };
    });

    return {
        baseElectric,
        baseWater,
        monthly
    };
}

function chunkArray<T>(items: T[], size: number): T[][] {
    const chunks: T[][] = [];

    for (let index = 0; index < items.length; index += size) {
        chunks.push(items.slice(index, index + size));
    }

    return chunks;
}

const getTargetApartments = async (): Promise<TargetApartment[]> => {
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
};

const sortTargets = (left: TargetApartment, right: TargetApartment) =>
    left.apartment.building_id - right.apartment.building_id
    || left.apartment.floor - right.apartment.floor
    || left.apartment.room_number.localeCompare(right.apartment.room_number)
    || left.apartment.id - right.apartment.id;

const getSelectedStaffByBuilding = async (
    buildingIds: number[]
): Promise<Map<number, StaffForSeed>> => {
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
        if (staff.building_id !== null && !selected.has(staff.building_id)) {
            selected.set(staff.building_id, staff);
        }
    }

    return selected;
};

async function buildUtilityReadingPlan(): Promise<ReadingPlan> {
    const months = getTargetMonths();
    const targetApartments = await getTargetApartments();

    if (targetApartments.length === 0) {
        throw new Error(
            "Không tìm thấy căn hộ mục tiêu: không có hợp đồng ACTIVE và không có căn hộ RENTED."
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
            `Thiếu staff recorded_by cho building_id: ${missingStaffBuildingIds.join(", ")}`
        );
    }

    const apartmentIds = targetApartments.map((target) => target.apartment.id);
    const existingRows = await prisma.utilityReading.findMany({
        where: {
            apartment_id: {
                in: apartmentIds
            },
            OR: months.map((month) => ({
                month: month.month,
                year: month.year
            }))
        },
        select: {
            id: true,
            apartment_id: true,
            month: true,
            year: true,
            electric_old: true,
            electric_new: true,
            water_old: true,
            water_new: true
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
        const key = apartmentKey(apartment);
        const { baseElectric, baseWater, monthly } = buildMonthlyConsumptions(
            key,
            target.householdSize,
            months
        );
        const historicalBase = buildHistoricalBaseMeters(
            key,
            baseElectric,
            baseWater
        );
        const staff = selectedStaffByBuilding.get(apartment.building_id);

        if (!staff) {
            throw new Error(
                `Thiếu staff recorded_by cho căn hộ ${apartment.id}`
            );
        }

        let electricOld = historicalBase.electricOldJan2026;
        let waterOld = historicalBase.waterOldJan2026;

        for (const monthlyConsumption of monthly) {
            const electricNew = electricOld
                + monthlyConsumption.electricConsumption;
            const waterNew = round1(
                waterOld + monthlyConsumption.waterConsumption
            );

            plannedReadings.push({
                apartment,
                householdSize: target.householdSize,
                month: monthlyConsumption.month,
                electricConsumption: monthlyConsumption.electricConsumption,
                waterConsumption: monthlyConsumption.waterConsumption,
                data: {
                    apartment_id: apartment.id,
                    month: monthlyConsumption.month.month,
                    year: monthlyConsumption.month.year,
                    electric_old: electricOld,
                    electric_new: electricNew,
                    water_old: waterOld,
                    water_new: waterNew,
                    created_at: monthlyConsumption.month.createdAt,
                    recorded_by: staff.id
                }
            });

            electricOld = electricNew;
            waterOld = waterNew;
        }
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
            apartment_id: planned.data.apartment_id,
            month: planned.data.month,
            year: planned.data.year,
            existing: {
                electric_old: toNumber(existing.electric_old),
                electric_new: toNumber(existing.electric_new),
                water_old: toNumber(existing.water_old),
                water_new: toNumber(existing.water_new)
            },
            expected: {
                electric_old: Number(planned.data.electric_old),
                electric_new: Number(planned.data.electric_new),
                water_old: Number(planned.data.water_old),
                water_new: Number(planned.data.water_new)
            }
        });
    }

    return {
        targetApartments,
        months,
        selectedStaffByBuilding,
        plannedReadings,
        toCreate,
        skipped,
        conflicts
    };
}

function sameReadingValues(
    existing: ExistingReading,
    planned: Prisma.UtilityReadingCreateManyInput
) {
    return sameNumber(toNumber(existing.electric_old), Number(planned.electric_old))
        && sameNumber(toNumber(existing.electric_new), Number(planned.electric_new))
        && sameNumber(toNumber(existing.water_old), Number(planned.water_old))
        && sameNumber(toNumber(existing.water_new), Number(planned.water_new));
}

const sameNumber = (left: number, right: number) =>
    Math.abs(left - right) < 0.01;

const formatNumber = (value: number) => new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 2
}).format(value);

const printConflictSummary = (conflicts: ReadingConflict[]) => {
    if (conflicts.length === 0) {
        console.log("Conflict: 0");
        return;
    }

    console.log(`Conflict: ${conflicts.length}`);
    for (const conflict of conflicts.slice(0, 20)) {
        console.log(
            `- apartment_id=${conflict.apartment_id} ${pad2(conflict.month)}/${conflict.year}: `
            + `existing điện ${conflict.existing.electric_old}->${conflict.existing.electric_new}, `
            + `nước ${conflict.existing.water_old}->${conflict.existing.water_new}; `
            + `expected điện ${conflict.expected.electric_old}->${conflict.expected.electric_new}, `
            + `nước ${conflict.expected.water_old}->${conflict.expected.water_new}`
        );
    }

    if (conflicts.length > 20) {
        console.log(`... còn ${conflicts.length - 20} conflict`);
    }
};

const printPlanReport = (plan: ReadingPlan) => {
    console.log("Seed utility readings 01/2026 -> 06/2026");
    console.log(`Chế độ: dry-run`);
    console.log(`Số căn hộ mục tiêu: ${plan.targetApartments.length}`);
    console.log("Tháng mục tiêu:", plan.months.map((month) => month.label).join(", "));

    printApartmentCountByBuilding(plan.targetApartments);
    printHouseholdSizeDistribution(plan.targetApartments);
    printSelectedStaff(plan.targetApartments, plan.selectedStaffByBuilding);
    printConsumptionStats(plan.plannedReadings);

    console.log(`Tổng utility readings dự kiến: ${plan.plannedReadings.length}`);
    console.log(`Reading mới: ${plan.toCreate.length}`);
    console.log(`Reading đã tồn tại và skip: ${plan.skipped.length}`);
    printConflictSummary(plan.conflicts);
    printHouseholdNotes(plan.targetApartments);
    printSamples(plan);
};

function printApartmentCountByBuilding(targetApartments: TargetApartment[]) {
    const byBuilding = new Map<number, { name: string; count: number }>();

    for (const target of targetApartments) {
        const building = target.apartment.building;
        const current = byBuilding.get(building.id) ?? {
            name: building.branch_name,
            count: 0
        };
        current.count += 1;
        byBuilding.set(building.id, current);
    }

    console.log("Số căn theo building:");
    for (const [buildingId, value] of [...byBuilding.entries()].sort(
        ([left], [right]) => left - right
    )) {
        console.log(`- building_id=${buildingId} ${value.name}: ${value.count}`);
    }
}

function printHouseholdSizeDistribution(targetApartments: TargetApartment[]) {
    const bySize = new Map<number, number>();

    for (let size = 1; size <= 8; size += 1) {
        bySize.set(size, 0);
    }

    for (const target of targetApartments) {
        bySize.set(
            target.householdSize,
            (bySize.get(target.householdSize) ?? 0) + 1
        );
    }

    console.log("Số căn theo householdSize:");
    for (const [size, count] of bySize.entries()) {
        console.log(`- ${size} người: ${count}`);
    }
}

function printSelectedStaff(
    targetApartments: TargetApartment[],
    selectedStaffByBuilding: Map<number, StaffForSeed>
) {
    const buildingById = new Map<number, string>();

    for (const target of targetApartments) {
        buildingById.set(
            target.apartment.building_id,
            target.apartment.building.branch_name
        );
    }

    console.log("Staff recorded_by theo building:");
    for (const [buildingId, buildingName] of [...buildingById.entries()].sort(
        ([left], [right]) => left - right
    )) {
        const staff = selectedStaffByBuilding.get(buildingId);
        console.log(
            `- building_id=${buildingId} ${buildingName}: `
            + `staff_id=${staff?.id ?? "N/A"} ${staff?.full_name ?? "N/A"}`
        );
    }
}

function printConsumptionStats(plannedReadings: PlannedReading[]) {
    console.log("Thống kê tiêu thụ dự kiến theo householdSize:");

    for (let size = 1; size <= 8; size += 1) {
        const rows = plannedReadings.filter((reading) =>
            reading.householdSize === size
        );

        if (rows.length === 0) {
            console.log(`- ${size} người: 0 rows`);
            continue;
        }

        const electricValues = rows.map((reading) =>
            reading.electricConsumption
        );
        const waterValues = rows.map((reading) =>
            reading.waterConsumption
        );

        console.log(
            `- ${size} người: điện min/max/avg `
            + `${formatNumber(Math.min(...electricValues))}/`
            + `${formatNumber(Math.max(...electricValues))}/`
            + `${formatNumber(avg(electricValues))} kWh; `
            + `nước min/max/avg `
            + `${formatNumber(Math.min(...waterValues))}/`
            + `${formatNumber(Math.max(...waterValues))}/`
            + `${formatNumber(avg(waterValues))} m3`
        );
    }
}

const avg = (values: number[]) =>
    values.reduce((sum, value) => sum + value, 0) / values.length;

function printHouseholdNotes(targetApartments: TargetApartment[]) {
    const notes = targetApartments.filter((target) => target.householdNote);

    if (notes.length === 0) {
        return;
    }

    console.log(`Ghi chú householdSize: ${notes.length} căn có ghi chú`);
    for (const target of notes.slice(0, 20)) {
        console.log(
            `- apartment_id=${target.apartment.id}: ${target.householdNote}`
        );
    }

    if (notes.length > 20) {
        console.log(`... còn ${notes.length - 20} ghi chú`);
    }
}

function printSamples(plan: ReadingPlan) {
    console.log("Sample 10 căn đầu tiên:");

    for (const target of plan.targetApartments.slice(0, 10)) {
        const readings = plan.plannedReadings.filter((reading) =>
            reading.apartment.id === target.apartment.id
        );
        const jan = readings.find((reading) => reading.month.month === 1);
        const jun = readings.find((reading) => reading.month.month === 6);

        if (!jan || !jun) {
            continue;
        }

        console.log(
            `- apartment_id=${target.apartment.id}, `
            + `building=${target.apartment.building.branch_name}, `
            + `floor=${target.apartment.floor}, `
            + `room=${target.apartment.room_number}, `
            + `householdSize=${target.householdSize}, `
            + `Jan điện ${jan.data.electric_old}->${jan.data.electric_new}, `
            + `Jan nước ${jan.data.water_old}->${jan.data.water_new}, `
            + `Jun điện ${jun.data.electric_old}->${jun.data.electric_new}, `
            + `Jun nước ${jun.data.water_old}->${jun.data.water_new}`
        );
    }
}

async function runDryRun() {
    const plan = await buildUtilityReadingPlan();
    printPlanReport(plan);

    if (plan.conflicts.length > 0) {
        process.exitCode = 1;
    }
}

async function runExecute() {
    const plan = await buildUtilityReadingPlan();
    console.log("Seed utility readings 01/2026 -> 06/2026");
    console.log("Chế độ: execute");
    console.log(`Số căn hộ mục tiêu: ${plan.targetApartments.length}`);
    console.log(`Tổng utility readings dự kiến: ${plan.plannedReadings.length}`);
    console.log(`Reading mới cần tạo: ${plan.toCreate.length}`);
    console.log(`Reading đã tồn tại và skip: ${plan.skipped.length}`);
    printConflictSummary(plan.conflicts);

    if (plan.conflicts.length > 0) {
        throw new Error(
            "Có conflict utility readings. Dừng execute để tránh update ngầm."
        );
    }

    let createdCount = 0;

    for (const chunk of chunkArray(plan.toCreate, BATCH_SIZE)) {
        const result = await prisma.utilityReading.createMany({
            data: chunk.map((reading) => reading.data)
        });

        createdCount += result.count;
    }

    const validation = await validateAfterExecute(plan);

    console.log("Validation sau execute:");
    console.log(`- created_count: ${createdCount}`);
    console.log(`- skipped_count: ${plan.skipped.length}`);
    console.log(`- conflict_count: ${plan.conflicts.length}`);
    console.log(`- apartment_count: ${plan.targetApartments.length}`);
    console.log(`- month_count: ${plan.months.length}`);
    console.log(`- total_rows_expected: ${plan.plannedReadings.length}`);
    console.log(`- total_rows_after_seed: ${validation.totalRowsAfterSeed}`);
}

async function validateAfterExecute(plan: ReadingPlan) {
    const apartmentIds = plan.targetApartments.map((target) =>
        target.apartment.id
    );
    const rows = await prisma.utilityReading.findMany({
        where: {
            apartment_id: {
                in: apartmentIds
            },
            OR: plan.months.map((month) => ({
                month: month.month,
                year: month.year
            }))
        },
        select: {
            apartment_id: true,
            month: true,
            year: true,
            electric_old: true,
            electric_new: true,
            water_old: true,
            water_new: true
        },
        orderBy: [
            { apartment_id: "asc" },
            { year: "asc" },
            { month: "asc" }
        ]
    });
    const byApartment = new Map<number, typeof rows>();

    for (const row of rows) {
        const current = byApartment.get(row.apartment_id) ?? [];
        current.push(row);
        byApartment.set(row.apartment_id, current);
    }

    for (const target of plan.targetApartments) {
        const apartmentRows = byApartment.get(target.apartment.id) ?? [];

        if (apartmentRows.length !== plan.months.length) {
            throw new Error(
                `Căn hộ ${target.apartment.id} có ${apartmentRows.length}/${plan.months.length} utility readings.`
            );
        }

        for (const month of plan.months) {
            const row = apartmentRows.find((reading) =>
                reading.month === month.month && reading.year === month.year
            );

            if (!row) {
                throw new Error(
                    `Căn hộ ${target.apartment.id} thiếu kỳ ${month.label}.`
                );
            }
        }

        for (let index = 0; index < apartmentRows.length; index += 1) {
            const row = apartmentRows[index];
            const electricOld = toNumber(row.electric_old);
            const electricNew = toNumber(row.electric_new);
            const waterOld = toNumber(row.water_old);
            const waterNew = toNumber(row.water_new);

            if (
                electricOld < 0
                || electricNew < 0
                || waterOld < 0
                || waterNew < 0
            ) {
                throw new Error(
                    `Căn hộ ${row.apartment_id} kỳ ${pad2(row.month)}/${row.year} có chỉ số âm.`
                );
            }

            if (electricNew < electricOld || waterNew < waterOld) {
                throw new Error(
                    `Căn hộ ${row.apartment_id} kỳ ${pad2(row.month)}/${row.year} có chỉ số mới nhỏ hơn chỉ số cũ.`
                );
            }

            const previous = apartmentRows[index - 1];
            if (!previous) {
                continue;
            }

            if (!sameNumber(electricOld, toNumber(previous.electric_new))) {
                throw new Error(
                    `Căn hộ ${row.apartment_id} kỳ ${pad2(row.month)}/${row.year} không liên tục chỉ số điện.`
                );
            }

            if (!sameNumber(waterOld, toNumber(previous.water_new))) {
                throw new Error(
                    `Căn hộ ${row.apartment_id} kỳ ${pad2(row.month)}/${row.year} không liên tục chỉ số nước.`
                );
            }
        }
    }

    return {
        totalRowsAfterSeed: rows.length
    };
}

const main = async () => {
    const args = new Set(process.argv.slice(2));

    if (args.has("--execute")) {
        await runExecute();
        return;
    }

    await runDryRun();
};

main()
    .catch((error: unknown) => {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
