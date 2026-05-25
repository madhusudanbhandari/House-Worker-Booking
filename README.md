<div align="center">

# 🏠 House Worker Booking

**A full-stack platform connecting customers with skilled home service workers — book, manage, and review with ease.**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Django](https://img.shields.io/badge/Django-REST-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.django-rest-framework.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=json-web-tokens&logoColor=white)](https://jwt.io/)

[Features](#-features) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [API Overview](#-api-overview) · [Project Structure](#-project-structure)

</div>

---

## 📖 About

**House Worker Booking** is a two-sided marketplace web application that bridges the gap between homeowners who need reliable household services and skilled workers who offer them. Customers can search for workers by service category, view profiles, schedule bookings, track status in real time, make payments, and leave reviews — all from a clean, modern interface.

Workers get their own dashboard to manage the services they offer, set availability, accept or reject incoming booking requests, and build their reputation through ratings.

---

## ✨ Features

### 👤 For Customers
- 🔍 **Search Workers** — filter by service type, area, and availability
- 📅 **Book Services** — schedule appointments with date, time, address, and notes
- 📋 **Track Bookings** — view full booking history with live status updates
- ⭐ **Rate & Review** — leave a 1–5 star rating and comment after a completed job
- 👤 **Profile Management** — update personal info and preferences

### 🔧 For Workers
- 🛠️ **Manage Services** — add, edit, or deactivate the services you offer with custom pricing and duration
- 🗓️ **Set Availability** — define available days and hours of the week
- ✅ **Handle Bookings** — accept, reject (with reason), or mark jobs as in-progress or completed
- 📊 **Worker Dashboard** — overview of all bookings and earnings
- 🌟 **Reputation System** — average rating auto-calculated from customer reviews

### 🔐 Authentication & Security
- JWT-based authentication (access + refresh tokens)
- Role-based access control: `customer` vs `worker` roles
- Protected routes on both frontend and backend

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **Vite** | Build tool & dev server |
| **Tailwind CSS 3** | Utility-first styling |
| **Redux Toolkit** | Global state management |
| **TanStack Query (React Query v5)** | Server state, caching & data fetching |
| **React Router DOM v7** | Client-side routing |
| **React Hook Form** | Form management & validation |
| **Axios** | HTTP client |

### Backend
| Technology | Purpose |
|---|---|
| **Django** | Web framework |
| **Django REST Framework** | RESTful API layer |
| **Simple JWT** | JWT authentication |
| **MySQL** | Production database |
| **django-cors-headers** | CORS handling |

---

## 📁 Project Structure

```
House-Worker-Booking/
│
├── backend/
│   └── backend/
│       ├── accounts/          # Custom User model, registration & auth
│       ├── services/          # Categories, Services, Worker services & availability
│       ├── bookings/          # Booking model + status history tracking
│       ├── reviews/           # Reviews & auto-calculated worker ratings
│       ├── payments/          # Payment records
│       └── backend/           # Django settings, root URLs, WSGI/ASGI
│
└── frontend/
    └── frontend/
        ├── src/
        │   ├── api/           # Axios API modules (auth, bookings, services, reviews)
        │   ├── pages/
        │   │   ├── auth/      # Login & Register pages
        │   │   ├── customer/  # Dashboard, Search Workers, My Bookings, Worker Detail
        │   │   ├── worker/    # Worker Dashboard, Manage Services
        │   │   └── shared/    # Profile Page, Home Page, 404
        │   ├── store/         # Redux store & slices
        │   └── utils/         # ProtectedRoute component
        ├── tailwind.config.js
        └── vite.config.js
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- MySQL server running locally

---

### 🔧 Backend Setup

```bash
# 1. Navigate to the backend directory
cd backend/backend

# 2. Create and activate a virtual environment
python -m venv env
source env/bin/activate        # On Windows: env\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set up your environment variables
#    Create a .env file inside backend/backend/ with:
```

```env
SECRET_KEY=your_django_secret_key
DEBUG=True
MYSQLDATABASE=your_db_name
MYSQLUSER=your_db_user
MYSQLPASSWORD=your_db_password
MYSQLHOST=localhost
MYSQLPORT=3306
```

```bash
# 5. Apply database migrations
python manage.py migrate

# 6. Create a superuser (optional, for Django Admin)
python manage.py createsuperuser

# 7. Run the development server
python manage.py runserver
```

The API will be live at `http://localhost:8000/`

---

### 💻 Frontend Setup

```bash
# 1. Navigate to the frontend directory
cd frontend/frontend

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

The app will be live at `http://localhost:5173/`

> **Note:** Make sure the backend server is running before starting the frontend.

---

## 📡 API Overview

| Module | Base Path | Description |
|---|---|---|
| Auth | `/api/auth/` | Register, login, token refresh |
| Services | `/api/services/` | Categories, services, worker services & availability |
| Bookings | `/api/bookings/` | Create, list, update booking status |
| Reviews | `/api/reviews/` | Submit and retrieve reviews |
| Payments | `/api/payments/` | Payment records |

### Booking Status Flow

```
PENDING → ACCEPTED → IN_PROGRESS → COMPLETED
       ↘ REJECTED
       ↘ CANCELLED
```

---

## 🗃️ Database Models at a Glance

**Booking** — links a `customer` → `worker` → `service`, stores address, schedule, total price, and a full `BookingStatusHistory` log.

**Service** — belongs to a `Category`; workers create a `WorkerService` record with their own custom price and duration.

**WorkerAvailability** — per-day-of-week schedule slots (`start_time` / `end_time`) per worker.

**Review** — one review per completed booking; automatically recalculates the worker's `avg_rating` on save.

---

## 🌐 Deployment

The backend is configured for deployment on **Railway** (MySQL) and the frontend on **Render**.

- Backend live: `https://house-worker-booking-1.onrender.com`

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to fork the repo and submit a pull request.

1. Fork the project
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 👨‍💻 Author

**Madhusudan Bhandari**

[![GitHub](https://img.shields.io/badge/GitHub-madhusudanbhandari-181717?style=flat-square&logo=github)](https://github.com/madhusudanbhandari)

---

<div align="center">

</div>