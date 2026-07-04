import { FileText, Star } from "lucide-react";
import Badge from "../../../components/ui/Badge";
import SearchInput from "../../../components/ui/SearchInput";
import PageHeader from "../../../components/PageHeader";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import { useDebounce } from "../../../hooks/common/useDebounce";
import { useTenantContracts } from "../../../hooks/tenant/useTenantContracts";
import { formatCurrency, numberToVietnameseWords } from "../../../utils/currency";
import { formatDate } from "../../../utils/date";
import { formatApartmentDisplay, removeVietnameseTones } from "../../../utils/string";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../../components/ui/Table";

export default function MyContracts() {
  const {
    search,
    setSearch,
    viewContractDoc,
    setViewContractDoc,
    reviewContractItem,
    setReviewContractItem,
    rating,
    setRating,
    comment,
    setComment,
    buildings,
    apartments,
    myContracts,
    submittingReview,
    submitReview,
    isLoading,
  } = useTenantContracts();

  const debouncedSearch = useDebounce(search, 300);

  const filtered = myContracts.filter((c) => {
    const term = removeVietnameseTones(debouncedSearch);
    const code = `HD-${String(c.id).padStart(5, "0")}`;
    const apt = apartments.find((a) => a.id === c.apartment_id);
    const room = apt ? apt.room_number : "";
    return removeVietnameseTones(code).includes(term) || removeVietnameseTones(room).includes(term);
  });

  function getStatusBadge(status: string) {
    if (status === "ACTIVE") return <Badge variant="success">Hiệu lực</Badge>;
    if (status === "ENDED") return <Badge variant="gray">Đã kết thúc</Badge>;
    return <Badge variant="danger">Thanh lý</Badge>;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner size={32} />
        <span className="text-sm text-gray-400 mt-2 font-sans">Đang tải danh sách hợp đồng...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FileText}
        title="Hợp đồng của tôi"
        subtitle="Xem các hợp đồng thuê căn hộ của bạn"
        count={filtered.length}
        iconColor="linear-gradient(135deg, #10B981, #34D399)"
      />

      <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo mã hợp đồng hoặc số phòng..." className="max-w-md" />

      <div className="border border-gray-200 bg-white rounded-none shadow-xl overflow-x-auto mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã hợp đồng</TableHead>
              <TableHead>Căn hộ</TableHead>
              <TableHead>Bắt đầu</TableHead>
              <TableHead>Kết thúc</TableHead>
              <TableHead className="text-right">Tiền thuê/tháng</TableHead>
              <TableHead className="text-right">Tiền cọc</TableHead>
              <TableHead className="text-center">Trạng thái</TableHead>
              <TableHead className="text-right">Chức năng</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => {
              const apt = apartments.find((a) => a.id === c.apartment_id);
              const bld = apt ? buildings.find((b) => b.id === apt.building_id) : null;
              const code = `HD-${String(c.id).padStart(5, "0")}`;

              return (
                <TableRow key={c.id}>
                  <TableCell className="font-semibold text-gray-800 whitespace-nowrap">
                    {code}
                  </TableCell>
                  <TableCell className="font-medium text-gray-800 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span>P.{apt?.room_number || "Chưa rõ"}</span>
                      <span className="text-xs text-gray-400 font-normal">{bld?.branch_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600 whitespace-nowrap">
                    {formatDate(c.start_date)}
                  </TableCell>
                  <TableCell className="text-gray-600 whitespace-nowrap">
                    {formatDate(c.end_date)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-gray-800 whitespace-nowrap">
                    {formatCurrency(c.monthly_rent)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-gray-800 whitespace-nowrap">
                    {formatCurrency(c.deposit_amount)}
                  </TableCell>
                  <TableCell className="text-center whitespace-nowrap">
                    {getStatusBadge(c.status)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setViewContractDoc(c)}
                        className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer transition-colors"
                        title="Xem hợp đồng"
                      >
                        <FileText size={16} />
                      </button>
                      {c.status === "ENDED" && (
                        <button
                          type="button"
                          onClick={() => setReviewContractItem(c)}
                          className="p-2 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 cursor-pointer transition-colors"
                          title="Đánh giá"
                        >
                          <Star size={16} />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {filtered.length === 0 && (
          <div className="p-8 text-center text-gray-400 bg-white border-t border-gray-100">
            Không tìm thấy hợp đồng nào.
          </div>
        )}
      </div>

      <Modal
        isOpen={!!viewContractDoc}
        onClose={() => setViewContractDoc(null)}
        title="Xem hợp đồng thuê căn hộ"
        size="lg"
        footer={
          <div className="flex justify-between w-full">
            <Button
              variant="outline"
              onClick={() => {
                const printContent = document.getElementById("printable-contract-area");
                if (printContent) {
                  const style = document.createElement("style");
                  style.innerHTML = `
                    @media print {
                      body * {
                        visibility: hidden !important;
                      }
                      #printable-contract-area, #printable-contract-area * {
                        visibility: visible !important;
                      }
                      #printable-contract-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: white;
                        color: black;
                      }
                    }
                  `;
                  document.head.appendChild(style);
                  window.print();
                  document.head.removeChild(style);
                }
              }}
            >
              In hợp đồng
            </Button>
            <Button onClick={() => setViewContractDoc(null)}>Đóng</Button>
          </div>
        }
      >
        {viewContractDoc && (() => {
          const tenant = viewContractDoc.tenant;
          const apt = apartments.find((a) => a.id === viewContractDoc.apartment_id);
          const bld = apt ? buildings.find((b) => b.id === apt.building_id) : null;

          const maxOcc = viewContractDoc.max_occupants || (apt ? Math.max(2, apt.bedrooms * 2) : 2);
          const actOcc = viewContractDoc.actual_occupants || 1;
          const excess = actOcc > maxOcc ? actOcc - maxOcc : 0;
          const excessSurcharge = excess * 1000000;
          const baseRent = apt ? apt.rental_price : viewContractDoc.monthly_rent - excessSurcharge;

          const durationYears = (() => {
            if (!viewContractDoc.start_date || !viewContractDoc.end_date) return 1;
            const diffMs = new Date(viewContractDoc.end_date).getTime() - new Date(viewContractDoc.start_date).getTime();
            const years = diffMs / (1000 * 60 * 60 * 24 * 365.25);
            return Math.max(1, Math.round(years * 10) / 10);
          })();

          const signedDate = new Date(viewContractDoc.signedAt || viewContractDoc.created_at || Date.now());

          return (
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
                    Số: HD-{String(viewContractDoc.id).padStart(5, "0")}
                  </p>
                </div>

                {/* Phần nội dung */}
                <div className="space-y-4 font-sans text-xs sm:text-sm">
                  <p>
                    Hôm nay, ngày {signedDate.getDate()} tháng {signedDate.getMonth() + 1} năm {signedDate.getFullYear()}, tại {bld?.address_new || bld?.address_old || "văn phòng đại diện Yuki House"}, chúng tôi gồm có:
                  </p>

                  {/* Bên A */}
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900 uppercase">BÊN CHO THUÊ (Sau đây gọi tắt là Bên A)</p>
                    <div className="pl-4 space-y-1 text-xs text-gray-700">
                      <p>Ông/bà: <span className="font-semibold text-gray-800">BAN QUẢN LÝ CĂN HỘ DỊCH VỤ YUKI HOUSE (Đại diện)</span></p>
                      <p>Số CMND/CCCD/Mã số thuế: 079200000001</p>
                      <p>Địa chỉ: {bld?.address_new || bld?.address_old || "Hệ thống tòa nhà Yuki House"}</p>
                      <p>Điện thoại: {(bld as any)?.phone || "0901000001"}</p>
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
                        <p>- Địa chỉ căn hộ: {bld?.address_new || bld?.address_old || "Chưa xác định"}</p>
                        <p>- Căn hộ số: {apt?.room_number || "..."} - Tầng số: {apt?.floor || "..."}</p>
                        <p>- Tổng diện tích sàn căn hộ là: {apt?.area || "..."} m2.</p>
                        <p>- Đặc điểm: 1 phòng khách, {apt?.bedrooms || 1} phòng ngủ, {apt?.bathrooms || 1} WC.</p>
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
                        <span className="font-semibold">{durationYears} năm</span> (từ ngày{" "}
                        <span className="font-semibold">{formatDate(viewContractDoc.start_date)}</span> đến ngày{" "}
                        <span className="font-semibold">{formatDate(viewContractDoc.end_date)}</span>).
                      </p>
                    </div>
                  </div>

                  {/* Điều 3 */}
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900 text-xs sm:text-sm">ĐIỀU 3: GIÁ THUÊ, PHƯƠNG THỨC VÀ THỜI HẠN THANH TOÁN</p>
                    <div className="pl-4 space-y-1 text-xs text-gray-700">
                      <p>
                        3.1. Giá thuê căn hộ chung cư nêu tại Điều 1 Hợp đồng là:{" "}
                        <span className="font-semibold text-primary-700">{formatCurrency(viewContractDoc.monthly_rent)}/tháng</span>
                        {" "}(Bằng chữ: <span className="font-semibold italic text-gray-800">{numberToVietnameseWords(viewContractDoc.monthly_rent)} đồng chẵn / tháng</span>).
                      </p>
                      <p>Tiền thuê được giữ cố định trong suốt thời hạn thuê.</p>
                      {excess > 0 && (
                        <p className="text-amber-600 font-semibold italic text-[11px] pl-4">
                          (* Ghi chú: Giá thuê bao gồm đơn giá cơ bản {formatCurrency(baseRent)}/tháng và phụ thu {formatCurrency(excessSurcharge)}/tháng do quá số lượng người ở quy định).
                        </p>
                      )}
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
                        <span className="font-semibold text-primary-700">{formatCurrency(viewContractDoc.deposit_amount)}</span>{" "}
                        Đồng (tương đương với {Math.round(viewContractDoc.deposit_amount / viewContractDoc.monthly_rent) || 1} tháng tiền thuê căn hộ).
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
                      <p>11.3. Hợp đồng có hiệu lực từ: {formatDate(viewContractDoc.start_date)}</p>
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
          );
        })()}
      </Modal>

      {/* Review Modal */}
      <Modal
        isOpen={!!reviewContractItem}
        onClose={() => setReviewContractItem(null)}
        title="Đánh giá căn hộ"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setReviewContractItem(null)}>
              Hủy
            </Button>
            <Button
              isLoading={submittingReview}
              onClick={() => {
                if (!reviewContractItem) return;
                submitReview(reviewContractItem.apartment_id);
              }}
            >
              Gửi đánh giá
            </Button>
          </>
        }
      >
        {reviewContractItem && (
          <div className="space-y-4 font-sans text-xs sm:text-sm">
            <p className="text-gray-500">
              Hãy chia sẻ trải nghiệm của bạn tại căn hộ này sau khi kết thúc hợp đồng thuê.
            </p>

            <div className="flex flex-col items-center gap-2 py-4">
              <span className="text-sm font-semibold text-gray-700">Điểm đánh giá:</span>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110 cursor-pointer"
                  >
                    <Star
                      size={32}
                      className={
                        star <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"
                      }
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs text-amber-600 font-bold mt-1">
                {rating === 5
                  ? "Tuyệt vời (5/5)"
                  : rating === 4
                    ? "Tốt (4/5)"
                    : rating === 3
                      ? "Bình thường (3/5)"
                      : rating === 2
                        ? "Tạm được (2/5)"
                        : "Kém (1/5)"}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-gray-700">Ý kiến nhận xét:</label>
              <textarea
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Nhập nội dung nhận xét của bạn về căn hộ, dịch vụ, quản lý..."
                className="premium-input rounded-xl resize-none text-xs"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
