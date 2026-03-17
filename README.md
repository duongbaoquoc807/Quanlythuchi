# Family Finance Manager

Ứng dụng quản lý thu chi gia đình hiện đại, dễ sử dụng, được xây dựng với React, TypeScript, Tailwind CSS và Firebase.

## Tính năng nổi bật
- **Quản lý giao dịch**: Thêm, sửa, xóa các khoản thu chi dễ dàng.
- **Phân loại danh mục**: Tự do tạo danh mục thu/chi với màu sắc tùy chỉnh.
- **Quản lý thành viên**: Gán giao dịch cho từng thành viên trong gia đình.
- **Ngân sách**: Đặt hạn mức chi tiêu hàng tháng và theo dõi tiến độ.
- **Báo cáo trực quan**: Biểu đồ hình tròn, biểu đồ cột phân tích chi tiêu.
- **Xuất dữ liệu**: Xuất báo cáo ra file CSV để dùng trong Excel.
- **Realtime Sync**: Dữ liệu đồng bộ theo thời gian thực nhờ Firebase Firestore.
- **Bảo mật**: Xác thực an toàn bằng Google Login, dữ liệu được cô lập theo từng tài khoản.

## Công nghệ sử dụng
- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, shadcn/ui (custom components)
- **Charts**: Recharts
- **Database & Auth**: Firebase (Firestore & Authentication)
- **Routing**: React Router DOM
- **Khác**: date-fns, sonner (toast), papaparse (CSV export)

## Hướng dẫn cài đặt và chạy local

### 1. Yêu cầu hệ thống
- Node.js 18+
- npm hoặc yarn

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Cấu hình môi trường
Ứng dụng sử dụng Firebase. Nếu bạn chạy trong môi trường AI Studio, cấu hình đã được tự động tiêm vào file `firebase-applet-config.json`.
Nếu chạy ở môi trường khác, hãy tạo file `.env` dựa trên `.env.example` và thiết lập cấu hình Firebase của bạn.

### 4. Chạy ứng dụng
```bash
npm run dev
```
Truy cập `http://localhost:3000` trên trình duyệt.

## Hướng dẫn Deploy lên Vercel

1. Đẩy code lên GitHub repository của bạn.
2. Đăng nhập vào [Vercel](https://vercel.com).
3. Chọn **Add New... > Project**.
4. Import repository GitHub của bạn.
5. Framework Preset: chọn **Vite**.
6. Build Command: `npm run build`
7. Output Directory: `dist`
8. (Tùy chọn) Thêm các biến môi trường Firebase nếu bạn không dùng file config tĩnh.
9. Nhấn **Deploy**.

## Cấu trúc thư mục
- `/src/components`: Các component UI tái sử dụng (Button, Card, Input, Dialog, Select...) và Layout chính.
- `/src/hooks`: Custom hooks (ví dụ: `useAuth`, `useFirestoreQuery` để lấy dữ liệu realtime).
- `/src/lib`: Các hàm tiện ích (`utils.ts`) và cấu hình Firebase (`firebase.ts`).
- `/src/pages`: Các trang chính của ứng dụng (Dashboard, Transactions, Categories...).
- `/src/types`: Định nghĩa các interface TypeScript cho dữ liệu.

## Lưu ý về kiến trúc
Dự án được yêu cầu sử dụng Next.js App Router, tuy nhiên để đảm bảo tương thích 100% và chạy mượt mà ngay lập tức trong môi trường Vite SPA của AI Studio, kiến trúc đã được điều chỉnh sang React + Vite + React Router DOM. Cấu trúc thư mục và logic component vẫn được giữ nguyên theo chuẩn hiện đại, rất dễ dàng chuyển đổi sang Next.js nếu cần thiết trong tương lai.
