# Radian HRMS — HR Management System

A full-stack HR Management System built with **React + Tailwind CSS** (frontend) and **Node.js + Express + MongoDB** (backend).

## 🚀 Quick Start

### 1. Install & run backend
```bash
cd backend
npm install
# Create a .env file with: MONGO_URI, JWT_SECRET, PORT
npm start
```

### 2. Install & run frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Seed the database (optional)
```bash
cd backend
node seed.js
```

## 🌐 Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS v3
- **Backend**: Node.js, Express, MongoDB, Mongoose, JWT

## 📦 Features
- 🔐 JWT Auth with role-based access (Employee / Manager / HR / Admin)
- 📊 Real-time dashboard with KPIs
- 📅 Attendance clock-in / clock-out
- 📋 Leave requests and approvals workflow
- 👥 Employee directory management
- 🌙 Dark / Light mode
- 📱 Responsive design
