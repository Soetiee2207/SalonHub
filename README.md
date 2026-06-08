<p align="center">
  <img src="frontend/public/favicon.svg" alt="SalonHub Logo" width="80" />
</p>

<h1 align="center">💇 SalonHub — Hệ thống Quản lý Salon Tóc chuyên nghiệp</h1>

<p align="center">
  <strong>Fullstack Web Application</strong> · React + Vite · Express.js · MySQL · Socket.IO · Cloudinary
</p>

<p align="center">
  <a href="https://salonhub-soe.vercel.app/">🌐 Truy cập bản Demo Online</a>
</p>

---

## 📋 Mục lục

- [Giới thiệu](#-giới-thiệu)
- [Tính năng chính](#-tính-năng-chính)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [Hướng dẫn chạy Local](#-hướng-dẫn-chạy-local)
  - [Yêu cầu hệ thống](#1-yêu-cầu-hệ-thống)
  - [Cài đặt Database](#2-cài-đặt-database)
  - [Cài đặt Backend](#3-cài-đặt-backend)
  - [Cài đặt Frontend](#4-cài-đặt-frontend)
- [Sử dụng bản Web Online](#-sử-dụng-bản-web-online)
- [Tài khoản Demo](#-tài-khoản-demo)
- [API Endpoints](#-api-endpoints)
- [Thanh toán](#-thanh-toán)
- [Tác giả](#-tác-giả)

---

## 📖 Giới thiệu

**SalonHub** là một hệ thống quản lý salon tóc toàn diện, cho phép khách hàng đặt lịch cắt tóc, mua sản phẩm chăm sóc tóc online, và hỗ trợ quản lý nội bộ cho admin, nhân viên, kế toán và thủ kho.

Dự án được xây dựng theo mô hình **Client-Server** với Frontend deploy trên **Vercel** và Backend deploy trên **Render**.

---

## ✨ Tính năng chính

### 👤 Khách hàng
| Tính năng | Mô tả |
|-----------|-------|
| 🏠 Trang chủ | Giao diện giới thiệu salon, dịch vụ nổi bật |
| 📋 Xem dịch vụ | Duyệt danh sách dịch vụ & chi tiết từng dịch vụ |
| 📅 Đặt lịch hẹn | Đặt lịch cắt tóc, chọn thợ, chọn chi nhánh |
| 🛒 Mua sản phẩm | Giỏ hàng, thanh toán, theo dõi đơn hàng |
| ⭐ Đánh giá | Đánh giá dịch vụ sau khi sử dụng |
| 🎫 Voucher | Sử dụng mã giảm giá khi đặt lịch/mua hàng |
| 🔔 Thông báo | Nhận thông báo realtime qua Socket.IO |
| 📍 Quản lý địa chỉ | Thêm/sửa/xóa địa chỉ giao hàng |
| 📞 Liên hệ | Gửi phản hồi cho salon |

### 🔧 Admin / Quản lý
| Tính năng | Mô tả |
|-----------|-------|
| 📊 Dashboard | Tổng quan doanh thu, thống kê theo vai trò |
| 👥 Quản lý nhân viên | CRUD nhân viên, phân quyền, lịch làm việc |
| 🏬 Quản lý chi nhánh | Thêm/sửa chi nhánh salon |
| 💇 Quản lý dịch vụ | CRUD dịch vụ cắt tóc |
| 📦 Quản lý sản phẩm | CRUD sản phẩm, quản lý lô hàng |
| 📋 Quản lý đơn hàng | Xử lý đơn, fulfillment, hoàn trả |
| 💰 Kế toán | Sổ quỹ, đối soát thanh toán, báo cáo tài chính |
| 🏭 Thủ kho | Quản lý kho, nhập/xuất, phiếu kho |
| 🎫 Quản lý voucher | Tạo & quản lý mã giảm giá |
| ⭐ Quản lý đánh giá | Xem & phản hồi đánh giá khách hàng |

---

## 🛠 Công nghệ sử dụng

### Frontend
| Công nghệ | Phiên bản | Mô tả |
|------------|-----------|-------|
| React | 18.3 | UI Library |
| Vite | 6.x | Build tool |
| TailwindCSS | 4.x | CSS Framework |
| React Router DOM | 6.x | Routing |
| Framer Motion | 12.x | Animations |
| Recharts | 3.x | Charts & Biểu đồ |
| Socket.IO Client | 4.x | Realtime communication |
| Axios | 1.x | HTTP Client |
| Lucide React + React Icons | — | Icon libraries |

### Backend
| Công nghệ | Phiên bản | Mô tả |
|------------|-----------|-------|
| Node.js | 22.x | Runtime |
| Express | 5.x | Web Framework |
| Sequelize | 6.x | ORM |
| MySQL2 | 3.x | Database Driver |
| Socket.IO | 4.x | Realtime Server |
| JWT | 9.x | Authentication |
| Cloudinary | 1.x | Image Upload |
| Nodemailer | 8.x | Email Service |
| Groq SDK | 1.x | AI Integration |
| Redis (ioredis) | 5.x | Caching (tuỳ chọn) |

---

## 📂 Cấu trúc thư mục

```
SalonHub/
├── frontend/                  # React + Vite (Client)
│   ├── public/                # Static assets
│   ├── src/
│   │   ├── assets/            # Images, fonts
│   │   ├── components/        # Reusable components
│   │   │   ├── common/        # LoadingSpinner, ProtectedRoute, ...
│   │   │   └── layout/        # CustomerLayout, AdminLayout
│   │   ├── contexts/          # AuthContext, CartContext, SocketContext, ...
│   │   ├── pages/
│   │   │   ├── Home.jsx       # Trang chủ
│   │   │   ├── Contact.jsx    # Liên hệ
│   │   │   ├── auth/          # Login, Register, Profile
│   │   │   ├── services/      # Services, ServiceDetail
│   │   │   ├── products/      # Products, ProductDetail
│   │   │   ├── appointments/  # BookAppointment, MyAppointments
│   │   │   ├── cart/          # Cart, Checkout
│   │   │   ├── orders/        # MyOrders, OrderDetail
│   │   │   ├── addresses/     # MyAddresses
│   │   │   ├── notifications/ # Notifications
│   │   │   └── admin/         # Dashboard, Staff, Services, Products, ...
│   │   ├── services/          # API service files
│   │   └── utils/             # Helper functions
│   ├── .env                   # Environment variables
│   ├── vite.config.js         # Vite configuration
│   └── package.json
│
├── backend/                   # Express.js (Server)
│   ├── config/
│   │   ├── database.js        # MySQL/Sequelize config
│   │   ├── cloudinary.js      # Cloudinary config
│   │   ├── redis.js           # Redis config
│   │   └── sepay.js           # SePay payment config
│   ├── controllers/           # Business logic
│   ├── middleware/             # Auth, upload middleware
│   ├── models/                # Sequelize models
│   ├── routes/                # API routes
│   ├── services/              # Socket, background jobs
│   ├── utils/                 # Utilities
│   ├── app.js                 # Express app setup
│   ├── server.js              # Entry point + Socket.IO
│   ├── Dockerfile             # Docker support
│   ├── .env                   # Environment variables
│   └── package.json
│
├── salonhub_full.sql          # 📄 Database dump (import để chạy local)
├── taikhoan.txt               # 📄 Danh sách tài khoản demo
└── README.md                  # 📄 File này
```

---

## 🚀 Hướng dẫn chạy Local

### 1. Yêu cầu hệ thống

Đảm bảo máy bạn đã cài đặt:

| Phần mềm | Phiên bản tối thiểu | Link tải |
|-----------|---------------------|----------|
| **Node.js** | v18+ (khuyến nghị v22) | [nodejs.org](https://nodejs.org/) |
| **MySQL** | 8.0+ | [mysql.com](https://dev.mysql.com/downloads/) |
| **Git** | Bất kỳ | [git-scm.com](https://git-scm.com/) |

> 💡 **Tip**: Bạn có thể dùng [XAMPP](https://www.apachefriends.org/) hoặc [Laragon](https://laragon.org/) để chạy MySQL dễ dàng trên Windows.

### 2. Cài đặt Database

```bash
# Bước 1: Mở MySQL CLI hoặc phpMyAdmin / MySQL Workbench

# Bước 2: Tạo database
CREATE DATABASE salonhub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Bước 3: Import dữ liệu mẫu
mysql -u root -p salonhub < salonhub_full.sql
```

Hoặc nếu dùng **phpMyAdmin**:
1. Truy cập `http://localhost/phpmyadmin`
2. Tạo database mới tên `salonhub`
3. Chọn tab **Import** → chọn file `salonhub_full.sql` → nhấn **Go**

### 3. Cài đặt Backend

```bash
# Bước 1: Vào thư mục backend
cd backend

# Bước 2: Cài đặt dependencies
npm install

# Bước 3: Cấu hình file .env
# Mở file backend/.env và chỉnh sửa theo máy của bạn:
```

Nội dung file `backend/.env` cần thiết:

```env
# Database Configuration
DB_HOST=127.0.0.1
DB_USER=root
DB_PASS=                          # Mật khẩu MySQL của bạn (để trống nếu không có)
DB_NAME=salonhub
DB_PORT=3306

# App Configuration
PORT=5000
JWT_SECRET=salonhub_secret_key_2026
NODE_ENV=development

# Redis Configuration (tuỳ chọn — để trống nếu không dùng)
REDIS_URL=
REDIS_HOST=
REDIS_PORT=6379
REDIS_PASSWORD=
```

```bash
# Bước 4: Chạy server
npm run dev
```

> ✅ Nếu thành công, terminal sẽ hiện:
> ```
> ✅ Success: Database synced successfully.
> 🚀 Server is running on port 5000 (0.0.0.0)
> 🔗 API Health check: http://localhost:5000/api/health
> ```

### 4. Cài đặt Frontend

Mở **terminal mới** (giữ backend đang chạy):

```bash
# Bước 1: Vào thư mục frontend
cd frontend

# Bước 2: Cài đặt dependencies
npm install

# Bước 3: Cấu hình file .env
# Mở file frontend/.env và đảm bảo nội dung:
```

```env
VITE_API_URL=http://localhost:5000
```

```bash
# Bước 4: Chạy frontend
npm run dev
```

> ✅ Nếu thành công, terminal sẽ hiện:
> ```
>   VITE v6.x.x  ready in xxx ms
>
>   ➜  Local:   http://localhost:3000/
>   ➜  Network: http://xxx.xxx.xxx.xxx:3000/
> ```

### 🎉 Truy cập ứng dụng

Mở trình duyệt và truy cập: **http://localhost:3000**

> ⚠️ **Lưu ý**: Cần chạy **cả Backend (port 5000) VÀ Frontend (port 3000)** cùng lúc.

---

## 🌐 Sử dụng bản Web Online

Bản demo đã được deploy và sẵn sàng sử dụng tại:

### 🔗 **[https://salonhub-soe.vercel.app](https://salonhub-soe.vercel.app/)**

#### Hướng dẫn sử dụng nhanh:

**Bước 1 — Truy cập trang web**
- Mở trình duyệt (Chrome, Edge, Firefox, Safari)
- Truy cập link: https://salonhub-soe.vercel.app

**Bước 2 — Đăng nhập / Đăng ký**
- Nhấn nút **Đăng nhập** ở góc phải trên cùng
- Sử dụng tài khoản demo (xem bên dưới) hoặc đăng ký tài khoản mới
- Hỗ trợ đăng nhập bằng Google

**Bước 3 — Khám phá tính năng**

| Trang | URL | Mô tả |
|-------|-----|-------|
| 🏠 Trang chủ | `/` | Giới thiệu salon, dịch vụ nổi bật |
| 💇 Dịch vụ | `/services` | Xem tất cả dịch vụ cắt tóc |
| 🛍️ Sản phẩm | `/products` | Xem & mua sản phẩm chăm sóc tóc |
| 📅 Đặt lịch | `/book-appointment` | Đặt lịch cắt tóc *(cần đăng nhập)* |
| 🛒 Giỏ hàng | `/cart` | Xem giỏ hàng & thanh toán *(cần đăng nhập)* |
| 📞 Liên hệ | `/contact` | Gửi phản hồi |
| 👤 Hồ sơ | `/profile` | Xem & chỉnh sửa thông tin cá nhân *(cần đăng nhập)* |
| 📋 Lịch hẹn | `/my-appointments` | Xem lịch sử đặt lịch *(cần đăng nhập)* |
| 📦 Đơn hàng | `/my-orders` | Theo dõi đơn hàng *(cần đăng nhập)* |
| 🔔 Thông báo | `/notifications` | Xem thông báo *(cần đăng nhập)* |

**Bước 4 — Truy cập trang quản trị** *(dành cho Admin/Staff)*
- Đăng nhập bằng tài khoản admin hoặc nhân viên
- Truy cập: https://salonhub-soe.vercel.app/admin
- Dashboard sẽ tự động hiển thị theo vai trò đăng nhập

> ⚠️ **Lưu ý**: Bản online sử dụng backend trên Render (free tier). Nếu server chưa hoạt động, request đầu tiên có thể mất **30–60 giây** để khởi động (cold start).

---

## 🔑 Tài khoản Demo

> **Mật khẩu mặc định cho tất cả tài khoản:** `123456`

### Quản trị & Quản lý

| Vai trò | Email | Tên |
|---------|-------|-----|
| 🛡️ Admin | `admin@salonhub.vn` | System Administrator |
| 💰 Kế toán CS1 | `ketoancs1@salonhub.vn` | Lê Thị Minh Anh |
| 💰 Kế toán CS2 | `ketoancs2@salonhub.vn` | Hoàng Thùy Linh |
| 🏭 Thủ kho CS1 | `khocs1@salonhub.vn` | Phạm Gia Bách |
| 🏭 Thủ kho CS2 | `khocs2@salonhub.vn` | Nguyễn Đình Trọng |

### Nhân viên (Staff)

| Vai trò | Email | Tên |
|---------|-------|-----|
| ✂️ Thợ cắt CS1 | `thocatcs11@salonhub.vn` | Chu Hữu Hưng |
| ✂️ Thợ cắt CS1 | `thocatcs12@salonhub.vn` | Đỗ Minh Hiếu |
| ✂️ Thợ cắt CS2 | `thocatcs21@salonhub.vn` | Nguyễn Nhật Minh |
| ✂️ Thợ cắt CS2 | `thocatcs22@salonhub.vn` | Trần Nhật Nam |

### Khách hàng

| Vai trò | Email | Tên |
|---------|-------|-----|
| 👤 Khách hàng | `nhatminhthcslt@gmail.com` | Minh Nguyễn Nhật |

---

## 📡 API Endpoints

Backend API được tổ chức theo các module sau:

| Module | Endpoint | Mô tả |
|--------|----------|-------|
| Auth | `/api/auth/*` | Đăng nhập, đăng ký, xác thực |
| Services | `/api/services/*` | CRUD dịch vụ |
| Products | `/api/products/*` | CRUD sản phẩm |
| Appointments | `/api/appointments/*` | Đặt lịch hẹn |
| Orders | `/api/orders/*` | Quản lý đơn hàng |
| Cart | `/api/cart/*` | Giỏ hàng |
| Payments | `/api/payments/*` | Thanh toán |
| Branches | `/api/branches/*` | Chi nhánh |
| Staff | `/api/staff/*` | Nhân viên |
| Customers | `/api/customers/*` | Khách hàng |
| Vouchers | `/api/vouchers/*` | Mã giảm giá |
| Reviews | `/api/reviews/*` | Đánh giá |
| Inventory | `/api/inventory/*` | Kho hàng |
| Notifications | `/api/notifications/*` | Thông báo |
| Dashboard | `/api/dashboard/*` | Thống kê |
| Chat | `/api/chat/*` | Chat / AI assistant |
| Addresses | `/api/addresses/*` | Địa chỉ giao hàng |
| Returns | `/api/returns/*` | Hoàn trả |

> 🔗 Health check: `GET /api/health`

---

## 💳 Thanh toán

Hệ thống hỗ trợ thanh toán chuyển khoản ngân hàng qua **SePay**:

| Thông tin | Chi tiết |
|-----------|----------|
| Ngân hàng | TPBank (Ngân hàng Tiên Phong) |
| Số tài khoản | `88886352274` |
| Chủ tài khoản | `NGUYEN NHAT MINH` |
| Phương thức | Quét mã QR hoặc chuyển khoản nhanh 24/7 |

---

## 📝 Ghi chú thêm

- **Frontend** được deploy trên [Vercel](https://vercel.com/) với cấu hình SPA routing qua `vercel.json`
- **Backend** được deploy trên [Render](https://render.com/) (free tier)
- **Database** sử dụng MySQL (có thể dùng TiDB Cloud cho production)
- **Hình ảnh** được lưu trữ trên [Cloudinary](https://cloudinary.com/)
- **Realtime** sử dụng Socket.IO cho thông báo và chat
- **Redis** được dùng cho caching (tuỳ chọn, hệ thống vẫn hoạt động nếu không có Redis)

---

## 👨‍💻 Tác giả

Dự án được phát triển bởi nhóm sinh viên.

📧 Liên hệ: [admin@salonhub.vn](mailto:admin@salonhub.vn)

---

<p align="center">
  Made with ❤️ by SalonHub Team
</p>
