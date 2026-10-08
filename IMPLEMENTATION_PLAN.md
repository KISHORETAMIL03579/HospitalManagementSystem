# Hospital Management System (HMS) — Implementation Plan & Production Architecture

## 1. Overall System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       React + TypeScript (Vite)                             │
│                                                                             │
│   React Router  │  TanStack Query  │  React Hook Form + Zod  │  Tailwind CSS    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTPS / JSON (/api/v1)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ASP.NET Core Web API                              │
│                Authentication / Authorization / Middleware                   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         HospitalManagement.Application                       │
│             Use Cases / Handlers / DTOs / Validators / Interfaces            │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           HospitalManagement.Domain                         │
│               Entities / Business Rules / Value Objects / Enums              │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       ▲
                                       │
┌──────────────────────────────────────┴──────────────────────────────────────┐
│                       HospitalManagement.Infrastructure                     │
│            EF Core DbContext / Repositories / SQL Server Persistence        │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
                            ┌───────────────────┐
                            │    SQL Server     │
                            └───────────────────┘
```

---

## 2. Refined Feature-Based Folder Structure

### Frontend (`frontend/src/`)
```
frontend/
├── src/
│   ├── app/
│   │   ├── router.tsx             # React Router route definitions & guards
│   │   ├── providers.tsx          # QueryClientProvider, AuthProvider, ToastProvider
│   │   └── queryClient.ts         # TanStack Query client configuration
│   │
│   ├── components/                # Shared global UI components
│   │   ├── ui/                    # Base atomic UI primitives (Button, Input, Table, Modal)
│   │   ├── layout/                # App Shell, Header, Sidebar, UserMenu
│   │   └── common/                # ErrorBoundary, PageHeader, LoadingSkeleton
│   │
│   ├── features/                  # Feature-sliced domain modules
│   │   ├── auth/                  # Login, JWT, Refresh Tokens, Role Guards
│   │   ├── patients/              # Patient registration, directory table, search, hooks
│   │   ├── doctors/               # Doctor directory & schedules
│   │   ├── appointments/          # Calendar grid & booking modal
│   │   ├── encounters/            # EHR & clinical notes
│   │   ├── prescriptions/         # Rx generator & print templates
│   │   ├── laboratory/            # Lab test requests & results viewer
│   │   └── billing/               # Invoices & payment collection
│   │
│   ├── lib/
│   │   ├── axios.ts               # Configured Axios instance with auth interceptors
│   │   ├── utils.ts               # Tailwind cn utility, formatters
│   │   └── constants.ts           # API URLs, app configurations
│   │
│   └── main.tsx
```

### Backend (`HospitalManagement.slnx`)
```
HospitalManagement.sln
│
├── HospitalManagement.Api/            # Controllers, Program.cs, Middleware, Filters
│
├── HospitalManagement.Application/    # Business Modules (Patients, Doctors, Appointments, etc.)
│   ├── Patients/                      # Commands, Queries, Handlers, DTOs, Validators
│   ├── Doctors/
│   ├── Appointments/
│   ├── Common/                        # Interfaces (IRepository, IUnitOfWork), Exceptions
│   └── DependencyInjection.cs
│
├── HospitalManagement.Domain/         # Domain Entities, Enums, Rules
│   ├── Entities/                      # Patient, Doctor, Appointment
│   ├── ValueObjects/                  # MedicalRecordNumber, Address, Money
│   └── Common/                        # BaseEntity, AggregateRoot
│
├── HospitalManagement.Infrastructure/  # EF Core, Repositories, SQL Server DbContext
│   ├── Persistence/                   # HospitalDbContext, Configurations, Migrations
│   ├── Repositories/                  # PatientRepository, DoctorRepository
│   └── DependencyInjection.cs
│
└── HospitalManagement.Tests/          # Unit & Integration Tests (xUnit, Moq)
```

---

## 3. Milestone 1: Patient Registration End-to-End Vertical Slice

### Detailed Patient Registration Execution Flow

```
                RECEPTIONIST
                     │
                     ↓
         React Form (PatientForm.tsx)
                     │
                     ↓
          Zod Client Validation
                     │
                     ↓
        POST /api/v1/patients (Axios)
                     │
                     ↓
            ASP.NET Core API
       (Auth & Serilog Middleware)
                     │
                     ↓
        PatientController.Create()
                     │
                     ↓
       CreatePatientCommandHandler
                     │
                     ↓
         FluentValidation Check
                     │
                     ↓
       Patient Entity & Domain Rules
                     │
                     ↓
            IPatientRepository
                     │
                     ↓
      PatientRepository (EF Core)
                     │
                     ↓
               SQL Server
                     │
                     ↓
             Save Changes
                     │
                     ↓
        Return 201 Created (DTO)
                     │
                     ↓
        TanStack Query Cache Invalidation
                     │
                     ↓
     React UI Updates Patient List Table
```

---

## 4. 12-Phase Master Roadmap

```
PHASE 1  ──> Foundation (Clean Architecture + React Vite) [COMPLETED]
PHASE 2  ──> Authentication & Authorization (JWT + Role Guards)
PHASE 3  ──> Patient Vertical Slice [COMPLETED]
PHASE 4  ──> Doctor & Department Management
PHASE 5  ──> Appointment Scheduling Module
PHASE 6  ──> Clinical Encounters & EHR
PHASE 7  ──> Prescriptions & Laboratory Management
PHASE 8  ──> Billing & Invoicing Module
PHASE 9  ──> Production Hardening (Security, Observability, Audit)
PHASE 10 ──> Docker & CI/CD Pipeline
PHASE 11 ──> Staging Deployment & E2E Testing
PHASE 12 ──> Production Release & Monitoring
```
