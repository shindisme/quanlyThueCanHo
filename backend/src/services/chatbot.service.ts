import { GoogleGenAI } from "@google/genai";
import { getAllApartmentsService } from "./apartment.service.js";
import { getAllBuildingsService } from "./building.service.js";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
});

const SYSTEM_PROMPT = `
Bạn là trợ lý tư vấn căn hộ chuyên nghiệp. 
QUY TẮC PHẢN HỒI:
1. Trả lời bằng tiếng Việt, thân thiện, ngắn gọn.
2. DỰA VÀO CÂU HỎI CỦA KHÁCH: Chỉ liệt kê tối đa 3 căn hộ phù hợp nhất.
3. Nếu khách hỏi chung chung, hãy giới thiệu ngắn gọn và hỏi lại nhu cầu (số phòng ngủ, khu vực/quận, tầm giá).
5. Trong trường hợp khách hỏi căn hộ ở quận cụ thể nhưng không có trong danh sách, hãy liệt kê các căn hộ trống ở tòa nhà gần đó và trả lời kèm theo địa chỉ tòa nhà.
6. Trường hợp khách hỏi về căn hộ gần một đại điểm cụ thể (ví dụ: gần Landmark 81, gần Vincom Center), hãy đối chiếu với danh sách tòa nhà và liệt kê các căn hộ trống ở tòa nhà gần đó.
7. Ở mục 5 và 6, chỉ trả lời khi khách đưa ra địa điểm ở nội thành Thành phố Hồ Chí Minh. Nếu khách hỏi ở ngoại thành hoặc tỉnh khác, hãy trả lời YukiHouse chỉ có các tòa nhà ở Thành Phố Hồ Chí Minh.
8. Không bao giờ liệt kê toàn bộ danh sách nếu khách không yêu cầu.
9. Chỉ sử dụng dữ liệu được cung cấp. Nếu không có căn phù hợp, mới hướng dẫn liên hệ hotline.
`;

export const processCustomerMessage = async (userMessage: string) => {
    try {
        const [aptResult, bldResult] = await Promise.all([
            getAllApartmentsService({ limit: 100 }),
            getAllBuildingsService({ limit: 5 }),
        ]);

        const buildingData = bldResult.data
            .map(bld => `Tòa nhà: ${bld.branch_name || "N/A"}, Địa chỉ: ${(bld as { address?: string; address_new?: string }).address || (bld as { address?: string; address_new?: string }).address_new || "N/A"}`)
            .join("\n");

        const apartmentData = aptResult.data
            .filter((apt) => ["available", "vacant", "AVAILABLE"].includes(apt.status || ""))
            .map((apt) => {
                const building = bldResult.data.find((b) => b.id === apt.building_id);
                return `[Căn ${apt.room_number}] Tầng ${apt.floor}, ${apt.bedrooms}PN, ${apt.area}m², ${Number(apt.rental_price).toLocaleString("vi-VN")} VNĐ. (Thuộc: ${building?.branch_name || "Tòa nhà chính"})`;
            })
            .join("\n");

        const prompt = `${SYSTEM_PROMPT}
        DỮ LIỆU TÒA NHÀ: ${buildingData}
        DỮ LIỆU CĂN HỘ TRỐNG: ${apartmentData || "Hiện không có căn hộ nào trống."}
        KHÁCH HÀNG HỎI: "${userMessage}"
        LƯU Ý: Nếu khách hỏi về địa điểm (Quận, Đường), hãy đối chiếu với 'DỮ LIỆU TÒA NHÀ' để đưa ra kết quả chính xác nhất.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        return {
            reply: response.text?.trim() || "Xin lỗi, tôi chưa thể trả lời lúc này.",
        };
    } catch (error) {
        console.error("Error:", error);
        throw error;
    }
};