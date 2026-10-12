import React, { useState, useEffect, useMemo } from "react";
import { usePatients } from "../../patients/hooks/usePatients";
import { useDoctors, useDepartments } from "../../doctors/hooks/useDoctors";
import { useAppointments } from "../../appointments/hooks/useAppointments";
import { AppointmentStatus } from "../../appointments/types/appointment.types";
import { useAuth } from "../../auth/hooks/useAuth";
import { useSettings } from "../../../hooks/useSettings";
import { calculateAge } from "../../../lib/utils";
import {
  formatTimeSlot,
  formatLiveTime,
  formatDateByPattern,
} from "../../../utils/dateUtils";
import { Link, useNavigate } from "react-router-dom";
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
} from "lucide-react";

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const settings = useSettings();

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
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Computed Real-time Metrics
  const totalPatientsCount = patientData?.totalCount ?? 0;
  const activeDoctorsCount = doctors?.filter((d) => d.isActive).length ?? 0;
  const totalDepartmentsCount = departments?.length ?? 0;
  const totalAppointmentsCount = appointments?.length ?? 0;

  // Filter today's appointments
  const todayDateString = useMemo(
    () => currentTime.toISOString().split("T")[0],
    [currentTime],
  );
  const todayAppointments =
    appointments?.filter((a) =>
      a.appointmentDate.startsWith(todayDateString),
    ) ?? [];
  const todayScheduledCount = todayAppointments.filter(
    (a) =>
      a.status === AppointmentStatus.Confirmed ||
      a.status === AppointmentStatus.CheckedIn ||
      String(a.status) === "Confirmed" ||
      String(a.status) === "CheckedIn",
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
                {formatLiveTime(
                  currentTime,
                  settings.timeFormat,
                  settings.timeZone,
                )}
              </div>
              <div className="text-xs text-blue-300 font-sans border-l border-blue-400/30 pl-2">
                {formatDateByPattern(
                  currentTime,
                  settings.dateFormat,
                  settings.timeZone,
                )}
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
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
              Total Patients
            </span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800 dark:text-white">
            {isPatientsLoading ? "..." : totalPatientsCount}
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Active registered records</span>
          </div>
        </div>

        {/* Metric 2: Appointments */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
              Appointments
            </span>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800 dark:text-white">
            {isAppointmentsLoading ? "..." : `${totalAppointmentsCount} Total`}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{todayScheduledCount} pending today</span>
          </div>
        </div>

        {/* Metric 3: Doctors On Duty */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
              Doctors On Duty
            </span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Stethoscope className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800 dark:text-white">
            {isDoctorsLoading ? "..." : `${activeDoctorsCount} Active`}
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>
              Across {isDeptsLoading ? "..." : totalDepartmentsCount}{" "}
              Departments
            </span>
          </div>
        </div>

        {/* Metric 4: System Status */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
              System Status
            </span>
            <div className="p-2 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <span>Online</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            API v1 & Database connected
          </div>
        </div>
      </div>

      {/* Main Real-time Data Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Patient Registrations (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base">
                Recent Patient Registrations
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-400">
                Latest patient records saved to database
              </p>
            </div>
            <Link
              to="/patients"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm table-fixed">
              <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="w-[28%] py-2.5 text-left pl-3 pr-3 rounded-l-lg">
                    MRN
                  </th>
                  <th className="w-[36%] py-2.5 text-left px-3">
                    Patient Name
                  </th>
                  <th className="w-[16%] py-2.5 text-left px-3">Age</th>
                  <th className="w-[20%] py-2.5 text-right pl-3 pr-3 rounded-r-lg">
                    Registered
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isPatientsLoading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-6 text-center text-xs text-slate-400 dark:text-slate-500"
                    >
                      Loading recent records...
                    </td>
                  </tr>
                ) : !patientData?.items || patientData.items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-8 text-center text-xs text-slate-400 dark:text-slate-500"
                    >
                      No patients registered yet.
                    </td>
                  </tr>
                ) : (
                  patientData.items.map((patient) => (
                    <tr
                      key={patient.patientId}
                      onClick={() => navigate("/patients")}
                      className="hover:bg-blue-50/60 dark:hover:bg-slate-800/80 transition-colors cursor-pointer group"
                      title="Click to view patient directory"
                    >
                      <td className="py-3.5 pl-3 pr-3 font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:underline truncate">
                        {patient.medicalRecordNumber}
                      </td>
                      <td className="py-3.5 px-3 font-medium text-slate-800 dark:text-slate-100 truncate">
                        {patient.fullName}
                      </td>
                      <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {calculateAge(patient.dateOfBirth)} yrs
                      </td>
                      <td className="py-3.5 pl-3 pr-3 text-right text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDateByPattern(
                          patient.createdAt,
                          settings.dateFormat,
                          settings.timeZone,
                        )}
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
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white text-base">
                  Recent Appointments
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-400">
                  Scheduled patient visits
                </p>
              </div>
              <Link
                to="/appointments"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {isAppointmentsLoading ? (
                <div className="text-xs text-slate-400 dark:text-slate-500 py-4 text-center">
                  Loading appointments...
                </div>
              ) : !appointments || appointments.length === 0 ? (
                <div className="text-xs text-slate-400 dark:text-slate-500 py-4 text-center">
                  No appointments booked yet.
                </div>
              ) : (
                appointments.slice(0, 4).map((apt) => (
                  <div
                    key={apt.appointmentId}
                    onClick={() => navigate("/appointments")}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50/50 dark:hover:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600 flex items-center justify-between text-xs cursor-pointer transition-all shadow-2xs group"
                    role="button"
                    tabIndex={0}
                    title="Click to view appointments"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        navigate("/appointments");
                      }
                    }}
                  >
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {apt.patientName}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <Stethoscope className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                        {apt.doctorName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-medium text-slate-700 dark:text-slate-300">
                        {formatTimeSlot(
                          apt.timeSlot,
                          settings.timeFormat,
                          settings.timeZone,
                        )}
                      </div>
                      <span className="inline-block mt-0.5 text-[10px] px-2 py-0.5 rounded font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300">
                        {apt.statusName}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-3">
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">
              Quick Operations
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/patients/new"
                className="p-3 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-800 dark:text-blue-200 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition"
              >
                <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>New Patient</span>
              </Link>
              <Link
                to="/appointments"
                className="p-3 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-800 dark:text-purple-200 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition"
              >
                <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span>Book Visit</span>
              </Link>
              <Link
                to="/doctors"
                className="p-3 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition"
              >
                <Stethoscope className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Doctors</span>
              </Link>
              <Link
                to="/patients"
                className="p-3 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition"
              >
                <Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <span>Patients</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
