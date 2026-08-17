/// <reference types="node" />
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
    PrismaClient,
    Role,
    UserStatus
} from "@prisma/client";
import xlsx from "xlsx";
import {
    createInitialCredential,
    nextStaffUsername
} from "../src/services/account.service.js";

const prisma = new PrismaClient();

const EXCEL_URL = new URL(
    "./data/danh_sach_100_nhan_vien.xlsx",
    import.meta.url
);
const EXCEL_PATH = fileURLToPath(EXCEL_URL);
const STAFF_SHEET = "Danh sách nhân viên";
const STAFF_HEADER_ROW_COUNT = 3;
const STAFF_USERNAME_PREFIX = "nhanvien";

const STAFF_QUOTA = {
    "Bảo vệ": 3,
    "Kỹ thuật": 5,
    "Tiếp thị": 5,
    "Vệ sinh": 5
} as const;

type Mode = "dry-run" | "execute";
type StaffPosition = keyof typeof STAFF_QUOTA;

const STAFF_POSITIONS = Object.keys(STAFF_QUOTA) as StaffPosition[];
const ACCOUNT_POSITIONS = new Set<StaffPosition>(["Kỹ thuật"]);
const ROLE_NAME_POOLS = {
    "Bảo vệ": [
        "Nguyễn Văn Hùng",
        "Trần Minh Quân",
        "Lê Quốc Bảo",
        "Phạm Đức Long",
        "Hoàng Hữu Nam",
        "Đặng Tuấn Kiệt",
        "Võ Trọng Nghĩa",
        "Bùi Văn Thắng",
        "Đỗ Minh Thành",
        "Huỳnh Quốc Dũng",
        "Phan Hữu Tài",
        "Cao Văn Phúc",
        "Dương Đức Anh",
        "Trịnh Minh Khang",
        "Ngô Tuấn Hải",
        "Mai Đức Thắng",
        "Lý Quốc Hưng",
        "Tạ Minh Đức",
        "Hồ Văn Cường",
        "Châu Anh Tuấn",
        "Đinh Hữu Phong",
        "Lương Trọng Nhân",
        "Vũ Minh Khôi",
        "Trương Quốc Đạt",
        "Nguyễn Hoàng Sơn"
    ],
    "Kỹ thuật": [
        "Nguyễn Văn Hải",
        "Trần Hoàng Bách",
        "Cao Minh Bảo",
        "Cao Hữu Trung",
        "Châu Hữu Tài",
        "Hồ Đức Đạt",
        "Châu Tuấn Huy",
        "Châu Hữu Cường",
        "Đoàn Gia Tuấn",
        "Lương Văn Quân",
        "Phan Hữu Huy",
        "Châu Trọng Quang",
        "Nguyễn Thanh Tuấn",
        "Hồ Tuấn Khánh",
        "Lý Trọng Dũng",
        "Đặng Minh Khoa",
        "Võ Quốc Việt",
        "Bùi Đức Thịnh",
        "Phạm Văn Sơn",
        "Hoàng Anh Dũng",
        "Trịnh Gia Huy",
        "Ngô Minh Nhật",
        "Đỗ Thành Long",
        "Huỳnh Tuấn Kiệt",
        "Dương Quốc Hưng"
    ],
    "Tiếp thị": [
        "Trần Ngọc Ánh",
        "Phạm Mỹ Duyên",
        "Đặng Thu Ngân",
        "Huỳnh Bảo Trâm",
        "Đỗ Ngọc Quỳnh",
        "Mai Hồng Thư",
        "Tạ Phương Uyên",
        "Đỗ Kim Ngân",
        "Hoàng Kim Linh",
        "Dương Mỹ Hà",
        "Đinh Thu Quỳnh",
        "Cao Thị Hà",
        "Đinh Thị Phương",
        "Đặng Kim Ngân",
        "Đoàn Phương Ngân",
        "Dương Phương Nhung",
        "Dương Mỹ Quỳnh",
        "Nguyễn Thị Mai",
        "Lê Thu Trang",
        "Võ Ngọc Lan",
        "Bùi Hồng Nhung",
        "Phan Thị Hạnh",
        "Châu Kim Chi",
        "Trịnh Mỹ Linh",
        "Ngô Thanh Thảo"
    ],
    "Vệ sinh": [
        "Dương Thu Lan",
        "Huỳnh Mỹ Trang",
        "Trịnh Phương Mai",
        "Bùi Kim Vy",
        "Bùi Phương Anh",
        "Ngô Ngọc Mai",
        "Châu Hồng Hiền",
        "Châu Thị Hà",
        "Mai Kim Quỳnh",
        "Bùi Thị Uyên",
        "Nguyễn Thị Hoa",
        "Trần Thị Hương",
        "Lê Thị Cúc",
        "Phạm Thị Tuyết",
        "Hoàng Thị Loan",
        "Đặng Thị Nga",
        "Võ Thị Liên",
        "Đỗ Thị Thủy",
        "Cao Thị Huệ",
        "Phan Thị Yến",
        "Dương Thị Thảo",
        "Huỳnh Thị Xuân",
        "Lý Thị Hồng",
        "Tạ Thị Vân",
        "Hồ Thị Oanh"
    ]
} satisfies Record<StaffPosition, readonly string[]>;

type StaffRow = {
    stt: number;
    fullName: string;
    phone: string;
    position: StaffPosition;
};

type BuildingForSeed = {
    id: number;
    branch_name: string;
    assigned_staff: {
        position: string;
        phone: string | null;
    }[];
};

type SeedAssignment = {
    building: {
        id: number;
        branch_name: string;
    };
    staff: StaffRow;
};

type RepairAssignment = {
    id: number;
    oldName: string;
    newName: string;
    position: StaffPosition;
    user_id: number | null;
};

const text = (value: unknown) => String(value ?? "").trim();

const isStaffPosition = (value: string): value is StaffPosition =>
    Object.prototype.hasOwnProperty.call(STAFF_QUOTA, value);

const normalizePhone = (phone: unknown) => text(phone).replace(/\s+/g, "");

const modeFromArgs = (): Mode =>
    process.argv.includes("--execute") ? "execute" : "dry-run";

const nextRoleName = (position: StaffPosition, index: number) => {
    const names = ROLE_NAME_POOLS[position];

    if (index < names.length) {
        return names[index];
    }

    const baseName = names[index % names.length];
    return `${baseName} ${Math.floor(index / names.length) + 1}`;
};

const applyGenderedNames = (staffRows: StaffRow[]) => {
    const indexes = Object.fromEntries(
        STAFF_POSITIONS.map((position) => [position, 0])
    ) as Record<StaffPosition, number>;

    return staffRows.map((staff) => {
        const index = indexes[staff.position];
        indexes[staff.position] += 1;

        return {
            ...staff,
            fullName: nextRoleName(staff.position, index)
        };
    });
};

const countByPosition = (
    staffs: { position: string }[]
) => {
    const counts = Object.fromEntries(
        STAFF_POSITIONS.map((position) => [position, 0])
    ) as Record<StaffPosition, number>;

    for (const staff of staffs) {
        if (isStaffPosition(staff.position)) {
            counts[staff.position] += 1;
        }
    }

    return counts;
};

const readStaffRows = () => {
    if (!existsSync(EXCEL_PATH)) {
        const staffRows: StaffRow[] = [];
        let stt = 1;
        let phoneCounter = 901000001;
        for (const position of STAFF_POSITIONS) {
            const totalNeeded = STAFF_QUOTA[position] * 10;
            for (let i = 0; i < totalNeeded; i++) {
                staffRows.push({
                    stt: stt++,
                    fullName: nextRoleName(position, i),
                    phone: `0${phoneCounter++}`,
                    position: position
                });
            }
        }
        return staffRows;
    }

    const workbook = xlsx.readFile(EXCEL_PATH, {
        cellDates: true
    });
    const sheet = workbook.Sheets[STAFF_SHEET];

    if (!sheet) {
        throw new Error(`Không tìm thấy sheet "${STAFF_SHEET}"`);
    }

    const rows = xlsx.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        defval: "",
        raw: false
    });
    const staffRows: StaffRow[] = [];

    rows.slice(STAFF_HEADER_ROW_COUNT).forEach((row, index) => {
        const [
            stt,
            fullName,
            phone,
            position
        ] = row;
        const rowNumber = index + STAFF_HEADER_ROW_COUNT + 1;
        const normalizedName = text(fullName);
        const normalizedPhone = normalizePhone(phone);
        const normalizedPosition = text(position);

        if (!normalizedName && !normalizedPhone && !normalizedPosition) {
            return;
        }

        if (
            !normalizedName
            || !normalizedPhone
            || !isStaffPosition(normalizedPosition)
        ) {
            throw new Error(`Dòng ${rowNumber} trong Excel không hợp lệ.`);
        }

        staffRows.push({
            stt: Number(stt),
            fullName: normalizedName,
            phone: normalizedPhone,
            position: normalizedPosition
        });
    });

    const duplicatePhone = staffRows.find((row, index) =>
        staffRows.findIndex((candidate) => candidate.phone === row.phone)
            !== index
    );

    if (duplicatePhone) {
        throw new Error(
            `File Excel có số điện thoại trùng: ${duplicatePhone.phone}`
        );
    }

    return applyGenderedNames(staffRows);
};

const buildAssignments = (
    staffRows: StaffRow[],
    buildings: BuildingForSeed[]
) => {
    const usedPhones = new Set(
        buildings.flatMap((building) =>
            building.assigned_staff
                .map((staff) => staff.phone)
                .filter((phone): phone is string => Boolean(phone))
        )
    );
    const availableByPosition = new Map<StaffPosition, StaffRow[]>(
        STAFF_POSITIONS.map((position) => [
            position,
            staffRows.filter((staff) =>
                staff.position === position && !usedPhones.has(staff.phone)
            )
        ])
    );
    const assignments: SeedAssignment[] = [];

    for (const building of buildings) {
        const counts = countByPosition(building.assigned_staff);

        for (const position of STAFF_POSITIONS) {
            const missing = Math.max(
                0,
                STAFF_QUOTA[position] - counts[position]
            );

            for (let index = 0; index < missing; index += 1) {
                const candidates = availableByPosition.get(position) ?? [];
                const staff = candidates.shift();

                if (!staff) {
                    throw new Error(
                        `Không đủ nhân viên "${position}" trong Excel để seed.`
                    );
                }

                usedPhones.add(staff.phone);
                assignments.push({
                    building: {
                        id: building.id,
                        branch_name: building.branch_name
                    },
                    staff
                });
            }
        }
    }

    return assignments;
};

const summarizeAssignments = (assignments: SeedAssignment[]) => {
    const summary = new Map<string, Record<StaffPosition, number>>();

    for (const assignment of assignments) {
        const current = summary.get(assignment.building.branch_name)
            ?? Object.fromEntries(
                STAFF_POSITIONS.map((position) => [position, 0])
            ) as Record<StaffPosition, number>;

        current[assignment.staff.position] += 1;
        summary.set(assignment.building.branch_name, current);
    }

    return Array.from(summary.entries()).map(([building, counts]) => ({
        building,
        counts
    }));
};

const printPlan = (
    mode: Mode,
    staffRows: StaffRow[],
    assignments: SeedAssignment[]
) => {
    console.log(`Mode: ${mode}`);
    console.log(`Excel rows: ${staffRows.length}`);
    console.log(`Nhân viên sẽ thêm: ${assignments.length}`);
    console.log(JSON.stringify(summarizeAssignments(assignments), null, 2));
};

const createStaff = async (assignments: SeedAssignment[]) => {
    const existingUsernames = await prisma.user.findMany({
        where: {
            username: {
                startsWith: STAFF_USERNAME_PREFIX
            }
        },
        select: { username: true }
    });
    const usernames = existingUsernames.map(({ username }) => username);
    const credential = await createInitialCredential();

    await prisma.$transaction(async (transaction) => {
        for (const assignment of assignments) {
            let userId: number | undefined;

            if (ACCOUNT_POSITIONS.has(assignment.staff.position)) {
                const username = nextStaffUsername(
                    STAFF_USERNAME_PREFIX,
                    usernames
                );
                usernames.push(username);

                const user = await transaction.user.create({
                    data: {
                        username,
                        password_hash: credential.password_hash,
                        role: Role.STAFF,
                        status: UserStatus.ACTIVE
                    },
                    select: { id: true }
                });
                userId = user.id;
            }

            await transaction.staff.create({
                data: {
                    building_id: assignment.building.id,
                    full_name: assignment.staff.fullName,
                    phone: assignment.staff.phone,
                    position: assignment.staff.position,
                    ...(userId === undefined
                        ? {}
                        : { user_id: userId })
                }
            });
        }
    });
};

const buildRepairAssignments = async () => {
    const staffs = await prisma.staff.findMany({
        where: {
            position: {
                in: STAFF_POSITIONS
            }
        },
        orderBy: [
            { building_id: "asc" },
            { position: "asc" },
            { id: "asc" }
        ],
        select: {
            id: true,
            full_name: true,
            position: true,
            user_id: true
        }
    });
    const indexes = Object.fromEntries(
        STAFF_POSITIONS.map((position) => [position, 0])
    ) as Record<StaffPosition, number>;

    return staffs.map((staff) => {
        if (!isStaffPosition(staff.position)) {
            throw new Error(`Vị trí staff không hợp lệ: ${staff.position}`);
        }

        const index = indexes[staff.position];
        indexes[staff.position] += 1;

        return {
            id: staff.id,
            oldName: staff.full_name,
            newName: nextRoleName(staff.position, index),
            position: staff.position,
            user_id: staff.user_id
        };
    });
};

const printRepairPlan = (
    mode: Mode,
    assignments: RepairAssignment[]
) => {
    const changes = assignments.filter((assignment) =>
        assignment.oldName !== assignment.newName
    );
    const wrongAccounts = assignments.filter((assignment) =>
        !ACCOUNT_POSITIONS.has(assignment.position)
        && assignment.user_id !== null
    );
    const missingAccounts = assignments.filter((assignment) =>
        ACCOUNT_POSITIONS.has(assignment.position)
        && assignment.user_id === null
    );

    console.log(`Mode: ${mode}`);
    console.log(`Nhân viên đổi tên: ${changes.length}`);
    console.log(`Không được có tài khoản: ${wrongAccounts.length}`);
    console.log(`Kỹ thuật thiếu tài khoản: ${missingAccounts.length}`);
};

const repairNames = async (assignments: RepairAssignment[]) => {
    await prisma.$transaction(
        assignments.map((assignment) =>
            prisma.staff.update({
                where: { id: assignment.id },
                data: { full_name: assignment.newName }
            })
        )
    );
};

const seedMissingStaff = async (mode: Mode) => {
    const staffRows = readStaffRows();
    const buildings = await prisma.building.findMany({
        orderBy: { id: "asc" },
        select: {
            id: true,
            branch_name: true,
            assigned_staff: {
                select: {
                    position: true,
                    phone: true
                }
            }
        }
    });
    const assignments = buildAssignments(staffRows, buildings);

    printPlan(mode, staffRows, assignments);

    if (mode === "dry-run" || assignments.length === 0) {
        return;
    }

    await createStaff(assignments);
    console.log(`Đã seed ${assignments.length} nhân viên.`);
};

const repairExistingStaffNames = async (mode: Mode) => {
    const assignments = await buildRepairAssignments();

    printRepairPlan(mode, assignments);

    if (mode === "dry-run") {
        return;
    }

    await repairNames(assignments);
    console.log("Đã sửa tên nhân viên theo giới tính/vai trò.");
};

const main = async () => {
    const mode = modeFromArgs();

    if (process.argv.includes("--repair-names")) {
        await repairExistingStaffNames(mode);
        return;
    }

    await seedMissingStaff(mode);
};

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });


