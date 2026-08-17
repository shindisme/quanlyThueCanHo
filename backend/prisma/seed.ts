/// <reference types="node" />
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const buildingDescriptions = [
    {
        id: 1,
        description: "Tòa nhà căn hộ dịch vụ được vận hành theo tiêu chuẩn chuyên nghiệp, phù hợp cho khách thuê cần không gian sống ổn định, an ninh và thuận tiện di chuyển. Khu vực chung được quản lý gọn gàng, có quy trình tiếp nhận yêu cầu bảo trì rõ ràng và ưu tiên trải nghiệm cư trú yên tĩnh."
    },
    {
        id: 2,
        description: "Chi nhánh có quy mô vừa, tối ưu cho người đi làm và gia đình trẻ cần môi trường sống riêng tư, sạch sẽ và dễ kết nối các tiện ích đô thị. Tòa nhà chú trọng an ninh, kiểm soát ra vào, khu để xe thuận tiện và dịch vụ hỗ trợ cư dân nhanh chóng."
    },
    {
        id: 3,
        description: "Tòa nhà được định vị cho nhóm khách thuê dài hạn, ưu tiên căn hộ có bố cục thực dụng, ánh sáng tốt và chi phí vận hành minh bạch. Không gian chung được duy trì định kỳ, giúp cư dân yên tâm sinh hoạt, làm việc tại nhà và tiếp khách khi cần."
    },
    {
        id: 4,
        description: "Chi nhánh căn hộ hiện đại với phong cách quản lý chỉn chu, phù hợp chuyên gia, nhân sự văn phòng và hộ gia đình nhỏ. Tòa nhà có hệ thống căn hộ đa dạng diện tích, dễ lựa chọn theo ngân sách, nhu cầu riêng tư và số lượng người ở."
    },
    {
        id: 5,
        description: "Tòa nhà hướng đến trải nghiệm lưu trú cao cấp hơn với các căn hộ diện tích rộng, bố cục thoáng và tiêu chuẩn nội thất đồng bộ. Môi trường cư trú yên tĩnh, dịch vụ quản lý phản hồi nhanh và phù hợp khách thuê cần hình ảnh sống chuyên nghiệp."
    }
];

const apartmentTemplates = [
    { room_number: "01", area: 35, bedrooms: 0, bathrooms: 1, price: 5000000, desc: "Căn hộ studio 35m² được bố trí mở, tối ưu cho một người ở hoặc nhân sự công tác dài hạn. Không gian sinh hoạt, nghỉ ngơi và bếp được sắp xếp liền mạch, dễ vệ sinh, đón sáng tốt và phù hợp khách thuê ưu tiên sự gọn gàng, riêng tư." },
    { room_number: "02", area: 40, bedrooms: 1, bathrooms: 1, price: 6000000, desc: "Căn hộ 1 phòng ngủ 40m² có bố cục tách biệt giữa khu nghỉ ngơi và khu sinh hoạt, tạo cảm giác riêng tư hơn studio. Diện tích vừa đủ cho người đi làm, cặp đôi trẻ hoặc khách thuê cần không gian làm việc tại nhà đơn giản." },
    { room_number: "03", area: 45, bedrooms: 1, bathrooms: 1, price: 6500000, desc: "Căn hộ 1 phòng ngủ 45m² cân bằng giữa diện tích sử dụng và chi phí thuê, phù hợp nhu cầu ở dài hạn. Phòng khách thoáng, bếp tiện dụng, phòng ngủ đủ riêng tư và dễ bố trí thêm góc làm việc hoặc kệ lưu trữ cá nhân." },
    { room_number: "04", area: 55, bedrooms: 1, bathrooms: 1, price: 7500000, desc: "Căn hộ 1 phòng ngủ 55m² có không gian sinh hoạt rộng rãi hơn, phù hợp khách thuê muốn nâng cấp trải nghiệm sống mà chưa cần căn 2 phòng ngủ. Bố cục ưu tiên sự thoáng đãng, dễ tiếp khách, làm việc tại nhà và duy trì nếp sống ngăn nắp." },
    { room_number: "05", area: 65, bedrooms: 2, bathrooms: 1, price: 9000000, desc: "Căn hộ 2 phòng ngủ 65m² phù hợp gia đình nhỏ, nhóm bạn hoặc khách thuê cần thêm phòng làm việc riêng. Khu sinh hoạt chung được đặt ở vị trí trung tâm, hai phòng ngủ tách biệt tương đối, giúp cân bằng giữa kết nối và riêng tư." },
    { room_number: "06", area: 70, bedrooms: 2, bathrooms: 2, price: 10000000, desc: "Căn hộ 2 phòng ngủ 70m² có 2 phòng tắm, thuận tiện cho gia đình nhỏ hoặc nhóm thuê chung cần lịch sinh hoạt độc lập. Bố cục sử dụng hiệu quả, khu bếp và phòng khách dễ kết nối, phù hợp lưu trú dài hạn với tiêu chuẩn tiện nghi cao hơn." },
    { room_number: "07", area: 75, bedrooms: 2, bathrooms: 2, price: 11000000, desc: "Căn hộ góc 2 phòng ngủ 75m² có lợi thế thoáng sáng, tầm nhìn mở và hạn chế cảm giác bí bách trong sinh hoạt hằng ngày. Đây là lựa chọn phù hợp cho khách thuê muốn không gian rộng, riêng tư, đón gió tốt và có thể bố trí nhiều khu chức năng." },
    { room_number: "08", area: 85, bedrooms: 3, bathrooms: 2, price: 13000000, desc: "Căn hộ 3 phòng ngủ 85m² phù hợp gia đình có con nhỏ, nhóm chuyên gia hoặc khách thuê cần nhiều phòng chức năng. Không gian chung rộng, phòng ngủ phân bổ hợp lý, đáp ứng tốt nhu cầu sinh hoạt dài hạn, làm việc riêng và lưu trữ đồ dùng gia đình." },
    { room_number: "09", area: 95, bedrooms: 3, bathrooms: 2, price: 15000000, desc: "Căn hộ cao cấp 3 phòng ngủ 95m² hướng đến khách thuê cần diện tích lớn, bố cục sang trọng và tính riêng tư cao. Phòng khách rộng rãi, khu bếp thuận tiện, các phòng ngủ dễ bố trí nội thất đầy đủ, phù hợp gia đình hoặc chuyên gia lưu trú lâu dài." },
    { room_number: "10", area: 120, bedrooms: 4, bathrooms: 3, price: 20000000, desc: "Căn hộ hạng sang 4 phòng ngủ 120m² là lựa chọn rộng nhất trong tòa nhà, phù hợp gia đình đông người hoặc khách thuê cần không gian sống kết hợp làm việc. Bố cục nhiều phòng, 3 phòng tắm và diện tích sinh hoạt lớn mang lại trải nghiệm cư trú riêng tư, tiện nghi và chuyên nghiệp." }
];

async function main() {
    console.log("Đang bắt đầu seeding dữ liệu...");
    for (const building of buildingDescriptions) {
        await prisma.building.updateMany({
            where: { id: building.id },
            data: { description: building.description }
        });
    }

    for (let bId = 1; bId <= 5; bId++) {
        for (let floor = 1; floor <= 10; floor++) {
            for (const apt of apartmentTemplates) {
                await prisma.apartment.upsert({
                    where: {
                        building_id_floor_room_number: {
                            building_id: bId,
                            floor: floor,
                            room_number: apt.room_number
                        }
                    },
                    update: {
                        description: apt.desc
                    },
                    create: {
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

