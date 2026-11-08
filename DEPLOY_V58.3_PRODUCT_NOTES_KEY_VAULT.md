# Deploy TeoStudio V58.3

## 0. Trước khi cập nhật

1. Sao lưu Cloudflare D1 đang chạy (export/backup từ dashboard hoặc Wrangler).
2. Giữ lại Worker Secrets, D1 binding, R2 binding, domain và cấu hình hiện tại. Không xóa database, không tạo database mới để thay thế.
3. Nếu `CARD_DATA_ENCRYPTION_KEY` đã được cấu hình cho chức năng mã thẻ/serial hiện tại, **giữ nguyên giá trị đó**. Không rotate Secret nếu chưa có kế hoạch giải mã và mã hóa lại dữ liệu cũ.

## 1. Triển khai mã nguồn

1. Giải nén ZIP V58.3.
2. Triển khai nội dung Worker trong `cloudflare/worker.js` theo cấu hình dự án đang dùng.
3. Đưa nội dung thư mục `frontend/` lên đúng static hosting/R2 hoặc pipeline frontend đang phục vụ `teostudio.top`.
4. Giữ các binding/env hiện có; không thay `DB` binding sang database rỗng.
5. Sau khi Worker cập nhật, gọi trang tài khoản/tenant admin để khởi tạo schema. Migration được chạy theo cơ chế `ensureTenantSchema` và chỉ bổ sung bảng/cột/index.

## 2. Secret cho kho key

Kho key cần `CARD_DATA_ENCRYPTION_KEY` dài ít nhất 32 ký tự. Nếu Secret này đã tồn tại thì giữ nguyên. Nếu chưa có, tạo một giá trị ngẫu nhiên ổn định (không dùng mật khẩu dễ đoán), thêm dưới dạng Worker Secret trong Cloudflare Dashboard hoặc Wrangler Secret. Không ghi Secret vào HTML, JS frontend, GitHub hay file ZIP.

**Cảnh báo:** thay Secret sau khi đã lưu key sẽ khiến dữ liệu ciphertext cũ không giải mã được nếu không có quy trình re-encryption.

## 3. Cấu hình sản phẩm và Note

1. Vào Tenant Admin → Note Designer, tạo Note có tiêu đề, mô tả, ảnh bìa/chủ đề, nội dung.
2. Đặt con trỏ trong phần nội dung tại vị trí muốn hiện liên kết và bấm “Chèn tại đây”; token `{{TASKS_LINK}}` sẽ được chèn.
3. Thêm/sắp xếp các bước nhiệm vụ (tối đa 30), nhập link từng nền tảng và lưu Note.
4. Vào File / Code → sửa hoặc tạo sản phẩm → chọn Note gắn với sản phẩm.
5. Chọn chế độ:
   - `FREE trực tiếp / Chỉ vượt`: link tải trực tiếp + link vượt.
   - `Mua hoặc vượt`: link vượt miễn phí + giá; link tải sau thanh toán hoặc Note/kho key.
   - `Chỉ mua`: giá; có thể giao Note/kho key thay link tải.
   - `Chỉ vượt`: link vượt hoặc Note nhiệm vụ.
6. Chọn loại key nếu muốn giao key sau thanh toán.
   - `Kho key ngẫu nhiên`: lưu sản phẩm, mở Kho key, nhập mỗi key một dòng. Hệ thống tự chọn một key còn trống cho mỗi đơn mua đã thanh toán.
   - `Key cố định`: nhập một key; key này được giao lại cho từng đơn mua của sản phẩm đó.

## 4. Kiểm thử an toàn trước khi mở bán

- Dùng tài khoản mua thử, nạp một khoản nhỏ, thử sản phẩm `Mua hoặc vượt`. Kiểm tra đường vượt mở Note có nhiệm vụ; đường mua trừ ví đúng một lần và mở Note trả phí/key.
- Với pool key, nhập 3 key thử nghiệm. Mua 2 lần bằng hai tài khoản khác nhau; xác nhận hai key khác nhau chuyển từ “Còn key” sang “Đã cấp”. Đánh dấu một key đã dùng và xác nhận thành màu đỏ.
- Thử bấm lại/refresh sau giao dịch: phải trả lại cùng key của đơn cũ, không trừ ví lần hai.
- Mở Share: sản phẩm có Note phải chỉ xuất hiện một lần; Note độc lập chưa gắn sản phẩm vẫn được liệt kê như trước.
- Thử mua Note trả phí bằng tài khoản khác: Worker phải từ chối `PURCHASE_REQUIRED`.
- Kiểm tra tài khoản người mua và Seller/Wallet sau một giao dịch thử; đối chiếu ledger trước khi mở thật.

## 5. Giới hạn và lưu ý

- Không thể xác minh Follow/Join thật nếu TikTok/Zalo/Discord… không cấp API xác minh được ủy quyền; hiện luồng ghi nhận mở link/hoàn thành từng bước và thời gian chờ, không phải xác minh membership.
- Các vị trí quảng cáo hiện chỉ là slot/configuration placeholder. Chưa phát quảng cáo, chưa nhận callback doanh thu hoặc cộng tiền quảng cáo. Chỉ tích hợp SDK/API khi nhà cung cấp cho phép hình thức traffic và reward dự kiến.
- Không xóa các bảng `tenant_notes`, `tenant_note_progress`, `tenant_products`, `buyer_purchases`, `buyer_wallet_ledger`, `tenant_product_keys`.
- Bản ZIP chưa được deploy vào tài khoản Cloudflare của người dùng; cần thực hiện deploy và kiểm tra Production theo các bước trên.
