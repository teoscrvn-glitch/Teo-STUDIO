# Legal readiness — TeoStudio V57.0

Tài liệu này phân biệt những thứ đã thêm trong source và những việc cần chủ quản hoàn thiện. Nó không phải ý kiến tư vấn pháp lý hoặc xác nhận tuân thủ.

## Quy định được dùng làm căn cứ rà soát ngày 04/11/2026
- Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15, hiệu lực 01/01/2026.
- Nghị định 356/2025/NĐ-CP, hiệu lực 01/01/2026, quy định chi tiết Luật Bảo vệ dữ liệu cá nhân.
- Luật Thương mại điện tử 122/2025/QH15, hiệu lực 01/07/2026.
- Nghị định 248/2026/NĐ-CP, hiệu lực 01/07/2026.
- Cục Thương mại điện tử thông báo 14/10/2026 về việc xác thực điện tử danh tính người bán/người livestream từ 01/01/2027 đối với chủ quản nền tảng thuộc phạm vi.

## Ý nghĩa đối với TeoStudio
TeoStudio có tính năng tài khoản, lưu trữ/chia sẻ nội dung, người thuê Studio, cửa hàng/file trả phí, Seller/referral, thanh toán và dữ liệu giao dịch. Vì vậy phải đánh giá thực chất vai trò của chủ quản trong từng luồng. Nếu TeoStudio chỉ cung cấp công cụ SaaS/lưu trữ theo chỉ dẫn người thuê, các nghĩa vụ có thể khác với website/nền tảng TMĐT trung gian. Nếu chủ quản tổ chức cho nhiều seller niêm yết và bán trực tiếp đến người mua hoặc quản lý luồng giao dịch, cần rà soát khả năng bị phân loại là nền tảng trung gian và các trách nhiệm tương ứng. Không thể xác định dứt điểm chỉ từ giao diện/source.

## Những gì V57.0 đã làm
- Có 4 chính sách riêng và liên kết ở footer.
- Đăng ký yêu cầu 2 xác nhận riêng; Worker bắt buộc version và ghi timestamp.
- Có trang/API tiếp nhận quyền dữ liệu và màn hình Admin theo dõi.
- Nội dung cấm/claim sai, báo cáo vi phạm, quyền sở hữu nội dung, seller, thanh toán/hoàn tiền được mô tả trong Điều khoản.
- Cookie page phân biệt localStorage/sessionStorage với cookie và không giả định banner hiện tại là consent cho tracking.

## Còn thiếu trước public
- Thông tin pháp lý chính xác của chủ quản; email/kênh liên hệ vận hành; mã số thuế/đăng ký nếu thuộc diện.
- Tư vấn phân loại mô hình hoạt động, thủ tục thông báo/đăng ký e-commerce và quy chế nền tảng nếu áp dụng.
- Quy trình xác minh danh tính người bán phù hợp, đặc biệt trước 01/01/2027 nếu TeoStudio nằm trong nhóm chịu yêu cầu xác thực điện tử. Source chưa có VNeID/e-ID integration.
- Chỉ định controller/processor, mục đích/căn cứ xử lý từng dữ liệu, retention schedule, hợp đồng với Cloudflare/SePay/SMTP/AI/Telegram/BumX, đánh giá chuyển dữ liệu xuyên biên giới và quy trình sự cố.
- Rà soát pháp lý điều khoản hoàn tiền đối với hàng hóa/dịch vụ số, thuế/doanh thu/hoa hồng, khiếu nại và bảo vệ người tiêu dùng.

## Nguồn chính thức
- Luật 91/2025/QH15: https://bocongan.gov.vn/chinh-sach-phap-luat/co-so-du-lieu-van-ban/luat-bao-ve-du-lieu-ca-nhan-1753688803
- Nghị định 356/2025/NĐ-CP: https://vanban.chinhphu.vn/?classid=1&docid=216387&pageid=27160
- Luật 122/2025/QH15: https://vanban.chinhphu.vn/?classid=1&docid=216503&pageid=27160&typegroupid=3
- Nghị định 248/2026/NĐ-CP: https://chinhphu.vn/?docid=218747&pageid=27160
- Thông báo 14/10/2026 của Cục TMĐT: https://www.idea.gov.vn/default.aspx?category_id=6e3f3b28-3917-4816-83c5-a331259dd181&do=detail&id=184e0d3f-daab-42a5-a33e-782c78e579c0&page=news
