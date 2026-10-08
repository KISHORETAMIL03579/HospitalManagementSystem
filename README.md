# CareFlow Hospital Management System (HMS)

> A modern, production-grade **Hospital Management System** built with **ASP.NET Core 10**, **SQL Server**, **Entity Framework Core**, and **React 19 + TypeScript (Vite)** adhering to **Clean Architecture** and **Feature-Sliced Frontend Design**.

[![.NET 10 Build & Test](https://github.com/KISHORETAMIL03579/HospitalManagementSystem/actions/workflows/dotnet.yml/badge.svg)](https://github.com/KISHORETAMIL03579/HospitalManagementSystem)
![React 19](https://img.shields.io/badge/React-19.0-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)
![SQL Server](https://img.shields.io/badge/SQL_Server-2022-red?logo=microsoftsqlserver)

---

## 🏛️ System Architecture

```
                       ┌───────────────────────────────────────┐
                       │          React + TS (Vite)            │
                       │ TanStack Query │ React Hook Form │ Zod│
                       └───────────────────┬───────────────────┘
                                           │ HTTPS / JSON (/api/v1)
                                           ▼
                       ┌───────────────────────────────────────┐
                       │         ASP.NET Core Web API          │
                       │    Controllers / Serilog / Cors       │
                       └───────────────────┬───────────────────┘
                                           │
                                           ▼
                       ┌───────────────────────────────────────┐
                       │   HospitalManagement.Application      │
                       │  Use Cases / DTOs / Validators        │
                       └───────────────────┬───────────────────┘
                                           │
                                           ▼
                       ┌───────────────────────────────────────┐
                       │      HospitalManagement.Domain        │
                       │ Entities / Business Rules / Enums     │
                       └───────────────────┬───────────────────┘
                                           ▲
                                           │
                       ┌───────────────────┴───────────────────┐
                       │   HospitalManagement.Infrastructure   │
                       │     EF Core / SQL Server Repository   │
                       └───────────────────┬───────────────────┘
                                           │
                                           ▼
                                   ┌───────────────┐
                                   │  SQL Server   │
                                   └───────────────┘
```

---

## 🚀 Key Features (Milestone 1 — Patient Vertical Slice)

- **Patient Registration**: Demographics, contact info, date of birth, gender selection, and emergency contacts.
- **Automated MRN Generation**: Formatted unique Medical Record Numbers (e.g. `MRN-2026-00001`).
- **Patient Directory & Search**: Real-time filtering by Name, Phone, or MRN with paginated table view.
- **Dual Validation Layer**: Client-side form validation via **Zod** + Server-side validation via **FluentValidation**.
- **Server State Caching**: **TanStack Query (v5)** automatic query invalidation and optimistic updates.
- **Structured Logging**: Integrated **Serilog** for application event tracking.

---

## 🛠️ Technology Stack

| Layer | Technology / Libraries |
| :--- | :--- |
| **Frontend Framework** | React 19 + TypeScript 5.8 + Vite |
| **UI & Styling** | Tailwind CSS v4 + Lucide Icons |
| **State & Data Fetching** | TanStack Query v5 + Axios |
| **Forms & Validation** | React Hook Form + Zod |
| **Backend Framework** | ASP.NET Core 10 Web API |
| **ORM & Database** | Entity Framework Core 10 + SQL Server |
| **Backend Validation** | FluentValidation |
| **Testing** | xUnit + Moq |

---

## 📁 Repository Structure

```
HospitalManagement.slnx
│
├── HospitalManagement.Api/             # Web API Controllers, Cors, Serilog
├── HospitalManagement.Application/     # Application Services, DTOs, Validators
├── HospitalManagement.Domain/          # Core Domain Entities & Business Rules
├── HospitalManagement.Infrastructure/   # DbContext, EF Core Configurations & Repositories
├── HospitalManagement.Tests/           # xUnit Unit & Integration Tests
│
└── frontend/                           # React + TypeScript Vite Application
    └── src/
        ├── app/                        # Router, QueryClient, Providers
        ├── components/                 # Shared UIPrimitives & Layout Shell
        ├── features/                   # Feature-sliced domain modules (patients, auth, etc.)
        └── lib/                        # Axios client & formatters
```

---

## 🚦 Getting Started

### Prerequisites
- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Node.js (v20+)](https://nodejs.org/)
- [SQL Server](https://www.microsoft.com/sql-server/) (or LocalDB)

### 1. Database & Backend Setup
```powershell
# Restore dependencies and build solution
dotnet build HospitalManagement.slnx

# Apply EF Core migrations to SQL Server (Database: HMS)
dotnet ef database update --project HospitalManagement.Infrastructure --startup-project HospitalManagement.Api

# Run ASP.NET Core API (Server starts at http://localhost:5000)
dotnet run --project HospitalManagement.Api\HospitalManagement.Api.csproj
```

### 2. Frontend Setup
```powershell
cd frontend

# Install npm dependencies
npm install

# Start development server (UI starts at http://localhost:5173)
npm run dev
```

---

## 🧪 Running Unit Tests

```powershell
dotnet test HospitalManagement.slnx
```

---

## 🗺️ Roadmap & Documentation

For the complete 12-Phase Implementation Roadmap and detailed architectural flow, view [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md).

---

## 📝 License
This project is licensed under the MIT License.

