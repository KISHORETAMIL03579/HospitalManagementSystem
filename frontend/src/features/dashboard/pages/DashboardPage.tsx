import React, { useState, useEffect } from "react";
import { usePatients } from "../../patients/hooks/usePatients";
import { useDoctors, useDepartments } from "../../doctors/hooks/useDoctors";
import { useAppointments } from "../../appointments/hooks/useAppointments";
import { useAuth } from "../../auth/hooks/useAuth";
import { formatDate, calculateAge } from "../../../lib/utils";
import { Link } from "react-router-dom";
import {
  Users,
  UserPlus,
  Calendar,
  Stethoscope,
  Activity,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Clock,
  Building,
  CheckCircle,
} from "lucide-react";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  // Real-time API Queries
  const { data: patientData, isLoading: isPatientsLoading } = usePatients(
    "",
    1,
    5,
  );
  const { data: doctors, isLoading: isDoctorsLoading } = useDoctors();
  const { data: departments, isLoading: isDeptsLoading } = useDepartments();
  const { data: appointments, isLoading: isAppointmentsLoading } =
    useAppointments();

  // Real-time Live Clock state
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Computed Real-time Metrics
  const totalPatientsCount = patientData?.totalCount ?? 0;
  const totalDoctorsCount = doctors?.length ?? 0;
  const activeDoctorsCount = doctors?.filter((d) => d.isActive).length ?? 0;
  const totalDepartmentsCount = departments?.length ?? 0;
  const totalAppointmentsCount = appointments?.length ?? 0;

  // Filter today's appointments
  const todayDateString = new Date().toISOString().split("T")[0];
  const todayAppointments =
    appointments?.filter((a) =>
      a.appointmentDate.startsWith(todayDateString),
    ) ?? [];
  const todayScheduledCount = todayAppointments.filter(
    (a) => a.status === 0 || a.status === 1,
  ).length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner with Live Real-time Clock */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold border border-blue-400/20 mb-3">
              <Activity className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span>CareFlow Hospital Operating System</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome back, {user?.fullName || "Hospital Staff"}! 👋
            </h1>
            <p className="text-blue-200 text-sm mt-1">
              Signed in as{" "}
              <span className="font-semibold text-white capitalize">
                {user?.roleName || "Staff"}
              </span>
              . Here is your live hospital overview.
            </p>
          </div>

          {/* Real-time Clock Widget */}
          <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
            <div className="flex items-center gap-2 bg-blue-950/60 backdrop-blur border border-blue-400/20 px-4 py-2 rounded-xl">
              <Clock className="w-4 h-4 text-blue-400 animate-pulse" />
              <div className="text-sm font-mono font-semibold tracking-wide">
                {currentTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </div>
              <div className="text-xs text-blue-300 font-sans border-l border-blue-400/30 pl-2">
                {currentTime.toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            </div>

            <Link
              to="/patients/new"
              className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white font-medium rounded-xl text-sm shadow-md flex items-center gap-2 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register New Patient</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Real-time Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Patients */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Patients
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800">
            {isPatientsLoading ? "..." : totalPatientsCount}
          </div>
          <div className="text-xs text-emerald-600 flex items-center gap-1 mt-1 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Active registered records</span>
          </div>
        </div>

        {/* Metric 2: Appointments */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Appointments
            </span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800">
            {isAppointmentsLoading ? "..." : `${totalAppointmentsCount} Total`}
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{todayScheduledCount} pending today</span>
          </div>
        </div>

        {/* Metric 3: Doctors On Duty */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Doctors On Duty
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Stethoscope className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800">
            {isDoctorsLoading ? "..." : `${activeDoctorsCount} Active`}
          </div>
          <div className="text-xs text-emerald-600 flex items-center gap-1 mt-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>
              Across {isDeptsLoading ? "..." : totalDepartmentsCount}{" "}
              Departments
            </span>
          </div>
        </div>

        {/* Metric 4: System Status */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              System Status
            </span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 flex items-center gap-2">
            <span>Online</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <div className="text-xs text-slate-500 mt-1">
            API v1 & Database connected
          </div>
        </div>
      </div>

      {/* Main Real-time Data Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Patient Registrations (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-bold text-slate-800 text-base">
                Recent Patient Registrations
              </h2>
              <p className="text-xs text-slate-400">
                Latest patient records saved to database
              </p>
            </div>
            <Link
              to="/patients"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="pb-2">MRN</th>
                  <th className="pb-2">Patient Name</th>
                  <th className="pb-2">Age</th>
                  <th className="pb-2">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isPatientsLoading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-4 text-center text-xs text-slate-400"
                    >
                      Loading recent records...
                    </td>
                  </tr>
                ) : !patientData?.items || patientData.items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-6 text-center text-xs text-slate-400"
                    >
                      No patients registered yet.
                    </td>
                  </tr>
                ) : (
                  patientData.items.map((patient) => (
                    <tr
                      key={patient.patientId}
                      className="hover:bg-slate-50/60 transition"
                    >
                      <td className="py-3 font-mono text-xs font-bold text-blue-600">
                        {patient.medicalRecordNumber}
                      </td>
                      <td className="py-3 font-medium text-slate-800">
                        {patient.fullName}
                      </td>
                      <td className="py-3 text-slate-500">
                        {calculateAge(patient.dateOfBirth)} yrs
                      </td>
                      <td className="py-3 text-xs text-slate-400">
                        {formatDate(patient.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Appointments Preview & Quick Actions (1 Col) */}
        <div className="space-y-6">
          {/* Upcoming Appointments */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-bold text-slate-800 text-base">
                  Recent Appointments
                </h2>
                <p className="text-xs text-slate-400">
                  Scheduled patient visits
                </p>
              </div>
              <Link
                to="/appointments"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {isAppointmentsLoading ? (
                <div className="text-xs text-slate-400 py-4 text-center">
                  Loading appointments...
                </div>
              ) : !appointments || appointments.length === 0 ? (
                <div className="text-xs text-slate-400 py-4 text-center">
                  No appointments booked yet.
                </div>
              ) : (
                appointments.slice(0, 4).map((apt) => (
                  <div
                    key={apt.appointmentId}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">
                        {apt.patientName}
                      </div>
                      <div className="text-slate-500 flex items-center gap-1 mt-0.5">
                        <Stethoscope className="w-3 h-3 text-indigo-500" />
                        {apt.doctorName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-medium text-slate-700">
                        {apt.timeSlot}
                      </div>
                      <span className="inline-block mt-0.5 text-[10px] px-2 py-0.5 rounded font-semibold bg-indigo-50 text-indigo-700">
                        {apt.statusName}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h2 className="font-bold text-slate-800 text-sm">
              Quick Operations
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/patients/new"
                className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition"
              >
                <UserPlus className="w-5 h-5 text-blue-600" />
                <span>New Patient</span>
              </Link>
              <Link
                to="/appointments"
                className="p-3 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition"
              >
                <Calendar className="w-5 h-5 text-purple-600" />
                <span>Book Visit</span>
              </Link>
              <Link
                to="/doctors"
                className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition"
              >
                <Stethoscope className="w-5 h-5 text-emerald-600" />
                <span>Doctors</span>
              </Link>
              <Link
                to="/patients"
                className="p-3 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition"
              >
                <Users className="w-5 h-5 text-amber-600" />
                <span>Patients</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
