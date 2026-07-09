# Tenant Occupants Design

## Mục tiêu

Cho người thuê khai báo và tự quản lý danh sách người ở cùng của chính mình. Quản trị viên và quản lý chỉ xem danh sách này, không tạo, sửa hoặc xóa thay tenant.

## Phạm vi

- Tenant được xem, thêm, sửa, xóa người ở cùng của `actor.tenantId`.
- Admin và manager được đọc danh sách người ở cùng qua API chi tiết tenant.
- Dữ liệu dùng bảng Prisma `occupants` hiện có.
- Frontend giữ UI `ProfilePage` hiện có, đổi nguồn dữ liệu từ `localStorage` sang API.

## API

- `GET /tenants/me/occupants`: tenant xem danh sách của mình.
- `POST /tenants/me/occupants`: tenant tạo người ở cùng.
- `PUT /tenants/me/occupants/:occupantId`: tenant sửa người ở cùng thuộc tenant đó.
- `DELETE /tenants/me/occupants/:occupantId`: tenant xóa người ở cùng thuộc tenant đó.
- `GET /tenants/:id`: trả thêm `occupants` để admin/manager xem.

## Dữ liệu

Frontend đang dùng:

- `name`
- `cccd`
- `dob`
- `phone`

Backend lưu:

- `full_name`
- `citizen_id`
- `date_of_birth`
- `phone`

Service FE map qua lại giữa hai dạng để không phải sửa nhiều UI.

## Quyền

- Tenant chỉ thao tác dữ liệu có `tenant_id === actor.tenantId`.
- Tenant không có `actor.tenantId` nhận lỗi `TENANT_PROFILE_REQUIRED`.
- Admin và manager không dùng các route `/tenants/me/occupants`.
- Manager xem tenant theo scope hiện có của `tenant.service`.

## Validate

- `full_name`: bắt buộc, 1 đến 200 ký tự.
- `citizen_id`: đúng 12 chữ số.
- `date_of_birth`: `YYYY-MM-DD`, cho phép null hoặc bỏ qua.
- `phone`: số điện thoại Việt Nam dạng `0xxxxxxxxx`, cho phép null hoặc chuỗi rỗng từ FE.

## Kiểm thử

- Test service tạo occupant bằng `actor.tenantId`.
- Test update/delete dùng `updateMany`/`deleteMany` với cả `id` và `tenant_id` để không chạm dữ liệu tenant khác.
- Build backend và frontend sau khi sửa.
