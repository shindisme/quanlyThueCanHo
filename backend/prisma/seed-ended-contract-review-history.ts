import {
    ContractStatus,
    Prisma,
    PrismaClient
} from "@prisma/client";

const prisma = new PrismaClient();

const BATCH_SIZE = 10;

type Apartment = Prisma.ApartmentGetPayload<{
    include: {
        building: {
            select: {
                id: true;
                branch_name: true;
            };
        };
    };
}>;

type HistoryPlan = {
    apartment: Apartment;
    historyIndex: number;
    tenant: {
        fullName: string;
        phone: string;
        email: string;
        citizenId: string;
        dateOfBirth: Date;
        address: string;
    };
    contract: {
        startDate: Date;
        endDate: Date;
        signedAt: Date;
        monthlyRent: Prisma.Decimal;
        depositAmount: Prisma.Decimal;
    };
    review: {
        rating: 5;
        comment: string;
        createdAt: Date;
    };
};

const historyPeriods = [
    {
        startDate: new Date(Date.UTC(2022, 0, 10)),
        endDate: new Date(Date.UTC(2022, 9, 9)),
        rentFactor: new Prisma.Decimal("0.84")
    },
    {
        startDate: new Date(Date.UTC(2022, 10, 1)),
        endDate: new Date(Date.UTC(2023, 7, 31)),
        rentFactor: new Prisma.Decimal("0.88")
    },
    {
        startDate: new Date(Date.UTC(2023, 8, 15)),
        endDate: new Date(Date.UTC(2024, 7, 14)),
        rentFactor: new Prisma.Decimal("0.92")
    },
    {
        startDate: new Date(Date.UTC(2024, 8, 1)),
        endDate: new Date(Date.UTC(2025, 5, 30)),
        rentFactor: new Prisma.Decimal("0.96")
    }
] as const;

const firstNames = [
    "Minh",
    "Anh",
    "Hoàng",
    "Khánh",
    "Ngọc",
    "Thanh",
    "Quang",
    "Bảo",
    "Hà",
    "Phúc",
    "Linh",
    "Tuấn"
];

const middleLastNames = [
    "Nguyễn Văn",
    "Trần Thị",
    "Lê Minh",
    "Phạm Gia",
    "Hoàng Nhật",
    "Võ Thanh",
    "Đặng Quốc",
    "Bùi Ngọc",
    "Đỗ Anh",
    "Huỳnh Đức"
];

const comments = [
    "Căn hộ sạch sẽ, bàn giao đúng cam kết và ban quản lý hỗ trợ rất nhanh.",
    "Không gian ở yên tĩnh, an ninh tốt, phù hợp sinh hoạt lâu dài.",
    "Dịch vụ quản lý chuyên nghiệp, các vấn đề phát sinh được xử lý kịp thời.",
    "Vị trí thuận tiện, căn hộ thoáng và nội thất sử dụng ổn định.",
    "Trải nghiệm thuê rất hài lòng, thủ tục rõ ràng và minh bạch.",
    "Tòa nhà giữ vệ sinh tốt, khu vực chung gọn gàng, nhân viên thân thiện.",
    "Căn hộ đúng mô tả, chi phí rõ ràng, rất đáng để giới thiệu.",
    "Thời gian ở thoải mái, hệ thống điện nước ổn định, ít phát sinh sự cố."
];

const pad = (value: number, length: number) =>
    value.toString().padStart(length, "0");

const chunkArray = <T>(items: T[], size: number) => {
    const chunks: T[][] = [];
    for (let index = 0; index < items.length; index += size) {
        chunks.push(items.slice(index, index + size));
    }
    return chunks;
};

const getHistoryCount = (apartmentId: number) =>
    apartmentId % 2 === 0 ? 4 : 3;

const getCitizenId = (apartmentId: number, historyIndex: number) =>
    `79${pad(apartmentId, 7)}${pad(historyIndex + 1, 3)}`;

const getPhone = (apartmentId: number, historyIndex: number) =>
    `09${pad(60000000 + apartmentId * 10 + historyIndex, 8)}`;

const getEmail = (apartmentId: number, historyIndex: number) =>
    `lichsu.${apartmentId}.${historyIndex + 1}@yukihouse.demo`;

const addDays = (date: Date, days: number) =>
    new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

const pickName = (apartmentId: number, historyIndex: number) => {
    const firstName = firstNames[(apartmentId + historyIndex) % firstNames.length];
    const middleLastName = middleLastNames[
        (apartmentId * 3 + historyIndex) % middleLastNames.length
    ];
    return `${middleLastName} ${firstName}`;
};

const buildPlans = (apartments: Apartment[]) =>
    apartments.flatMap((apartment) =>
        Array.from({ length: getHistoryCount(apartment.id) }, (_, historyIndex) => {
            const period = historyPeriods[historyIndex];
            const monthlyRent = new Prisma.Decimal(apartment.rental_price)
                .mul(period.rentFactor)
                .toDecimalPlaces(0);
            const stableKey = apartment.id * 7 + historyIndex;

            return {
                apartment,
                historyIndex,
                tenant: {
                    fullName: pickName(apartment.id, historyIndex),
                    phone: getPhone(apartment.id, historyIndex),
                    email: getEmail(apartment.id, historyIndex),
                    citizenId: getCitizenId(apartment.id, historyIndex),
                    dateOfBirth: new Date(Date.UTC(
                        1985 + (stableKey % 16),
                        stableKey % 12,
                        1 + (stableKey % 27)
                    )),
                    address: [
                        "123 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh",
                        "45/2 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
                        "88 Nam Kỳ Khởi Nghĩa, Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh",
                        "12 Trương Định, Phường 6, Quận 3, TP. Hồ Chí Minh",
                        "254 Nguyễn Văn Trỗi, Phường 8, Quận Phú Nhuận, TP. Hồ Chí Minh",
                        "76 Phan Xích Long, Phường 2, Quận Phú Nhuận, TP. Hồ Chí Minh",
                        "312 Điện Biên Phủ, Phường 15, Quận Bình Thạnh, TP. Hồ Chí Minh",
                        "19 Bạch Đằng, Phường 24, Quận Bình Thạnh, TP. Hồ Chí Minh",
                        "105 Hoàng Diệu, Phường 12, Quận 4, TP. Hồ Chí Minh",
                        "68 Trần Hưng Đạo, Phường Cầu Ông Lãnh, Quận 1, TP. Hồ Chí Minh",
                        "142 Võ Văn Tần, Phường 5, Quận 3, TP. Hồ Chí Minh",
                        "50 Cách Mạng Tháng 8, Phường 6, Quận 3, TP. Hồ Chí Minh",
                        "89 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh",
                        "230 Lê Văn Sỹ, Phường 14, Quận 3, TP. Hồ Chí Minh",
                        "175 Hai Bà Trưng, Phường Đa Kao, Quận 1, TP. Hồ Chí Minh",
                        "60 Đinh Tiên Hoàng, Phường Đa Kao, Quận 1, TP. Hồ Chí Minh"
                    ][stableKey % 16]
                },
                contract: {
                    startDate: period.startDate,
                    endDate: period.endDate,
                    signedAt: addDays(period.startDate, -3),
                    monthlyRent,
                    depositAmount: monthlyRent
                },
                review: {
                    rating: 5 as const,
                    comment: comments[stableKey % comments.length],
                    createdAt: addDays(period.endDate, 7 + (stableKey % 10))
                }
            } satisfies HistoryPlan;
        })
    );

async function loadApartments() {
    return prisma.apartment.findMany({
        include: {
            building: {
                select: {
                    id: true,
                    branch_name: true
                }
            }
        },
        orderBy: [
            { building_id: "asc" },
            { floor: "asc" },
            { room_number: "asc" }
        ]
    });
}

async function buildExistingStats(plans: HistoryPlan[]) {
    const citizenIds = plans.map((plan) => plan.tenant.citizenId);
    const existingTenants = await prisma.tenant.findMany({
        where: { citizen_id: { in: citizenIds } },
        select: { id: true, citizen_id: true }
    });
    const tenantIds = existingTenants.map((tenant) => tenant.id);
    const existingContracts = tenantIds.length === 0
        ? []
        : await prisma.rentalContract.findMany({
            where: { tenant_id: { in: tenantIds } },
            select: { tenant_id: true, apartment_id: true }
        });
    const existingReviews = tenantIds.length === 0
        ? []
        : await prisma.review.findMany({
            where: { tenant_id: { in: tenantIds } },
            select: { tenant_id: true, apartment_id: true }
        });

    return {
        existingTenants,
        existingContracts,
        existingReviews
    };
}

function printPlan(
    apartments: Apartment[],
    plans: HistoryPlan[],
    stats: Awaited<ReturnType<typeof buildExistingStats>>
) {
    const historiesPerApartment = apartments.reduce(
        (acc, apartment) => {
            acc[getHistoryCount(apartment.id)] += 1;
            return acc;
        },
        { 3: 0, 4: 0 } as Record<3 | 4, number>
    );
    const buildingCounts = new Map<string, number>();
    for (const plan of plans) {
        const key = plan.apartment.building.branch_name;
        buildingCounts.set(key, (buildingCounts.get(key) ?? 0) + 1);
    }

    console.log("Seed lịch sử thuê đã kết thúc + review 5 sao");
    console.log(`- apartments: ${apartments.length}`);
    console.log(`- apartments_with_3_histories: ${historiesPerApartment[3]}`);
    console.log(`- apartments_with_4_histories: ${historiesPerApartment[4]}`);
    console.log(`- planned_histories: ${plans.length}`);
    console.log(`- existing_seed_tenants: ${stats.existingTenants.length}`);
    console.log(`- existing_seed_contracts: ${stats.existingContracts.length}`);
    console.log(`- existing_seed_reviews: ${stats.existingReviews.length}`);
    console.log(`- tenants_to_create: ${plans.length - stats.existingTenants.length}`);
    console.log(`- contracts_to_create: ${plans.length - stats.existingContracts.length}`);
    console.log(`- reviews_to_create: ${plans.length - stats.existingReviews.length}`);

    console.log("Theo tòa nhà:");
    for (const [building, count] of buildingCounts) {
        console.log(`- ${building}: ${count} histories`);
    }

    console.log("Samples:");
    for (const plan of plans.slice(0, 10)) {
        console.log(
            `- apartment_id=${plan.apartment.id}, building=${plan.apartment.building.branch_name}, `
            + `room=P.${plan.apartment.room_number}, tenant=${plan.tenant.fullName}, `
            + `contract=${plan.contract.startDate.toISOString().slice(0, 10)}..${plan.contract.endDate.toISOString().slice(0, 10)}, `
            + `review="${plan.review.comment}"`
        );
    }
}

async function runDryRun() {
    const apartments = await loadApartments();
    const plans = buildPlans(apartments);
    const stats = await buildExistingStats(plans);
    printPlan(apartments, plans, stats);
}

async function upsertHistoryPlan(
    tx: Prisma.TransactionClient,
    plan: HistoryPlan
) {
    const tenant = await tx.tenant.upsert({
        where: { citizen_id: plan.tenant.citizenId },
        create: {
            user_id: null,
            onboarding_building_id: plan.apartment.building_id,
            full_name: plan.tenant.fullName,
            phone: plan.tenant.phone,
            email: plan.tenant.email,
            date_of_birth: plan.tenant.dateOfBirth,
            citizen_id: plan.tenant.citizenId,
            address: plan.tenant.address,
            is_verified: true,
            created_at: plan.contract.signedAt
        },
        update: {
            onboarding_building_id: plan.apartment.building_id,
            full_name: plan.tenant.fullName,
            phone: plan.tenant.phone,
            email: plan.tenant.email,
            date_of_birth: plan.tenant.dateOfBirth,
            address: plan.tenant.address,
            is_verified: true
        },
        select: { id: true }
    });

    const existingContract = await tx.rentalContract.findFirst({
        where: {
            apartment_id: plan.apartment.id,
            tenant_id: tenant.id,
            start_date: plan.contract.startDate,
            end_date: plan.contract.endDate
        },
        select: { id: true }
    });

    if (existingContract) {
        await tx.rentalContract.update({
            where: { id: existingContract.id },
            data: {
                deposit_amount: plan.contract.depositAmount,
                monthly_rent: plan.contract.monthlyRent,
                status: ContractStatus.ENDED,
                signed_at: plan.contract.signedAt,
                contract_file: null,
                extended_at: null
            }
        });
    } else {
        await tx.rentalContract.create({
            data: {
                apartment_id: plan.apartment.id,
                tenant_id: tenant.id,
                start_date: plan.contract.startDate,
                end_date: plan.contract.endDate,
                deposit_amount: plan.contract.depositAmount,
                monthly_rent: plan.contract.monthlyRent,
                status: ContractStatus.ENDED,
                signed_at: plan.contract.signedAt,
                created_at: plan.contract.signedAt,
                contract_file: null,
                extended_at: null
            }
        });
    }

    await tx.review.upsert({
        where: {
            apartment_id_tenant_id: {
                apartment_id: plan.apartment.id,
                tenant_id: tenant.id
            }
        },
        create: {
            apartment_id: plan.apartment.id,
            tenant_id: tenant.id,
            rating: plan.review.rating,
            comment: plan.review.comment,
            created_at: plan.review.createdAt
        },
        update: {
            rating: plan.review.rating,
            comment: plan.review.comment,
            created_at: plan.review.createdAt
        }
    });
}

async function runExecute() {
    const apartments = await loadApartments();
    const plans = buildPlans(apartments);
    const before = await buildExistingStats(plans);
    printPlan(apartments, plans, before);

    let processed = 0;
    for (const batch of chunkArray(plans, BATCH_SIZE)) {
        await prisma.$transaction(
            async (tx) => {
                for (const plan of batch) {
                    await upsertHistoryPlan(tx, plan);
                }
            },
            {
                maxWait: 10_000,
                timeout: 60_000
            }
        );
        processed += batch.length;
        console.log(`Processed ${processed}/${plans.length} histories`);
    }

    const after = await validateAfterExecute(plans);
    console.log("Validation sau execute:");
    console.log(`- target_histories: ${plans.length}`);
    console.log(`- seed_tenants: ${after.tenants}`);
    console.log(`- ended_contracts: ${after.endedContracts}`);
    console.log(`- five_star_reviews: ${after.fiveStarReviews}`);
    console.log(`- reviews_with_wrong_rating: ${after.reviewsWithWrongRating}`);

    if (
        after.tenants !== plans.length
        || after.endedContracts !== plans.length
        || after.fiveStarReviews !== plans.length
        || after.reviewsWithWrongRating !== 0
    ) {
        throw new Error("Validation seed lịch sử thuê/review không đạt.");
    }
}

async function validateAfterExecute(plans: HistoryPlan[]) {
    const citizenIds = plans.map((plan) => plan.tenant.citizenId);
    const tenants = await prisma.tenant.findMany({
        where: { citizen_id: { in: citizenIds } },
        select: { id: true, citizen_id: true }
    });
    const tenantIds = tenants.map((tenant) => tenant.id);
    const [endedContracts, reviews, wrongReviews] = await prisma.$transaction([
        prisma.rentalContract.count({
            where: {
                tenant_id: { in: tenantIds },
                status: ContractStatus.ENDED
            }
        }),
        prisma.review.count({
            where: {
                tenant_id: { in: tenantIds },
                rating: 5
            }
        }),
        prisma.review.count({
            where: {
                tenant_id: { in: tenantIds },
                rating: { not: 5 }
            }
        })
    ]);

    return {
        tenants: tenants.length,
        endedContracts,
        fiveStarReviews: reviews,
        reviewsWithWrongRating: wrongReviews
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
