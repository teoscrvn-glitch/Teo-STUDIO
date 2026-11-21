# Deploy TeoStudio V57.3 — Free one-time key

1. Sao lưu D1 `teo-studio` và Worker hiện tại trước khi deploy.
2. Giữ nguyên binding `DB`, `ASSETS`, Worker name và Database ID trong `cloudflare/wrangler.toml`. Migration tạo bảng `free_bypass_keys` và thêm cột `session_hash`, `key_issued_at` vào bảng attempts; không xóa dữ liệu thuê cũ.
3. Cấu hình Secret `BUMX_API_KEY` và Variable `BUMX_API_URL` nếu khác mặc định.
4. Chỉ đặt Variable `FREE_BYPASS_REWARDED_TRAFFIC_APPROVED=1` sau khi BumX xác nhận traffic có thưởng được phép. Nếu chưa được duyệt, giữ cổng khóa.
5. Không cần tạo `FREE_BYPASS_VERIFY_URL` hoặc `FREE_BYPASS_API_KEY`; luồng V57.3 không dùng hai biến này.
6. Deploy Preview trước. Test: (a) tài khoản Free còn ngày thuê vào thẳng Admin; (b) tài khoản Free hết hạn thấy cổng; (c) bấm Vượt link, hoàn tất BumX, đến `/free-key.html`; (d) tạo key và copy; (e) nhập key đúng Studio, được cộng 4 ngày; (f) nhập lại key bị từ chối; (g) key quá 5 phút bị từ chối; (h) mở `/free-key.html` không có state bị từ chối; (i) mở link Admin gốc không tự sinh key.
7. Không test bằng tài khoản production có dữ liệu quan trọng trước khi kiểm tra backup và D1 migration.

Lưu ý: state callback là tín hiệu quay lại, không phải provider-signed ad completion. Xem `CHANGELOG_V57.3_FREE_KEY.md` trước khi bật traffic thực tế.
