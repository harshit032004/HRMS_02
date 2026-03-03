# Radian HRMS — Full Stack MERN Application

A complete Human Resource Management System built with MongoDB, Express.js, React, and Node.js.

---

## 📁 Project Structure

```
hrms/
├── backend/                  # Express + MongoDB API
│   ├── models/
│   │   ├── User.js           # User schema (employees, roles)
│   │   ├── Attendance.js     # Attendance records schema
│   │   └── Leave.js          # Leave application schema
│   ├── routes/
│   │   ├── auth.js           # Login, register, JWT auth
│   │   ├── employees.js      # Employee CRUD
│   │   ├── attendance.js     # Clock in/out, history
│   │   ├── leaves.js         # Apply, approve, reject leaves
│   │   └── dashboard.js      # Stats endpoints
│   ├── middleware/
│   │   └── auth.js           # JWT protect + role-based authorize
│   ├── seed.js               # Database seeder script
│   ├── server.js             # Express app entry point
│   └── .env                  # Environment variables
│
└── frontend/                 # React + Vite SPA
    └── src/
        ├── context/
        │   └── AuthContext.jsx   # Global auth state (JWT, user)
        ├── utils/
        │   └── api.js            # Axios instance with interceptors
        ├── components/
        │   └── Sidebar.jsx       # Navigation sidebar
        ├── pages/
        │   ├── Login.jsx         # Login page
        │   ├── Dashboard.jsx     # Admin or employee dashboard
        │   ├── Attendance.jsx    # Clock in/out + history
        │   ├── Employees.jsx     # Employee CRUD (admin/HR only)
        │   ├── Leaves.jsx        # Apply for leave + my history
        │   ├── LeaveApprovals.jsx # Approve/reject leaves (managers)
        │   └── Settings.jsx      # Profile + password change
        └── App.jsx               # Routes + auth guards
```

---

## 🏗️ System Architecture

### Client-Server Architecture
- **Frontend**: React SPA served by Vite dev server (port 5173)
- **Backend**: Express REST API server (port 5000)
- **Database**: MongoDB (local or Atlas)
- **Communication**: Axios HTTP client with JWT Bearer tokens

### MVC Pattern (Backend)
- **Models**: Mongoose schemas (`/models`) — data structure & validation
- **Views**: JSON API responses (REST)
- **Controllers**: Route handlers (`/routes`) — business logic

### Authentication Flow
1. User submits email/password → `POST /api/auth/login`
2. Server validates credentials, returns JWT token + user object
3. Frontend stores token in `localStorage`
4. Every API request includes `Authorization: Bearer <token>` header
5. `protect` middleware verifies JWT on protected routes
6. `authorize(...roles)` middleware checks user role

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js v18+
- MongoDB (local) or MongoDB Atlas account
- npm or yarn

### 1. Clone & Configure Backend

```bash
cd hrms/backend
npm install
```

Edit `.env` if needed:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/radian_hrms
JWT_SECRET=radian_hrms_super_secret_jwt_key_2024
JWT_EXPIRE=7d
```

### 2. Seed the Database

```bash
node seed.js
```

This creates:
| Email | Password | Role |
|-------|----------|------|
| admin@example.com | admin123 | admin |
| hr@radianmarketing.com | hr123456 | hr |
| shivam@radianmarketing.com | password123 | employee |
| vaibhav@radianmarketing.com | password123 | employee |
| amit@radianmarketing.com | password123 | employee |

### 3. Start Backend

```bash
npm run dev     # development (nodemon)
# or
npm start       # production
```

Server starts at `http://localhost:5000`

### 4. Setup & Start Frontend

```bash
cd hrms/frontend
npm install
npm run dev
```

Frontend starts at `http://localhost:5173`

---

## 🔐 Role-Based Access Control

| Feature | Employee | Manager | HR | Admin |
|---------|----------|---------|-----|-------|
| View own attendance | ✅ | ✅ | ✅ | ✅ |
| View all attendance | ❌ | ✅ | ✅ | ✅ |
| Apply for leave | ✅ | ✅ | ✅ | ✅ |
| Approve/reject leaves | ❌ | ✅ | ✅ | ✅ |
| View employee list | ❌ | ✅ | ✅ | ✅ |
| Create employees | ❌ | ❌ | ✅ | ✅ |
| Deactivate employees | ❌ | ❌ | ❌ | ✅ |

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/register` | Register new user |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/change-password` | Change password |

### Employees
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employees` | List all employees |
| POST | `/api/employees` | Create employee |
| PUT | `/api/employees/:id` | Update employee |
| DELETE | `/api/employees/:id` | Deactivate employee |

### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/attendance/checkin` | Clock in |
| PUT | `/api/attendance/checkout` | Clock out |
| GET | `/api/attendance/today` | Today's status |
| GET | `/api/attendance/my` | Own history |
| GET | `/api/attendance/all` | All employees (manager+) |

### Leaves
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/leaves/apply` | Apply for leave |
| GET | `/api/leaves/my` | Own leave history |
| GET | `/api/leaves/all` | All leaves (manager+) |
| PUT | `/api/leaves/:id/review` | Approve/reject |
| DELETE | `/api/leaves/:id` | Cancel pending leave |

---

## 🧠 Key Design Decisions

### Password Security
- bcryptjs with salt rounds = 10
- Passwords never returned in API responses (`select: false`)

### JWT Strategy
- Token stored in `localStorage` (simple, no cookies needed)
- Axios interceptor auto-attaches token to all requests
- Auto-redirect to `/login` on 401 response

### Attendance Work Hours
- Calculated in Mongoose `pre('save')` hook
- Auto-sets status: `present` (≥8h), `half-day` (≥4h)
- Compound index on `{employee, date}` prevents duplicate check-ins

### Leave Total Days
- Auto-calculated in `pre('save')` hook on Leave model

### Soft Delete
- Employees are never hard-deleted; `isActive: false` is set instead
- Preserves historical attendance/leave data integrity
