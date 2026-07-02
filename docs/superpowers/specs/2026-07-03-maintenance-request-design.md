# Thiết kế chức năng yêu cầu sửa chữa

## Phạm vi

Chỉ triển khai backend. Chức năng cho phép:

- Cư dân gửi và xem yêu cầu sửa chữa của mình.
- Cư dân hủy yêu cầu khi quản lý chưa xác nhận.
- Quản lý xem yêu cầu trong tòa nhà, đặt lịch và giao một nhân viên kỹ thuật.
- Nhân viên được giao xác nhận hoàn tất hoặc báo chưa thể sửa kèm lý do.
- Hệ thống gửi thông báo lịch sửa, hoãn sửa và hoàn tất vào tài khoản cư dân.

Không triển khai giao diện, lịch sử nhiều lần sửa riêng, tệp đính kèm mới hoặc cơ chế nhắc lịch tự động.

## Mô hình dữ liệu

Mở rộng `MaintenanceRequest` hiện có:

- `assigned_staff_id Int?`: nhân viên kỹ thuật được giao.
- `scheduled_at DateTime?`: lịch sửa do quản lý xác nhận.
- `unable_reason String?`: lý do gần nhất khiến kỹ thuật chưa thể sửa.

`assigned_staff_id` tham chiếu `Staff` và được đặt `NULL` nếu nhân viên bị xóa để giữ lại yêu cầu. Thêm chỉ mục trên `assigned_staff_id` và `status` để phục vụ danh sách công việc của kỹ thuật.

Mở rộng `RequestStatus`:

- `PENDING`: cư dân vừa gửi, chưa được quản lý xác nhận.
- `PROCESSING`: đã có lịch và kỹ thuật phụ trách.
- `NEEDS_RESCHEDULE`: kỹ thuật báo chưa thể sửa, chờ quản lý đặt lịch lại.
- `DONE`: đã sửa xong.
- `CANCELLED`: cư dân đã hủy trước khi quản lý xác nhận.

Các chuyển trạng thái hợp lệ:

```text
PENDING ──manager confirm──> PROCESSING ──staff complete──> DONE
   │                              │
   └──tenant cancel──> CANCELLED  └──staff unable──> NEEDS_RESCHEDULE
                                                   │
                                                   └──manager confirm──> PROCESSING
```

Khi quản lý đặt lịch lại, `unable_reason` được xóa. Lý do cũ vẫn tồn tại trong thông báo đã gửi.

## Phân quyền và phạm vi dữ liệu

- `TENANT`: chỉ xem, tạo và hủy yêu cầu của chính mình. Căn hộ gửi yêu cầu phải có hợp đồng `ACTIVE` với cư dân.
- `MANAGER`: chỉ xem và xác nhận yêu cầu thuộc tòa nhà đang được phân công.
- `STAFF`: chỉ xem và cập nhật yêu cầu được giao cho chính mình.
- `ADMIN`: xem và xử lý mọi yêu cầu.

Nhân viên được giao phải:

- Có tài khoản đang hoạt động với vai trò `STAFF`.
- Có chức vụ chính xác là `Kỹ thuật`.
- Thuộc cùng tòa nhà với căn hộ cần sửa.

Chỉ nhân viên được giao mới được báo chưa thể sửa hoặc xác nhận hoàn tất.

## API

Tất cả endpoint yêu cầu xác thực.

### Xem yêu cầu

- `GET /maintenance`
  - Phân trang bằng `page`, `limit`.
  - Lọc tùy chọn theo `status`, `priority`.
  - `ADMIN` có thể lọc thêm `building_id`.
  - Kết quả luôn bị giới hạn theo vai trò.
- `GET /maintenance/:id`
  - Trả về yêu cầu nếu người gọi nằm trong phạm vi cho phép.

### Cư dân

- `POST /maintenance`
  - Body: `apartment_id`, `title`, `description`, `priority`, `image_url?`.
  - Tạo yêu cầu ở trạng thái `PENDING`.
- `PUT /maintenance/:id/cancel`
  - Chỉ chủ yêu cầu được gọi khi trạng thái là `PENDING`.
  - Chuyển sang `CANCELLED`.

### Quản lý hoặc admin

- `PUT /maintenance/:id/confirm`
  - Body: `assigned_staff_id`, `scheduled_at`.
  - `scheduled_at` phải là thời điểm trong tương lai.
  - Chỉ chấp nhận yêu cầu `PENDING` hoặc `NEEDS_RESCHEDULE`.
  - Chuyển sang `PROCESSING`, lưu lịch và kỹ thuật, xóa `unable_reason`.
  - Tạo thông báo lịch sửa cho tài khoản cư dân trong cùng giao dịch.

### Nhân viên kỹ thuật được giao

- `PUT /maintenance/:id/unable`
  - Body: `reason`.
  - Chỉ chấp nhận yêu cầu `PROCESSING`.
  - Chuyển sang `NEEDS_RESCHEDULE`, lưu lý do.
  - Thông báo cho cư dân và các quản lý đang hoạt động của tòa nhà.
- `PUT /maintenance/:id/complete`
  - Chỉ chấp nhận yêu cầu `PROCESSING`.
  - Chuyển sang `DONE`.
  - Tạo thông báo hoàn tất cho tài khoản cư dân.

## Thông báo

Dùng lại bảng `Notification`, với `type = "MAINTENANCE"`.

- Xác nhận lịch: gồm căn hộ, thời gian và tên kỹ thuật.
- Chưa thể sửa: gồm căn hộ và lý do do kỹ thuật nhập.
- Hoàn tất: xác nhận yêu cầu đã được sửa xong.

Nếu cư dân chưa có tài khoản liên kết, giao dịch xác nhận hoặc cập nhật vẫn thành công nhưng không tạo được thông báo cho cư dân. Thông báo quản lý khi chưa thể sửa vẫn được tạo cho các tài khoản quản lý phù hợp.

## Tính nhất quán và lỗi

- Dùng giao dịch Prisma cho mỗi chuyển trạng thái và các thông báo liên quan.
- Điều kiện trạng thái, chủ sở hữu, tòa nhà và nhân viên phụ trách được đặt ngay trong truy vấn cập nhật để tránh cập nhật đồng thời sai.
- Dữ liệu đầu vào dùng Zod strict schema.
- Trả `400` cho dữ liệu không hợp lệ, `403` cho hành động không được phép, `404` cho tài nguyên ngoài phạm vi hoặc không tồn tại, và `409` cho chuyển trạng thái không hợp lệ hoặc xung đột đồng thời.

## Kiểm thử

Viết kiểm thử backend tập trung cho:

- Validate payload và khai báo route dùng đúng phương thức `PUT`.
- Cư dân chỉ tạo yêu cầu cho căn hộ có hợp đồng đang hiệu lực và chỉ hủy khi `PENDING`.
- Quản lý chỉ xem/xác nhận trong tòa nhà mình quản lý.
- Chỉ nhân viên `Kỹ thuật` cùng tòa nhà được phân công.
- Chỉ kỹ thuật được giao được báo chưa thể sửa hoặc hoàn tất.
- Luồng `NEEDS_RESCHEDULE` quay lại `PROCESSING`.
- Thông báo được tạo đúng khi xác nhận lịch, báo chưa thể sửa và hoàn tất.
- Migration và Prisma schema chứa enum, khóa ngoại và chỉ mục mới.
