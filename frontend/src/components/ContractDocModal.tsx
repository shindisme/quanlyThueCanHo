import Modal from "./ui/Modal";
import Button from "./ui/Button";
import type { RentalContract, Tenant, Building, Apartment } from "../types";
import type { User as UserType } from "../types/user";
import { formatCurrency, numberToVietnameseWords } from "../utils/currency";
import { formatDate } from "../utils/date";
import { formatApartmentDisplay } from "../utils/string";
import { printContractHelper } from "../utils/print";
import {
  getContractDurationText,
  getContractOccupancyPricing,
  getContractSignedDate,
} from "../utils/contractDocument";

export interface ContractDocModalProps {
  isOpen?: boolean;
  onClose: () => void;
  contract: RentalContract | null;
  buildings?: Building[];
  apartments?: Apartment[];
  tenants?: Tenant[];
  users?: UserType[];
  role?: string | null;
}

export default function ContractDocModal({
  isOpen,
  onClose,
  contract,
  buildings,
  apartments,
  tenants,
}: ContractDocModalProps) {
  if (!contract) return null;

  const tenant =
    (tenants && contract.tenant_id ? tenants.find((t) => t.id === contract.tenant_id) : null) ||
    contract.tenant;

  const apt =
    (apartments && contract.apartment_id
      ? apartments.find((a) => a.id === contract.apartment_id)
      : null) || contract.apartment;

  const bld =
    (apt && apt.building_id && buildings ? buildings.find((b) => b.id === apt.building_id) : null) ||
    apt?.building;

  const {
    maxOccupants: maxOcc,
    actualOccupants: actOcc,
    excessOccupants: excess,
    excessSurcharge,
    baseRent,
  } = getContractOccupancyPricing(contract, apt);
  const durationText = getContractDurationText(contract.start_date, contract.end_date);
  const signedDate = getContractSignedDate(contract);

  const handlePrint = () => {
    const enrichedContract: RentalContract = {
      ...contract,
      tenant: tenant || contract.tenant,
      apartment: apt ? { ...apt, building: bld || apt.building } : contract.apartment,
    };
    printContractHelper(enrichedContract);
  };

  return (
    <Modal
      isOpen={isOpen !== undefined ? isOpen : !!contract}
      onClose={onClose}
      title="Văn bản hợp đồng pháp lý"
      size="lg"
      footer={
        <div className="flex justify-between w-full font-sans">
          <Button variant="outline" onClick={handlePrint}>
            In hợp đồng
          </Button>
          <Button onClick={onClose}>Đóng</Button>
        </div>
      }
    >
      <div className="bg-gray-50 p-4 sm:p-8 rounded-2xl overflow-y-auto max-h-[70vh] border border-gray-200">
        <div
          id="printable-contract-area"
          className="bg-white p-6 sm:p-10 shadow-sm border border-gray-150 rounded-lg text-gray-800 leading-relaxed text-sm"
          style={{ minHeight: "297mm", fontFamily: '"Times New Roman", Times, serif' }}
        >
          {/* Tiêu ngữ */}
          <div className="text-center space-y-1 mb-6">
            <h4 className="font-bold uppercase tracking-wider text-xs sm:text-sm">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </h4>
            <p className="font-semibold text-xs sm:text-sm">Độc lập – Tự do – Hạnh phúc</p>
            <div className="w-40 h-px bg-gray-400 mx-auto mt-2"></div>
          </div>

          {/* Tên hợp đồng */}
          <div className="text-center space-y-1 mb-6">
            <h2 className="text-base sm:text-lg font-bold uppercase">
              HỢP ĐỒNG THUÊ CĂN HỘ CHUNG CƯ
            </h2>
            <p className="text-xs text-gray-500 font-sans italic">
              Số: HD-{String(contract.id).padStart(5, "0")}
            </p>
          </div>

          {/* Phần nội dung */}
          <div className="space-y-4 font-sans text-xs sm:text-sm">
            <p>
              Hôm nay, ngày {signedDate.getDate()} tháng {signedDate.getMonth() + 1} năm {signedDate.getFullYear()}, tại {bld?.address || "văn phòng đại diện Yuki House"}, chúng tôi gồm có:
            </p>

            {/* Bên A */}
            <div className="space-y-1">
              <p className="font-semibold text-gray-900 uppercase">BÊN CHO THUÊ (Sau đây gọi tắt là Bên A)</p>
              <div className="pl-4 space-y-1 text-xs text-gray-700">
                <p>Ông/bà: <span className="font-semibold text-gray-800">BAN QUẢN LÝ CĂN HỘ DỊCH VỤ YUKI HOUSE (Đại diện)</span></p>
                <p>Số CMND/CCCD/Mã số thuế: 079200000001</p>
                <p>Địa chỉ: {bld?.address || "Hệ thống tòa nhà Yuki House"}</p>
                <p>Điện thoại: {(bld as unknown as { phone?: string })?.phone || "0901000001"}</p>
                <p>
                  Là chủ cho thuê hợp pháp căn hộ chung cư số:{" "}
                  <span className="font-semibold text-gray-800">
                    {apt ? formatApartmentDisplay(apt.room_number, apt.floor, "TENANT", bld?.branch_name) : "-"}
                  </span>{" "}
                  tại {bld?.name || "Tòa nhà Yuki House"}
                </p>
              </div>
            </div>

            {/* Bên B */}
            <div className="space-y-1">
              <p className="font-semibold text-gray-900 uppercase">BÊN THUÊ (Sau đây gọi tắt là Bên B)</p>
              <div className="pl-4 space-y-1 text-xs text-gray-700">
                <p>Ông/bà: <span className="font-semibold text-gray-800">{tenant?.full_name || "CHƯA XÁC ĐỊNH"}</span></p>
                <p>Số CMND/CCCD: {tenant?.citizen_id || "Chưa cập nhật"}</p>
                <p>Địa chỉ: {tenant?.address || "Chưa cập nhật"}</p>
                <p>Số điện thoại: {tenant?.phone || "Chưa cập nhật"}</p>
              </div>
            </div>

            <p className="italic text-gray-650">Sau khi bàn bạc hai Bên thống nhất ký Hợp đồng cho thuê căn hộ chung cư (sau đây viết tắt là Hợp đồng) với nội dung sau:</p>

            {/* Điều 1 */}
            <div className="space-y-1">
              <p className="font-semibold text-gray-900 text-xs sm:text-sm">ĐIỀU 1: ĐỐI TƯỢNG VÀ NỘI DUNG CỦA HỢP ĐỒNG</p>
              <div className="pl-4 space-y-1 text-xs text-gray-700">
                <p>1.1. Bên A cho Bên B thuê và Bên B đồng ý thuê căn hộ chung cư có thông tin như sau:</p>
                <div className="pl-4 space-y-0.5">
                  <p>- Địa chỉ căn hộ: {bld?.address || "Chưa xác định"}</p>
                  <p>- Căn hộ số: {apt?.room_number || "..."} - Tầng số: {apt?.floor || "..."}</p>
                  <p>- Tổng diện tích sàn căn hộ là: {apt?.area || "..."} m².</p>
                  <p>- Đặc điểm: 1 phòng khách, ${apt?.bedrooms || 1} phòng ngủ, ${apt?.bathrooms || 1} WC.</p>
                  <p>- Trang thiết bị gắn liền với căn hộ: Bàn giao đầy đủ trang thiết bị theo biên bản bàn giao kèm theo hợp đồng.</p>
                  <p>- Những hạn chế về quyền sở hữu căn hộ (nếu có): Không có.</p>
                </div>
                <p>1.2. Mục đích thuê: Bên B thuê căn hộ của Bên A để sử dụng vào mục đích: Để ở sinh hoạt gia đình (Số lượng người ở tối đa cho phép: {maxOcc} người, thực tế đăng ký: {actOcc} người).</p>
              </div>
            </div>

            {/* Điều 2 */}
            <div className="space-y-1">
              <p className="font-semibold text-gray-900 text-xs sm:text-sm">ĐIỀU 2: THỜI HẠN THUÊ CĂN HỘ CHUNG CƯ</p>
              <div className="pl-4 text-xs text-gray-700">
                <p>
                  Thời hạn thuê căn hộ chung cư nêu tại Điều 1 Hợp đồng là:{" "}
                  <span className="font-semibold">{durationText}</span> (từ ngày{" "}
                  <span className="font-semibold">{formatDate(contract.start_date)}</span> đến ngày{" "}
                  <span className="font-semibold">{formatDate(contract.end_date)}</span>).
                </p>
              </div>
            </div>

            {/* Điều 3 */}
            <div className="space-y-1">
              <p className="font-semibold text-gray-900 text-xs sm:text-sm">ĐIỀU 3: GIÁ THUÊ, PHƯƠNG THỨC VÀ THỜI HẠN THANH TOÁN</p>
              <div className="pl-4 space-y-1 text-xs text-gray-700">
                <p>
                  3.1. Giá thuê căn hộ chung cư nêu tại Điều 1 Hợp đồng là:{" "}
                  <span className="font-semibold text-primary-700">{formatCurrency(contract.monthly_rent)}/tháng</span>
                  {" "}(Bằng chữ: <span className="font-semibold italic text-gray-800">{numberToVietnameseWords(contract.monthly_rent)} đồng chẵn / tháng</span>).
                </p>
                <p>Tiền thuê được giữ cố định trong suốt thời hạn thuê.</p>
                ${excess > 0 ? (
                  <p className="text-amber-600 font-semibold italic text-[11px] pl-4">
                    (* Ghi chú: Giá thuê bao gồm đơn giá cơ bản {formatCurrency(baseRent)}/tháng và phụ thu {formatCurrency(excessSurcharge)}/tháng do quá số lượng người ở quy định).
                  </p>
                ) : null}
                <p>3.2. Giá cho thuê này đã bao gồm chi phí bảo trì, quản lý vận hành nhà ở và chưa bao gồm các khoản thuế mà Bên A phải nộp cho Nhà nước theo quy định.</p>
                <p>3.3. Chi phí sử dụng điện, nước, điện thoại và các dịch vụ khác do Bên B thanh toán cho Bên cung cấp điện, nước, điện thoại và các cơ quan cung cấp dịch vụ khác.</p>
                <p>3.4. Phương thức thanh toán như sau:</p>
                <div className="pl-4 space-y-0.5">
                  <p>- Việc thanh toán tiền thuê căn hộ được thực hiện theo kỳ 01 tháng một lần và thanh toán trong vòng 05 ngày đầu tiên của mỗi đợt thanh toán.</p>
                  <p>- Việc thanh toán được thực hiện bằng hình thức chuyển khoản hoặc tiền mặt.</p>
                </div>
                <p>3.5. Các thoả thuận khác: Không có.</p>
              </div>
            </div>

            {/* Điều 4 */}
            <div className="space-y-1">
              <p className="font-semibold text-gray-900 text-xs sm:text-sm">ĐIỀU 4: ĐẶT CỌC</p>
              <div className="pl-4 space-y-1 text-xs text-gray-700">
                <p>
                  Bên B đặt cọc cho Bên A số tiền là:{" "}
                  <span className="font-semibold text-primary-700">{formatCurrency(contract.deposit_amount)}</span>{" "}
                  Đồng (tương đương với {Math.round(contract.deposit_amount / contract.monthly_rent) || 1} tháng tiền thuê căn hộ).
                </p>
                <p>Tiền đặt cọc được thanh toán trong thời hạn 03 ngày kể từ ngày ký Hợp đồng.</p>
                <p>Tiền đặt cọc được Bên A giữ trong suốt thời hạn thuê và không phải trả lãi cho Bên B. Bên B không có quyền yêu cầu Bên A trừ tiền thuê vào tiền đặt cọc.</p>
              </div>
            </div>

            {/* Điều 5 */}
            <div className="space-y-1">
              <p className="font-semibold text-gray-900 text-xs sm:text-sm">ĐIỀU 5: CHO THUÊ LẠI CĂN HỘ CHUNG CƯ</p>
              <div className="pl-4 text-xs text-gray-700">
                <p>Bên B không có quyền cho thuê lại căn hộ, trừ trường hợp được sự đồng ý của Bên A bằng văn bản.</p>
              </div>
            </div>

            {/* Điều 6 */}
            <div className="space-y-1">
              <p className="font-semibold text-gray-900 text-xs sm:text-sm">ĐIỀU 6: QUYỀN VÀ NGHĨA VỤ CỦA BÊN A</p>
              <div className="pl-4 space-y-1 text-xs text-gray-700">
                <p><span className="font-medium">6.1. Quyền của Bên A:</span></p>
                <div className="pl-4 space-y-0.5 text-gray-650">
                  <p>– Nhận đúng và đầy đủ tiền thuê từ Bên B như quy định tại Điều 3 Hợp đồng;</p>
                  <p>– Yêu cầu Bên B sửa chữa các hư hỏng và bồi thường thiệt hại do lỗi của Bên B gây ra;</p>
                  <p>– Đơn phương chấm dứt thực hiện hợp đồng thuê khi Bên B có một trong các hành vi sau đây:</p>
                  <div className="pl-4">
                    <p>+ Không trả tiền thuê căn hộ liên tiếp trong 02 tháng trở lên;</p>
                    <p>+ Sử dụng căn hộ không đúng mục đích như đã thoả thuận;</p>
                    <p>+ Cố ý làm hư hỏng căn hộ, tài sản cho thuê;</p>
                    <p>+ Sửa chữa, cải tạo, đổi căn hộ đang thuê hoặc cho người khác thuê lại căn hộ đang thuê mà không có sự đồng ý của Bên A;</p>
                  </div>
                  <p>– Yêu cầu Bên B bàn giao lại căn hộ khi chấm dứt Hợp đồng theo quy định;</p>
                  <p>– Đơn phương chấm dứt thực hiện Hợp đồng. Trong trường hợp này, Bên A phải thông báo cho Bên B biết trước ít nhất 01 tháng.</p>
                </div>
                <p><span className="font-medium">6.2. Nghĩa vụ của Bên A:</span></p>
                <div className="pl-4 space-y-0.5 text-gray-650">
                  <p>– Bàn giao căn hộ và trang thiết bị như thỏa thuận tại Điều 1 Hợp đồng;</p>
                  <p>– Bảo đảm cho Bên B sử dụng ổn định căn hộ trong thời hạn thuê;</p>
                  <p>– Kê khai và đóng các loại thuế theo quy định của pháp luật.</p>
                </div>
              </div>
            </div>

            {/* Điều 7 */}
            <div className="space-y-1">
              <p className="font-semibold text-gray-900 text-xs sm:text-sm">ĐIỀU 7: QUYỀN VÀ NGHĨA VỤ CỦA BÊN B</p>
              <div className="pl-4 space-y-1 text-xs text-gray-700">
                <p><span className="font-medium">7.1. Quyền của Bên B:</span></p>
                <div className="pl-4 space-y-0.5 text-gray-650">
                  <p>– Nhận bàn giao căn hộ và trang thiết bị như thỏa thuận tại Điều 1 Hợp đồng;</p>
                  <p>– Bên B có quyền đơn phương chấm dứt thực hiện Hợp đồng khi Bên A tăng giá thuê bất hợp lý hoặc khi quyền sử dụng căn hộ bị hạn chế do lợi ích của người thứ ba. Trong trường hợp này, Bên B phải thông báo cho Bên A biết trước ít nhất 01 tháng.</p>
                  <p>– Đơn phương chấm dứt thực hiện hợp đồng thuê căn hộ. Trong trường hợp này, Bên B phải thông báo cho Bên A biết trước ít nhất 01 tháng.</p>
                </div>
                <p><span className="font-medium">7.2. Nghĩa vụ của Bên B:</span></p>
                <div className="pl-4 space-y-0.5 text-gray-650">
                  <p>– Trả đủ tiền thuê căn hộ theo đúng thời hạn đã cam kết trong Hợp đồng;</p>
                  <p>– Sử dụng căn hộ đúng mục đích; có trách nhiệm sửa chữa phần hư hỏng do mình gây ra;</p>
                  <p>– Chấp hành đầy đủ các quy định về quản lý sử dụng căn hộ và nội quy chung của chung cư;</p>
                  <p>– Chấp hành các quy định về giữ gìn vệ sinh môi trường và an ninh trật tự trong khu vực.</p>
                </div>
              </div>
            </div>

            {/* Điều 8 */}
            <div className="space-y-1">
              <p className="font-semibold text-gray-900 text-xs sm:text-sm">ĐIỀU 8: CHẤM DỨT HỢP ĐỒNG THUÊ CĂN HỘ CHUNG CƯ</p>
              <div className="pl-4 space-y-1 text-xs text-gray-700">
                <p>8.1 Hợp đồng chấm dứt khi xảy ra một trong các trường hợp sau:</p>
                <div className="pl-4">
                  <p>– Hết thời hạn thuê mà các bên không tiếp tục gia hạn;</p>
                  <p>– Các Bên thỏa thuận chấm dứt hợp đồng trước thời hạn;</p>
                  <p>– Căn hộ cho thuê hư hỏng nặng có nguy cơ sập đổ hoặc nằm trong khu vực đã có quyết định thu hồi đất, giải phóng mặt bằng hoặc có quyết định phá dỡ của cơ quan nhà nước có thẩm quyền;</p>
                  <p>– Bên B chết mà không có người đang cùng sinh sống;</p>
                  <p>– Khi một trong hai Bên đơn phương chấm dứt hợp đồng theo quy định của Hợp đồng.</p>
                </div>
                <p>8.2 Hậu quả pháp lý khi hợp đồng chấm dứt:</p>
                <p className="pl-4 italic text-gray-600">
                  Khi hợp đồng chấm dứt theo đúng thời hạn hoặc theo thỏa thuận, Bên B bàn giao lại căn hộ và toàn bộ trang thiết bị nguyên trạng (trừ hao mòn tự nhiên). Bên A hoàn trả lại toàn bộ tiền đặt cọc cho Bên B sau khi đã khấu trừ các chi phí sử dụng điện, nước, dịch vụ còn chưa thanh toán hoặc các thiệt hại hư hỏng do lỗi Bên B gây ra. Trường hợp Bên B đơn phương chấm dứt hợp đồng trái quy định sẽ không được nhận lại tiền đặt cọc. Trường hợp Bên A đơn phương chấm dứt hợp đồng trái quy định sẽ phải hoàn trả tiền đặt cọc và bồi thường cho Bên B một khoản tiền tương đương tiền đặt cọc.
                </p>
              </div>
            </div>

            {/* Điều 9 */}
            <div className="space-y-1">
              <p className="font-semibold text-gray-900 text-xs sm:text-sm">ĐIỀU 9: PHƯƠNG THỨC GIẢI QUYẾT TRANH CHẤP</p>
              <div className="pl-4 text-xs text-gray-700">
                <p>Trong quá trình thực hiện Hợp đồng mà phát sinh tranh chấp, các Bên cùng nhau thương lượng giải quyết trên nguyên tắc tôn trọng quyền lợi của nhau; trong trường hợp không giải quyết được, một trong hai Bên có quyền khởi kiện để yêu cầu toà án có thẩm quyền giải quyết theo quy định của pháp luật.</p>
              </div>
            </div>

            {/* Điều 10 */}
            <div className="space-y-1">
              <p className="font-semibold text-gray-900 text-xs sm:text-sm">ĐIỀU 10: CAM KẾT CỦA CÁC BÊN</p>
              <div className="pl-4 text-xs text-gray-700 space-y-1">
                <p>10.1. Bên A cam kết: Căn hộ cho thuê thuộc quyền sở hữu hợp pháp của mình, không có tranh chấp về quyền sở hữu, không bị kê biên để thi hành án hoặc để chấp hành quyết định hành chính của cơ quan nhà nước có thẩm quyền; Những thông tin về nhân thân, về căn hộ cho thuê ghi trong Hợp đồng này là đúng sự thật.</p>
                <p>10.2. Bên B cam kết: Đã tìm hiểu kỹ các thông tin về căn hộ thuê; Những thông tin về nhân thân ghi trong Hợp đồng này là đúng sự thật.</p>
                <p>10.3. Các Bên cùng cam kết việc ký kết hợp đồng này giữa các Bên là hoàn toàn tự nguyện, không bị ép buộc, lừa dối. Trong quá trình thực hiện hợp đồng, nếu cần thay đổi hoặc bổ sung nội dung của hợp đồng này thì các Bên thỏa thuận lập thêm phụ lục hợp đồng có chữ ký của hai bên.</p>
                <p>10.4. Các Bên cùng cam kết thực hiện đúng và đầy đủ các nội dung đã thỏa thuận trong Hợp đồng.</p>
              </div>
            </div>

            {/* Điều 11 */}
            <div className="space-y-1">
              <p className="font-semibold text-gray-900 text-xs sm:text-sm">ĐIỀU 11: ĐIỀU KHOẢN CUỐI CÙNG</p>
              <div className="pl-4 text-xs text-gray-700 space-y-1">
                <p>11.1. Hai Bên công nhận đã hiểu rõ quyền, nghĩa vụ và lợi ích hợp pháp của mình, ý nghĩa và hậu quả pháp lý của việc giao kết Hợp đồng;</p>
                <p>11.2. Hai Bên đã tự đọc Hợp đồng, đã hiểu và đồng ý tất cả các điều khoản ghi trong Hợp đồng;</p>
                <p>11.3. Hợp đồng có hiệu lực từ: {formatDate(contract.start_date)}</p>
              </div>
            </div>

            {/* Ký tên */}
            <div className="grid grid-cols-2 gap-4 pt-8 text-center font-semibold text-xs sm:text-sm">
              <div>
                <p className="uppercase text-gray-900">BÊN CHO THUÊ (BÊN A)</p>
                <p className="text-[10px] text-gray-400 font-normal italic mt-1">(Ký và ghi rõ họ tên)</p>
                <div className="h-20"></div>
                <p className="font-bold text-gray-650">YUKI HOUSE</p>
              </div>
              <div>
                <p className="uppercase text-gray-900">BÊN THUÊ (BÊN B)</p>
                <p className="text-[10px] text-gray-400 font-normal italic mt-1">(Ký và ghi rõ họ tên)</p>
                <div className="h-20"></div>
                <p className="font-bold text-gray-700">{tenant?.full_name || "Bên thuê"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
