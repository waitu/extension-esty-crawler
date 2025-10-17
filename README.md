# Etsy Crawl Manager Extension

Tiện ích Chrome giúp thu thập dữ liệu sản phẩm trên Etsy, lưu trữ lịch sử cục bộ và quản lý chúng ngay trong trang tùy chọn của extension. Bạn có thể crawl toàn bộ trang tìm kiếm, thêm từng sản phẩm thủ công bằng nút “Lưu sản phẩm” và tải dữ liệu về dạng CSV bất cứ lúc nào.

## ✨ Tính năng chính

- **Panel nổi trong trang Etsy**: cấu hình từ khóa, số lượng cần lấy, chế độ crawl (trang hiện tại hoặc tự chuyển trang) và tùy chọn bật/tắt quảng cáo.
- **Crawl tự động**: đọc HTML các trang tìm kiếm, bỏ qua quảng cáo (mặc định) và thu thập chi tiết sản phẩm (tên, mô tả, hình ảnh, giá, rating...).
- **Nút “Lưu sản phẩm” trên mỗi listing**: xuất hiện ngay đầu mỗi thẻ sản phẩm để thêm nhanh vào lịch sử khi bạn chủ động chọn từng mặt hàng.
- **Tránh trùng lặp thông minh**: lịch sử được lưu trong `chrome.storage` với khóa theo `id/link`, nếu sản phẩm đã tồn tại thì thông tin mới sẽ ghi đè thay vì thêm bản sao.
- **Trang Dashboard riêng**: hiển thị lịch sử crawl với tìm kiếm toàn văn, bộ lọc theo thời gian, tải CSV, làm mới và xóa lịch sử.
- **Xuất CSV trực tiếp**: có thể tải dữ liệu từ panel (với lần crawl gần nhất) hoặc ngay trong dashboard.

Các cột dữ liệu: `id`, `link`, `product name`, `description`, `image`, `image1`, `image2`, `image3`, `image4`, `price`, `rating`, `crawledAt`.

## 📦 Cấu trúc dự án

```text
etsy-crawler-extension/
├── manifest.json
├── README.md
├── assets/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── pages/
│   ├── dashboard.css
│   ├── dashboard.html
│   └── dashboard.js
├── popup/
│   ├── popup.css
│   ├── popup.html
│   └── popup.js
├── src/
│   ├── background.js
│   └── contentScript.js
├── styles/
│   └── content.css
└── scripts/
    └── make-icons.ps1
```

## 🚀 Cài đặt trong Chrome

1. Mở `chrome://extensions` và bật **Developer mode**.
2. Chọn **Load unpacked** rồi trỏ tới thư mục `etsy-crawler-extension`.
3. Đảm bảo extension xuất hiện với biểu tượng chữ **E** trên thanh công cụ.

## 🧩 Sử dụng nhanh

### Crawl tự động toàn trang

1. Vào trang tìm kiếm Etsy (ví dụ `https://www.etsy.com/search?q=t+shirt`).
2. Mở popup extension, cấu hình từ khóa, số lượng và chế độ chạy.
3. Nhấn **Crawl trang tìm kiếm**. Panel nổi sẽ hiện tiến độ và tự thêm dữ liệu vào lịch sử khi hoàn tất.
4. Bạn có thể tải CSV ngay lập tức hoặc mở dashboard để xem lại toàn bộ lịch sử.

### Lưu thủ công bằng nút “Lưu sản phẩm”

1. Khi đang duyệt danh sách sản phẩm, tìm nút **Lưu sản phẩm** xuất hiện phía trên mỗi listing.
2. Bấm nút để ghi riêng sản phẩm đó vào lịch sử. Tiện ích sẽ tự crawl chi tiết và báo trạng thái ngay trên panel.
3. Nếu sản phẩm đã tồn tại, nút sẽ chuyển sang trạng thái “Đã lưu”.

## 📊 Trang quản lý lịch sử (Dashboard)

Truy cập dashboard bằng nút **Trang quản lý** (popup) hoặc **Mở trang quản lý** (panel). Tại đây bạn có thể:

- Tìm kiếm theo tên, mô tả, ID, giá.
- Lọc theo mốc thời gian: hôm nay, 7 ngày, 30 ngày.
- Tải toàn bộ dữ liệu đang lọc thành CSV.
- Làm mới dữ liệu hoặc xóa toàn bộ lịch sử bằng một cú click.
- Xem nhanh số lượng sản phẩm đã lưu.

## 🛠 Ghi chú kỹ thuật

- `contentScript.js` chịu trách nhiệm tạo panel, cấy nút “Lưu sản phẩm”, điều khiển crawl và đồng bộ lịch sử.
- Lịch sử được lưu trong `chrome.storage.local` với giới hạn mềm 2000 bản ghi và được đồng bộ với dashboard theo thời gian thực.
- Khi một mục đã tồn tại, dữ liệu mới sẽ ghi đè để giữ thông tin cập nhật mà không nhân bản dòng.
- Các cuộc gọi HTML sử dụng `fetch` và tự động fallback sang service worker nếu gặp giới hạn CORS.
- Giao diện được viết thuần CSS/JS, không dùng thư viện ngoài để giữ extension nhẹ và dễ bảo trì.

## ✅ Kiểm tra nhanh (manual)

```bash
node --check src\contentScript.js
node --check popup\popup.js
node --check pages\dashboard.js
```

Sau khi reload extension, thử crawl 3–5 sản phẩm và xác nhận rằng chúng xuất hiện trong dashboard, sau đó dùng nút “Lưu sản phẩm” để thêm một mục thủ công và tải CSV.

## 🔭 Gợi ý mở rộng

- Gộp nhóm lịch sử theo từ khóa hoặc chiến dịch để dễ quản lý.
- Thêm bộ lọc nâng cao (khoảng giá, shop, tag).
- Cho phép xuất trực tiếp sang các định dạng khác (JSON, XLSX) hoặc đồng bộ với hệ thống nội bộ.

Chúc bạn thu thập dữ liệu Etsy thật hiệu quả! 🎯
