import React, { useState, useEffect, useMemo } from "react";
import { usePatients } from "../../patients/hooks/usePatients";
import { useDoctors, useDepartments } from "../../doctors/hooks/useDoctors";
import { useAppointments } from "../../appointments/hooks/useAppointments";
import { AppointmentStatus } from "../../appointments/types/appointment.types";
import { useAuth } from "../../auth/hooks/useAuth";
import { formatRoleDisplay } from "../../auth/types/auth.types";
import { useSettings } from "../../../hooks/useSettings";
import { calculateAge } from "../../../lib/utils";
import {
  formatTimeSlot,
  formatLiveTime,
  formatDateByPattern,
} from "../../../utils/dateUtils";
import { Link, useNavigate } from "react-router-dom";
import { StatusBadge } from "../../../components/common/StatusBadge";
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
  Building2,
  Settings,
  HeartPulse,
} from "lucide-react";

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const settings = useSettings();

  // Role detection: determine if current user is a patient or hospital staff
  const roleLower = (user?.roleName || user?.role || "")
    .toString()
    .toLowerCase()
    .replace(/[\s_-]/g, "");
  const isPatient =
    roleLower === "patient" || user?.hierarchyLevel === 20 || user?.role === 20;
  const isStaff = !isPatient;

  // Real-time API Queries - ONLY fetch patient directory if user is authorized hospital staff!
  const { data: patientData, isLoading: isPatientsLoading } = usePatients(
    "",
    1,
    5,
    { enabled: isStaff },
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
  const activeDoctorsCount =
    doctors?.filter((d) => d.isActive !== false).length ?? 0;
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
              {isPatient ? (
                <HeartPulse className="w-3.5 h-3.5 text-blue-300 animate-pulse" />
              ) : (
                <Activity className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              )}
              <span>
                {isPatient
                  ? "CareFlow Patient Portal"
                  : "CareFlow Hospital Operating System"}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome back,{" "}
              {user?.fullName || (isPatient ? "Patient" : "Hospital Staff")}! 👋
            </h1>
            <p className="text-blue-200 text-sm mt-1">
              Signed in as{" "}
              <span className="font-semibold text-white">
                {formatRoleDisplay(user?.roleName, user?.role)}
              </span>
              .{" "}
              {isPatient
                ? "Here is your personal healthcare portal and scheduled visits."
                : "Here is your live hospital overview."}
            </p>
          </div>

          {/* Real-time Clock Widget & Primary Action */}
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

            {isPatient ? (
              <Link
                to="/appointments"
                className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white font-medium rounded-xl text-sm shadow-md flex items-center gap-2 transition-all"
              >
                <Calendar className="w-4 h-4" />
                <span>Book Appointment</span>
              </Link>
            ) : (
              <Link
                to="/patients/new"
                className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white font-medium rounded-xl text-sm shadow-md flex items-center gap-2 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>Register New Patient</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Real-time Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Patients (Staff) / My Appointments (Patient) */}
        {isPatient ? (
          <div
            onClick={() => navigate("/appointments")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") navigate("/appointments");
            }}
            title="Open my appointments"
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                My Appointments
              </span>
              <div className="p-2.5 bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800 rounded-xl shadow-2xs">
                <Calendar className="w-5 h-5 stroke-[2.2]" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-800 dark:text-white">
              {isAppointmentsLoading ? "..." : totalAppointmentsCount}
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1 mt-1 font-medium">
              <Clock className="w-3.5 h-3.5 stroke-[2]" />
              <span>{todayScheduledCount} scheduled for today</span>
            </div>
          </div>
        ) : (
          <div
            onClick={() => navigate("/patients")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") navigate("/patients");
            }}
            title="Open patient directory"
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Total Patients
              </span>
              <div className="p-2.5 bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 rounded-xl shadow-2xs">
                <Users className="w-5 h-5 stroke-[2.2]" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-800 dark:text-white">
              {isPatientsLoading ? "..." : totalPatientsCount}
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5 stroke-[2]" />
              <span>Active registered records</span>
            </div>
          </div>
        )}

        {/* Metric 2: Today Visits (Patient) / Hospital Appointments (Staff) */}
        {isPatient ? (
          <div
            onClick={() => navigate("/appointments")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") navigate("/appointments");
            }}
            title="View today's visits"
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Today's Visits
              </span>
              <div className="p-2.5 bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 rounded-xl shadow-2xs">
                <Clock className="w-5 h-5 stroke-[2.2]" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-800 dark:text-white">
              {isAppointmentsLoading ? "..." : todayScheduledCount}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-1 font-medium">
              <Activity className="w-3.5 h-3.5 stroke-[2]" />
              <span>Active appointments today</span>
            </div>
          </div>
        ) : (
          <div
            onClick={() => navigate("/appointments")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") navigate("/appointments");
            }}
            title="Open appointments list"
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Appointments
              </span>
              <div className="p-2.5 bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800 rounded-xl shadow-2xs">
                <Calendar className="w-5 h-5 stroke-[2.2]" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-800 dark:text-white">
              {isAppointmentsLoading
                ? "..."
                : `${totalAppointmentsCount} Total`}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
              <Clock className="w-3.5 h-3.5 stroke-[2]" />
              <span>{todayScheduledCount} pending today</span>
            </div>
          </div>
        )}

        {/* Metric 3: Doctors On Duty */}
        <div
          onClick={() => {
            if (isStaff) navigate("/doctors");
            else navigate("/appointments");
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              if (isStaff) navigate("/doctors");
              else navigate("/appointments");
            }
          }}
          title={
            isStaff
              ? "Open doctors directory"
              : "Book appointment with specialists"
          }
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {isPatient ? "Specialists Available" : "Doctors On Duty"}
            </span>
            <div className="p-2.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 rounded-xl shadow-2xs">
              <Stethoscope className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800 dark:text-white">
            {isDoctorsLoading ? "..." : `${activeDoctorsCount} Active`}
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 stroke-[2]" />
            <span>
              Across {isDeptsLoading ? "..." : totalDepartmentsCount}{" "}
              Departments
            </span>
          </div>
        </div>

        {/* Metric 4: Clinical Departments */}
        <div
          onClick={() => {
            if (isStaff) navigate("/doctors");
            else navigate("/appointments");
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              if (isStaff) navigate("/doctors");
              else navigate("/appointments");
            }
          }}
          title={
            isStaff
              ? "View clinical departments & specialists"
              : "Explore hospital departments"
          }
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Clinical Departments
            </span>
            <div className="p-2.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 rounded-xl shadow-2xs">
              <Building2 className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800 dark:text-white">
            {isDeptsLoading ? "..." : `${totalDepartmentsCount} Active`}
          </div>
          <div className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-1 font-medium">
            <Activity className="w-3.5 h-3.5" />
            <span>Specialty care & diagnostics</span>
          </div>
        </div>
      </div>

      {/* Main Real-time Data Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Patient's Appointments (Patient) OR Patient Registrations (Staff) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
          {isPatient ? (
            <>
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white text-base">
                    My Scheduled Appointments
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-slate-400">
                    Your upcoming consultations and healthcare visits
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

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm table-fixed">
                  <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="w-[34%] py-2.5 text-left pl-3 pr-3 rounded-l-lg">
                        Doctor & Specialty
                      </th>
                      <th className="w-[26%] py-2.5 text-left px-3">Reason</th>
                      <th className="w-[22%] py-2.5 text-left px-3">
                        Date & Time
                      </th>
                      <th className="w-[18%] py-2.5 text-right pl-3 pr-3 rounded-r-lg">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {isAppointmentsLoading ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-6 text-center text-xs text-slate-400 dark:text-slate-500"
                        >
                          Loading your appointments...
                        </td>
                      </tr>
                    ) : !appointments || appointments.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-8 text-center text-xs text-slate-400 dark:text-slate-500"
                        >
                          No appointments booked yet. Click "Book Appointment"
                          to schedule your visit.
                        </td>
                      </tr>
                    ) : (
                      appointments.map((apt) => (
                        <tr
                          key={apt.appointmentId}
                          onClick={() =>
                            navigate(
                              `/appointments?appointmentId=${apt.appointmentId}`,
                            )
                          }
                          className="hover:bg-blue-50/60 dark:hover:bg-slate-800/80 transition-colors cursor-pointer group"
                          title="Click to view appointment details"
                        >
                          <td className="py-3.5 pl-3 pr-3 font-medium text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:underline truncate">
                            <div className="font-semibold">
                              {apt.doctorName}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {apt.specialization || "General Consultation"}
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300 truncate">
                            {apt.reason || "Routine Checkup"}
                          </td>
                          <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300 whitespace-nowrap text-xs">
                            <div className="font-medium">
                              {formatDateByPattern(
                                apt.appointmentDate,
                                settings.dateFormat,
                                settings.timeZone,
                              )}
                            </div>
                            <div className="text-slate-500 dark:text-slate-400 font-mono">
                              {formatTimeSlot(
                                apt.timeSlot,
                                settings.timeFormat,
                                settings.timeZone,
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 pl-3 pr-3 text-right whitespace-nowrap">
                            <StatusBadge
                              type="appointment"
                              status={apt.status}
                              size="sm"
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
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
                    ) : !patientData?.items ||
                      patientData.items.length === 0 ? (
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
                          onClick={() =>
                            navigate(`/patients?patientId=${patient.patientId}`)
                          }
                          className="hover:bg-blue-50/60 dark:hover:bg-slate-800/80 transition-colors cursor-pointer group"
                          title="Click to open patient profile"
                        >
                          <td className="py-3.5 pl-3 pr-3 font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:underline truncate">
                            {patient.medicalRecordNumber}
                          </td>
                          <td className="py-3.5 px-3 font-medium text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:underline truncate">
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
            </>
          )}
        </div>

        {/* Right Column (1 Col): Preview & Quick Operations */}
        <div className="space-y-6">
          {/* Upcoming Appointments Preview (Staff only, or Recent for Patients) */}
          {isStaff && (
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
                      onClick={() =>
                        navigate(
                          `/appointments?appointmentId=${apt.appointmentId}`,
                        )
                      }
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50/50 dark:hover:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600 flex items-center justify-between text-xs cursor-pointer transition-all shadow-2xs group"
                      role="button"
                      tabIndex={0}
                      title="Click to open appointment details"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          navigate(
                            `/appointments?appointmentId=${apt.appointmentId}`,
                          );
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
                        <div className="mt-0.5">
                          <StatusBadge
                            type="appointment"
                            status={apt.status}
                            size="sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Quick Operations */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-3">
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">
              {isPatient ? "Quick Navigation" : "Quick Operations"}
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {isPatient ? (
                <>
                  <Link
                    to="/appointments"
                    className="p-3 bg-purple-100/70 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-900 dark:text-purple-200 border border-purple-200/90 dark:border-purple-800 rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 transition shadow-2xs"
                  >
                    <Calendar className="w-5 h-5 text-purple-700 dark:text-purple-300 stroke-[2.2]" />
                    <span>My Visits</span>
                  </Link>
                  <Link
                    to="/appointments"
                    className="p-3 bg-emerald-100/70 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border border-emerald-200/90 dark:border-emerald-800 rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 transition shadow-2xs"
                  >
                    <Stethoscope className="w-5 h-5 text-emerald-700 dark:text-emerald-300 stroke-[2.2]" />
                    <span>Book Visit</span>
                  </Link>
                  <Link
                    to="/settings"
                    className="p-3 bg-blue-100/70 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-900 dark:text-blue-200 border border-blue-200/90 dark:border-blue-800 rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 transition shadow-2xs"
                  >
                    <Settings className="w-5 h-5 text-blue-700 dark:text-blue-300 stroke-[2.2]" />
                    <span>My Profile</span>
                  </Link>
                  <Link
                    to="/patients"
                    className="p-3 bg-amber-100/70 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-200/90 dark:border-amber-800 rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 transition shadow-2xs"
                  >
                    <HeartPulse className="w-5 h-5 text-amber-700 dark:text-amber-300 stroke-[2.2]" />
                    <span>Health Record</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/patients/new"
                    className="p-3 bg-blue-100/70 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-900 dark:text-blue-200 border border-blue-200/90 dark:border-blue-800 rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 transition shadow-2xs"
                  >
                    <UserPlus className="w-5 h-5 text-blue-700 dark:text-blue-300 stroke-[2.2]" />
                    <span>New Patient</span>
                  </Link>
                  <Link
                    to="/appointments"
                    className="p-3 bg-purple-100/70 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-900 dark:text-purple-200 border border-purple-200/90 dark:border-purple-800 rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 transition shadow-2xs"
                  >
                    <Calendar className="w-5 h-5 text-purple-700 dark:text-purple-300 stroke-[2.2]" />
                    <span>Book Visit</span>
                  </Link>
                  <Link
                    to="/doctors"
                    className="p-3 bg-emerald-100/70 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border border-emerald-200/90 dark:border-emerald-800 rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 transition shadow-2xs"
                  >
                    <Stethoscope className="w-5 h-5 text-emerald-700 dark:text-emerald-300 stroke-[2.2]" />
                    <span>Doctors</span>
                  </Link>
                  <Link
                    to="/patients"
                    className="p-3 bg-amber-100/70 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-200/90 dark:border-amber-800 rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 transition shadow-2xs"
                  >
                    <Users className="w-5 h-5 text-amber-700 dark:text-amber-300 stroke-[2.2]" />
                    <span>Patients</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
