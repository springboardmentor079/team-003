# BuildTrack: Construction Project Management Backend & Database Platform

BuildTrack is a production-ready, full-stack REST API & database solution built with **Python FastAPI** and **SQLAlchemy / PostgreSQL** (with automatic SQLite fallback for local zero-config testing).

It covers all project monitoring lifecycle milestones including:
- **Authentication & RBAC** (JWT authentication with Administrator, Project Manager, Site Engineer, Contractor, and Client roles)
- **Project & Milestone Management** (Project creation, tracking, status updates, progress metrics)
- **Resource Allocation** (Machinery, heavy equipment, hourly rates, project allocation tracking)
- **Material Inventory & Stock Alerts** (Quantity tracking, unit costs, low stock notifications)
- **Workforce & Daily Attendance** (Worker registries, trades, daily rates, attendance logs)
- **Procurement Lifecycles** (Purchase orders, approval workflows, actual vs estimated costs)
- **Notifications Service** (Real-time system alerts and milestone notifications)
- **Real-time Analytics & Dashboard APIs** (Budget metrics, progress %, worker summaries)
- **Reporting & Document Storage** (Generated reports, content JSON, document metadata)

---

## 🚀 Quick Start Instructions

### 1. Requirements
- Python 3.9+
- Pip / Virtualenv

### 2. Setup Virtual Environment & Install Dependencies
Open PowerShell or Terminal in `c:\Users\VANAM VARSHINI\OneDrive\Desktop\database`:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1   # On Windows PowerShell
pip install -r requirements.txt
```

### 3. Database Configuration
By default, `.env` is pre-configured to use SQLite (`buildtrack.db`) for immediate zero-config local testing:
```ini
DATABASE_URL=sqlite:///./buildtrack.db
```

To run with **PostgreSQL**, simply update `.env` or set the environment variable:
```ini
DATABASE_URL=postgresql://username:password@localhost:5432/buildtrack_db
```

### 4. Run Seeder (Optional - Auto-runs on Startup)
```powershell
python -m app.seed
```

### 5. Start the FastAPI Development Server
```powershell
uvicorn app.main:app --reload --port 8000
```

Access the interactive swagger documentation:
- **Interactive API Documentation (Swagger UI)**: `http://127.0.0.1:8000/docs`
- **ReDoc Documentation**: `http://127.0.0.1:8000/redoc`

---

## 🔑 Pre-seeded Test Credentials

The database seeder generates test accounts for all system roles out of the box:

| Role | Email | Password |
|---|---|---|
| **Administrator** | `admin@buildtrack.com` | `admin123` |
| **Project Manager** | `manager@buildtrack.com` | `manager123` |
| **Site Engineer** | `engineer@buildtrack.com` | `engineer123` |
| **Contractor** | `contractor@buildtrack.com` | `contractor123` |
| **Client** | `client@buildtrack.com` | `client123` |

---

## 🛠️ API Modules & Endpoints Overview

| Module | Base Path | Description |
|---|---|---|
| **Auth** | `/api/v1/auth` | User registration, login (`/login` & `/login/json`), password reset, current user profile (`/me`), user management |
| **Projects** | `/api/v1/projects` | Project CRUD, milestone creation, milestone progress updates, project deletion |
| **Resources** | `/api/v1/resources` | Equipment registry, project allocation (`/allocate/{project_id}`), availability tracking |
| **Inventory** | `/api/v1/inventory` | Material stock levels, unit cost tracking, low stock notification triggers |
| **Workforce** | `/api/v1/workforce` | Worker profiles, trades/skills, daily attendance logs (`/attendance`), shift hours |
| **Procurement** | `/api/v1/procurement` | Purchase requests, status approval workflow (`/status`), supplier tracking |
| **Notifications** | `/api/v1/notifications` | User notifications, unread filter, mark as read endpoints |
| **Analytics** | `/api/v1/analytics` | Real-time project budget utilization, overall progress %, role-specific KPI dashboards |
| **Reports & Docs** | `/api/v1/reports` | Report generation (`/generate`), JSON exports, document uploads (`/documents`) |

---

## 📊 Database Schema Summary (11 Entities)

1. `users`
2. `projects`
3. `project_milestones`
4. `resources`
5. `inventory`
6. `workers`
7. `attendance`
8. `procurements`
9. `notifications`
10. `reports`
11. `documents`
