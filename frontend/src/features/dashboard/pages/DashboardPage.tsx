import React from "react";
import { usePatients } from "../../patients/hooks/usePatients";
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
} from "lucide-react";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { data: patientData, isLoading: isPatientsLoading } = usePatients(
    "",
    1,
    5,
  );

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
              . Here is your hospital overview for today.
            </p>
          </div>

          <Link
            to="/patients/new"
            className="px-4 py-2.5 bg-blue-500 hover:bg-blue-400 text-white font-medium rounded-xl text-sm shadow-md flex items-center gap-2 transition-all shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register New Patient</span>
          </Link>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
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
            {isPatientsLoading ? "..." : (patientData?.totalCount ?? 0)}
          </div>
          <div className="text-xs text-emerald-600 flex items-center gap-1 mt-1 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Active registered records</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Appointments
            </span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800">12 Scheduled</div>
          <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
            <Clock className="w-3.5 h-3.5" />
            <span>4 Check-ins pending today</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Doctors On Duty
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Stethoscope className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800">8 Active</div>
          <div className="text-xs text-emerald-600 flex items-center gap-1 mt-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Across 4 Departments</span>
          </div>
        </div>

        {/* Metric 4 */}
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

      {/* Quick Action Navigation Buttons & Recent Registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Patients Table Preview (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-bold text-slate-800 text-base">
                Recent Patient Registrations
              </h2>
              <p className="text-xs text-slate-400">
                Latest patients saved to SQL Server database
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
                      className="hover:bg-slate-50/60"
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

        {/* Quick Actions Panel (1 Col) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-800 text-base">
              Quick Actions
            </h2>
            <p className="text-xs text-slate-400">
              Shortcuts to main hospital functions
            </p>
          </div>

          <div className="space-y-2.5">
            <Link
              to="/patients/new"
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">
                    Register Patient
                  </div>
                  <div className="text-xs text-slate-400">
                    Add new patient demographics
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </Link>

            <Link
              to="/patients"
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">
                    Patient Directory
                  </div>
                  <div className="text-xs text-slate-400">
                    Search & view all patient records
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
