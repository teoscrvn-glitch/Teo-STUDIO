# TeoStudio — lựa chọn nền tảng quảng cáo cho Share / Free Gate

## Khuyến nghị: Google Ad Manager (GAM)

GAM là hướng phù hợp hơn cho luồng quảng cáo có thưởng trên website:
- Google có định dạng **Rewarded ads for web** và cho phép website yêu cầu người dùng chủ động tham gia trước khi hiển thị quảng cáo.
- GAM hỗ trợ cấu hình URL **server-side verification (SSV)** để máy chủ Google gọi về khi có tương tác quảng cáo được thưởng.
- GAM API hỗ trợ báo cáo theo network, inventory, metric và date range; việc chạy báo cáo là quy trình bất đồng bộ.

Tài liệu chính thức:
- https://support.google.com/admanager/answer/9116812?hl=en — Rewarded ads for web / SSV.
- https://developers.google.com/publisher-tag/reference — Google Publisher Tag API.
- https://developers.google.com/ad-manager/api/reporting — báo cáo Ad Manager API.
- https://developers.google.com/ad-manager/api/authentication — OAuth 2.0 và quyền truy cập API.

## Dữ liệu phải lấy từ tài khoản GAM
- Network Code.
- Ad Unit Path dành riêng cho Trang Note / Share.
- Ad Unit / inventory được bật định dạng Rewarded.
- URL SSV callback mà GAM cho phép cấu hình.
- OAuth client hoặc service account có quyền API phù hợp để đồng bộ báo cáo doanh thu.

Không đưa OAuth client secret, service account private key hoặc thông tin đăng nhập vào frontend. Chỉ lưu Worker Secrets/secret manager và giới hạn quyền API tối thiểu.

## Quy tắc ghi nhận thưởng
- Không cấp thưởng chỉ dựa trên sự kiện JavaScript ở trình duyệt.
- SSV phải được kiểm tra bằng chữ ký/public key của Google theo tài liệu đúng với loại inventory đang chạy.
- Mỗi transaction ID chỉ được ghi nhận một lần; kiểm tra thời gian, Ad Unit, người dùng và nonce do máy chủ cấp.
- Nếu callback trễ hoặc xác minh thất bại, hiển thị trạng thái đang chờ; không cộng lượt trước.
- Chỉ tính doanh thu từ báo cáo đã đồng bộ và đối soát; không suy ra tiền từ số click hoặc impression.

**Lưu ý:** Tài liệu AdMob SSV cho mobile có cách ký callback và tham số riêng. Không sao chép nguyên code AdMob vào GAM Rewarded Web nếu tài liệu GAM cho inventory cụ thể không xác nhận cùng contract.

## Vì sao không dùng Link4M cho Free Gate có thưởng
Điều khoản Link4M công bố yêu cầu người dùng tài khoản từ đủ 18 tuổi và không thanh toán cho traffic incentivized (lượt click được khuyến khích bằng lợi ích). Luồng “xem link để được cộng thêm ngày thuê” thuộc dạng traffic có thưởng, do đó V56.65 loại Link4M khỏi Free Gate. Link4M có thể vẫn được giữ cho link không có thưởng nếu tài khoản đáp ứng điều khoản của nhà cung cấp.

## BumX
Chưa có tài liệu API công khai đủ rõ trong bộ source để chứng minh BumX cho phép traffic đổi thưởng và có endpoint xác minh S2S. V56.65 yêu cầu hai điều kiện trước khi bật:
1. Xác nhận bằng văn bản rằng luồng traffic đổi ngày thuê được phép.
2. Endpoint server-to-server có thể xác minh trạng thái hoàn thành cho đúng `state`/attempt.

Chỉ bật `FREE_BYPASS_REWARDED_TRAFFIC_APPROVED=1` khi hai điều kiện trên đã được xác nhận. Không dùng URL rút gọn làm endpoint xác minh.

## Trạng thái V56.65
Gói này chưa kết nối tài khoản GAM, chưa chèn quảng cáo thật và chưa đồng bộ doanh thu tự động. Không có Network Code, Ad Unit Path hoặc OAuth credentials trong ZIP. Đây là điểm chặn cần thiết để tránh tự tạo ad request vào inventory chưa được cấp quyền hoặc ghi nhận doanh thu giả.
