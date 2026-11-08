# TeoStudio V58.3 — Product Notes & Key Vault

## Thay đổi chính

- Liên kết một Note với từng sản phẩm/file của Studio bằng `note_id`; máy chủ xác thực Note phải thuộc cùng Studio và đang hiển thị.
- Note đã gắn vào sản phẩm không còn bị liệt kê thêm lần nữa trong danh sách Note độc lập trên Share. URL Note riêng vẫn hoạt động.
- Nội dung Note hỗ trợ chèn `{{TASKS_LINK}}`, hiển thị thành liên kết màu xanh “tại đây” để mở chuỗi nhiệm vụ. Trình soạn thảo hỗ trợ tối đa 30 bước; bản sửa loại bỏ listener trùng trên nút chèn token.
- Hỗ trợ các chế độ sản phẩm: `FREE trực tiếp / Chỉ vượt`, `Mua hoặc vượt`, `Chỉ mua`, `Chỉ vượt` và chế độ Free cũ. Quy trình mua tiếp tục sử dụng ví TeoStudio hiện tại.
- Note ở chế độ chỉ mua chỉ được trả nội dung sau khi máy chủ tìm thấy đơn mua `paid` của đúng người mua, Studio và sản phẩm. Với chế độ mua hoặc vượt, đường vượt mở Note có nhiệm vụ; đường mua mở Note đã bỏ nhiệm vụ/quảng cáo sau khi xác nhận đơn mua.
- Thêm kho key theo sản phẩm: key cố định hoặc pool key ngẫu nhiên. Key được AES-GCM mã hóa trước khi lưu D1; hash dùng để chống nhập trùng; API quản trị không trả ciphertext/hash.
- Pool key dùng trạng thái `available → reserved → issued → used`, đặt giữ 90 giây và claim bằng câu lệnh UPDATE có điều kiện để giảm nguy cơ cấp trùng. Retry đơn mua trả lại key thuộc chính đơn cũ thay vì trừ ví lần nữa.
- Lịch sử đơn mua có thể sao chép key, mở Note trả phí và đánh dấu key đã dùng. Giao diện kho key phân màu: xanh còn key, vàng đã cấp/đang chờ dùng, đỏ đã dùng; giữ trạng thái đang giữ tạm riêng.
- Migration D1 là bổ sung, tạo bảng `tenant_product_keys` trước khi thêm `key_suffix`; không xóa hoặc reset bảng dữ liệu hiện tại.
- Bump cache version sang V58.3 cho các script liên quan.

## Giới hạn cần biết

- “Chỉ vượt”/chuỗi nhiệm vụ chỉ ghi nhận việc mở link, thứ tự bước, thời gian chờ tối thiểu và xác nhận từ người truy cập. Không thể chứng minh Follow/Join thực sự nếu nền tảng ngoài không cung cấp API xác minh được cấp quyền.
- Các vị trí quảng cáo và lựa chọn hiển thị là cấu hình/slot trung lập để tích hợp sau. Chưa có SDK/API quảng cáo đang phát thật hoặc đối soát doanh thu quảng cáo trong bản này.
- Key cố định được dùng lặp lại theo chủ ý; pool key mới là chế độ cấp một key riêng cho mỗi đơn.
- Chưa deploy lên Cloudflare Production và chưa thực hiện giao dịch thật trong SePay/đối tác thanh toán.
