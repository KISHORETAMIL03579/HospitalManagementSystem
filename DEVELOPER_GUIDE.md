# CareFlow HMS — Developer Quick Reference Guide

The project is cleanly separated into top-level **`frontend/`** and **`backend/`** directories for clear isolation and simple management.

```
HospitalManagementSystem/
├── backend/                              # All .NET Clean Architecture Projects
│   ├── HospitalManagement.Api/           # Web API Controllers, Cors, Serilog, Swagger
│   ├── HospitalManagement.Application/   # Use Cases, DTOs, Validators, Services
│   ├── HospitalManagement.Domain/        # Domain Entities & Business Rules
│   ├── HospitalManagement.Infrastructure/ # EF Core DbContext, Migrations, Repositories
│   ├── HospitalManagement.Tests/         # xUnit Test Suite
│   └── HospitalManagement.slnx           # .NET Solution File
│
└── frontend/                             # React 19 + TypeScript + Vite Application
    ├── src/                              # Feature-sliced frontend modules
    ├── package.json
    └── vite.config.ts
```

---

## 🎨 FRONTEND GUIDE (React 19 + TypeScript + Vite)

### Location
Path: `d:\Projects\HospitalManagementSystem\frontend`

### 1. Environment Setup (Run once per terminal session)
```powershell
$env:Path = "C:\Program Files\nodejs;$env:Path"
```

### 2. Development Server
```powershell
cd d:\Projects\HospitalManagementSystem\frontend
npm run dev
```
*Access UI at: `http://localhost:5173`*

### 3. Production Build
```powershell
cd d:\Projects\HospitalManagementSystem\frontend
npm run build
```

### 4. Code Formatting (Prettier)
```powershell
cd d:\Projects\HospitalManagementSystem\frontend
npm run format
```

---

## ⚙️ BACKEND GUIDE (ASP.NET Core 10 + SQL Server)

### Location
Path: `d:\Projects\HospitalManagementSystem\backend`

### 1. Run Web API Server
```powershell
cd d:\Projects\HospitalManagementSystem\backend
dotnet run --project HospitalManagement.Api\HospitalManagement.Api.csproj
```
*Access API at: `http://localhost:5000`*
*Access Swagger UI at: `http://localhost:5000/swagger`*

### 2. Build Solution
```powershell
cd d:\Projects\HospitalManagementSystem\backend
dotnet build HospitalManagement.slnx
```

### 3. Run Unit Tests
```powershell
cd d:\Projects\HospitalManagementSystem\backend
dotnet test HospitalManagement.slnx
```

### 4. Code Formatting (`dotnet format`)
```powershell
cd d:\Projects\HospitalManagementSystem\backend
dotnet format HospitalManagement.slnx
```

### 5. EF Core Database Migrations (SQL Server: Database `HMS`)
```powershell
cd d:\Projects\HospitalManagementSystem\backend

# Add new migration
dotnet ef migrations add <MigrationName> --project HospitalManagement.Infrastructure --startup-project HospitalManagement.Api

# Update database schema
dotnet ef database update --project HospitalManagement.Infrastructure --startup-project HospitalManagement.Api
```
