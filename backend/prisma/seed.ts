/// <reference types="node" />
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const apartmentTemplates = [
    { room_number: "01", area: 35, bedrooms: 0, bathrooms: 1, price: 5000000, desc: "Căn hộ studio..." },
    { room_number: "02", area: 40, bedrooms: 1, bathrooms: 1, price: 6000000, desc: "Căn hộ 1 phòng ngủ..." },
    { room_number: "03", area: 45, bedrooms: 1, bathrooms: 1, price: 6500000, desc: "Căn hộ 1 phòng ngủ..." },
    { room_number: "04", area: 55, bedrooms: 1, bathrooms: 1, price: 7500000, desc: "Căn hộ 1 phòng ngủ..." },
    { room_number: "05", area: 65, bedrooms: 2, bathrooms: 1, price: 9000000, desc: "Căn hộ 2 phòng ngủ..." },
    { room_number: "06", area: 70, bedrooms: 2, bathrooms: 2, price: 10000000, desc: "Căn hộ 2 phòng ngủ..." },
    { room_number: "07", area: 75, bedrooms: 2, bathrooms: 2, price: 11000000, desc: "Căn hộ góc..." },
    { room_number: "08", area: 85, bedrooms: 3, bathrooms: 2, price: 13000000, desc: "Căn hộ 3 phòng ngủ..." },
    { room_number: "09", area: 95, bedrooms: 3, bathrooms: 2, price: 15000000, desc: "Căn hộ cao cấp..." },
    { room_number: "10", area: 120, bedrooms: 4, bathrooms: 3, price: 20000000, desc: "Căn hộ hạng sang..." }
];

async function main() {
    console.log("Đang bắt đầu seeding dữ liệu...");
    for (let bId = 1; bId <= 5; bId++) {
        for (let floor = 1; floor <= 20; floor++) {
            for (const apt of apartmentTemplates) {
                await prisma.apartment.create({
                    data: {
                        building_id: bId,
                        floor: floor,
                        room_number: apt.room_number,
                        description: apt.desc,
                        area: apt.area,
                        rental_price: apt.price,
                        bedrooms: apt.bedrooms,
                        bathrooms: apt.bathrooms,
                        status: 'AVAILABLE'
                    }
                });
            }
        }
    }
    console.log("Seeding hoàn tất!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });