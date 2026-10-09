import React, { useState, useMemo } from "react";
import { formatTimeSlot } from "../../../utils/dateUtils";
import { useSettings } from "../../../hooks/useSettings";
import {
  useAppointments,
  useUpdateAppointmentStatus,
} from "../hooks/useAppointments";
import { useDoctors } from "../../doctors/hooks/useDoctors";
import { BookingModal } from "../components/BookingModal";
import { AppointmentStatus, AppointmentDto } from "../types/appointment.types";
import {
  Calendar,
  Clock,
  Plus,
  Filter,
  User,
  Stethoscope,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserCheck,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  X,
} from "lucide-react";

type SortField = "appointmentDate" | "patientName" | "doctorName" | "status";
type SortOrder = "asc" | "desc";

export const AppointmentListPage: React.FC = () => {
  const settings = useSettings();
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | undefined>(
    undefined,
  );
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [sortField, setSortField] = useState<SortField>("appointmentDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentDto | null>(null);

  const { data: appointments, isLoading } = useAppointments(
    undefined,
    selectedDoctorId,
    selectedDate || undefined,
  );
  const { data: doctors } = useDoctors();
  const updateStatusMutation = useUpdateAppointmentStatus();

  const getStatusVal = (status: AppointmentStatus | string | number) => {
    if (typeof status === "number") return status;
    const s = String(status);
    if (s === "0" || s === "Pending") return 0;
    if (s === "10" || s === "1" || s === "Confirmed" || s === "Scheduled")
      return 10;
    if (s === "20" || s === "2" || s === "CheckedIn") return 20;
    if (s === "30" || s === "3" || s === "InConsultation") return 30;
    if (s === "40" || s === "4" || s === "Completed") return 40;
    if (s === "50" || s === "5" || s === "Cancelled") return 50;
    if (s === "60" || s === "6" || s === "NoShow") return 60;
    return 10;
  };

  const handleStatusChange = async (
    appointmentId: number,
    status: AppointmentStatus,
  ) => {
    await updateStatusMutation.mutateAsync({
      id: appointmentId,
      data: { status },
    });
    if (
      selectedAppointment &&
      selectedAppointment.appointmentId === appointmentId
    ) {
      setSelectedAppointment((prev) => (prev ? { ...prev, status } : null));
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getStatusBadge = (status: AppointmentStatus | string) => {
    const statusVal =
      typeof status === "number"
        ? status
        : status === "Pending" || status === "0"
          ? 0
          : status === "Confirmed" ||
              status === "Scheduled" ||
              status === "10" ||
              status === "1"
            ? 10
            : status === "CheckedIn" || status === "20" || status === "2"
              ? 20
              : status === "InConsultation" || status === "30" || status === "3"
                ? 30
                : status === "Completed" || status === "40" || status === "4"
                  ? 40
                  : status === "Cancelled" || status === "50" || status === "5"
                    ? 50
                    : status === "NoShow" || status === "60" || status === "6"
                      ? 60
                      : 10;

    switch (statusVal) {
      case AppointmentStatus.Pending:
      case 0:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock3 className="w-3.5 h-3.5" /> Pending
          </span>
        );
      case AppointmentStatus.Confirmed:
      case 10:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock3 className="w-3.5 h-3.5" /> Confirmed
          </span>
        );
      case AppointmentStatus.CheckedIn:
      case 20:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <UserCheck className="w-3.5 h-3.5" /> Checked In
          </span>
        );
      case AppointmentStatus.InConsultation:
      case 30:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Stethoscope className="w-3.5 h-3.5" /> In Consultation
          </span>
        );
      case AppointmentStatus.Completed:
      case 40:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" /> Completed
          </span>
        );
      case AppointmentStatus.Cancelled:
      case 50:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      case AppointmentStatus.NoShow:
      case 60:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            <AlertCircle className="w-3.5 h-3.5" /> No Show
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            {String(status)}
          </span>
        );
    }
  };

  // Filtered & Sorted Appointments
  const filteredAndSortedAppointments = useMemo(() => {
    if (!appointments) return [];

    let result = [...appointments];

    // Status Filter
    if (selectedStatusFilter !== "ALL") {
      const targetCode = Number(selectedStatusFilter);
      result = result.filter((apt) => {
        const val = getStatusVal(apt.status);
        return val === targetCode;
      });
    }

    // Search term filter
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (apt) =>
          apt.patientName.toLowerCase().includes(term) ||
          apt.medicalRecordNumber.toLowerCase().includes(term) ||
          apt.doctorName.toLowerCase().includes(term) ||
          apt.reason.toLowerCase().includes(term),
      );
    }

    // Sorting
    result.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === "appointmentDate") {
        valA = new Date(a.appointmentDate).getTime();
        valB = new Date(b.appointmentDate).getTime();
      }

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [appointments, selectedStatusFilter, searchTerm, sortField, sortOrder]);

  // Paginated List
  const totalPages =
    Math.ceil(filteredAndSortedAppointments.length / pageSize) || 1;
  const paginatedAppointments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedAppointments.slice(start, start + pageSize);
  }, [filteredAndSortedAppointments, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-7 h-7 text-indigo-600" />
            Appointments & Scheduling
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Book consultations, track patient schedules, and manage status
            updates.
          </p>
        </div>
        <button
          onClick={() => setIsBookingModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm transition"
        >
          <Plus className="w-5 h-5" />
          Book Appointment
        </button>
      </div>

      {/* Controls & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient name, MRN, doctor or reason..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
              <Filter className="w-4 h-4" /> Filter By:
            </div>

            {/* Doctor Filter */}
            <select
              value={selectedDoctorId || 0}
              onChange={(e) => {
                setSelectedDoctorId(Number(e.target.value) || undefined);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-indigo-600 bg-white"
            >
              <option value={0}>All Doctors</option>
              {doctors?.map((doc) => (
                <option key={doc.doctorId} value={doc.doctorId}>
                  {doc.fullName} ({doc.specialization})
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => {
                setSelectedStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-indigo-600 bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="0">Pending</option>
              <option value="10">Confirmed</option>
              <option value="20">Checked In</option>
              <option value="30">In Consultation</option>
              <option value="40">Completed</option>
              <option value="50">Cancelled</option>
              <option value="60">No Show</option>
            </select>

            {/* Date Filter */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-indigo-600 bg-white"
            />

            {(selectedDoctorId ||
              selectedDate ||
              selectedStatusFilter !== "ALL" ||
              searchTerm) && (
              <button
                onClick={() => {
                  setSelectedDoctorId(undefined);
                  setSelectedDate("");
                  setSelectedStatusFilter("ALL");
                  setSearchTerm("");
                  setCurrentPage(1);
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Appointments List / Table */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-500">
          Loading appointments...
        </div>
      ) : filteredAndSortedAppointments.length === 0 ? (
        <div className="bg-white p-12 text-center border border-slate-200 rounded-xl">
          <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-700">
            No matching appointments found
          </h3>
          <p className="text-slate-500 text-sm mt-1">
            Try adjusting your search filters or book a new appointment.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden space-y-2">
          {/* Active Sort & Filter Indicator Summary Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600">
                Active Column Sort:
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                {sortField === "appointmentDate" && "Date & Time"}
                {sortField === "patientName" && "Patient Details"}
                {sortField === "doctorName" && "Doctor & Specialization"}
                {sortField === "status" && "Status"}
                <span className="text-indigo-600">
                  ({sortOrder === "asc" ? "↑ Ascending" : "↓ Descending"})
                </span>
              </span>
            </div>

            <div className="text-slate-400 text-[11px]">
              Click any column header below to toggle ordering (ASC ⇄ DESC)
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th
                    onClick={() => handleSort("appointmentDate")}
                    className={`px-6 py-3.5 cursor-pointer select-none transition ${
                      sortField === "appointmentDate"
                        ? "bg-indigo-50/80 text-indigo-900 font-bold border-b-2 border-indigo-600"
                        : "hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Date & Time</span>
                      {sortField === "appointmentDate" ? (
                        sortOrder === "asc" ? (
                          <ArrowUp className="w-4 h-4 text-indigo-600 font-bold" />
                        ) : (
                          <ArrowDown className="w-4 h-4 text-indigo-600 font-bold" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("patientName")}
                    className={`px-6 py-3.5 cursor-pointer select-none transition ${
                      sortField === "patientName"
                        ? "bg-indigo-50/80 text-indigo-900 font-bold border-b-2 border-indigo-600"
                        : "hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Patient Details</span>
                      {sortField === "patientName" ? (
                        sortOrder === "asc" ? (
                          <ArrowUp className="w-4 h-4 text-indigo-600 font-bold" />
                        ) : (
                          <ArrowDown className="w-4 h-4 text-indigo-600 font-bold" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("doctorName")}
                    className={`px-6 py-3.5 cursor-pointer select-none transition ${
                      sortField === "doctorName"
                        ? "bg-indigo-50/80 text-indigo-900 font-bold border-b-2 border-indigo-600"
                        : "hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Doctor & Specialization</span>
                      {sortField === "doctorName" ? (
                        sortOrder === "asc" ? (
                          <ArrowUp className="w-4 h-4 text-indigo-600 font-bold" />
                        ) : (
                          <ArrowDown className="w-4 h-4 text-indigo-600 font-bold" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3.5">Reason</th>
                  <th
                    onClick={() => handleSort("status")}
                    className={`px-6 py-3.5 cursor-pointer select-none transition ${
                      sortField === "status"
                        ? "bg-indigo-50/80 text-indigo-900 font-bold border-b-2 border-indigo-600"
                        : "hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Status</span>
                      {sortField === "status" ? (
                        sortOrder === "asc" ? (
                          <ArrowUp className="w-4 h-4 text-indigo-600 font-bold" />
                        ) : (
                          <ArrowDown className="w-4 h-4 text-indigo-600 font-bold" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedAppointments.map((apt: AppointmentDto) => {
                  const statusNum = getStatusVal(apt.status);

                  return (
                    <tr
                      key={apt.appointmentId}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                      onClick={() => setSelectedAppointment(apt)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-indigo-600" />
                          {new Date(apt.appointmentDate).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {formatTimeSlot(apt.timeSlot, settings.timeFormat)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-slate-800 flex items-center gap-1.5">
                          <User className="w-4 h-4 text-slate-400" />
                          {apt.patientName}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          MRN: {apt.medicalRecordNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-slate-800 flex items-center gap-1.5">
                          <Stethoscope className="w-4 h-4 text-indigo-500" />
                          {apt.doctorName}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {apt.specialization}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-800 font-medium">
                          {apt.reason}
                        </div>
                        {apt.notes && (
                          <div className="text-xs text-slate-500 italic">
                            {apt.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(apt.status)}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-right space-x-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {(statusNum === 0 ||
                          statusNum === AppointmentStatus.Pending) && (
                          <>
                            <button
                              onClick={() =>
                                handleStatusChange(
                                  apt.appointmentId,
                                  AppointmentStatus.Confirmed,
                                )
                              }
                              className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() =>
                                handleStatusChange(
                                  apt.appointmentId,
                                  AppointmentStatus.Cancelled,
                                )
                              }
                              className="px-2.5 py-1 text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 rounded hover:bg-rose-100"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {(statusNum === 10 ||
                          statusNum === AppointmentStatus.Confirmed) && (
                          <>
                            <button
                              onClick={() =>
                                handleStatusChange(
                                  apt.appointmentId,
                                  AppointmentStatus.CheckedIn,
                                )
                              }
                              className="px-2.5 py-1 text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200 rounded hover:bg-sky-100"
                            >
                              Check In
                            </button>
                            <button
                              onClick={() =>
                                handleStatusChange(
                                  apt.appointmentId,
                                  AppointmentStatus.Cancelled,
                                )
                              }
                              className="px-2.5 py-1 text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 rounded hover:bg-rose-100"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {(statusNum === 20 ||
                          statusNum === AppointmentStatus.CheckedIn) && (
                          <>
                            <button
                              onClick={() =>
                                handleStatusChange(
                                  apt.appointmentId,
                                  AppointmentStatus.InConsultation,
                                )
                              }
                              className="px-2.5 py-1 text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 rounded hover:bg-purple-100"
                            >
                              Start Visit
                            </button>
                            <button
                              onClick={() =>
                                handleStatusChange(
                                  apt.appointmentId,
                                  AppointmentStatus.NoShow,
                                )
                              }
                              className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300 rounded hover:bg-slate-200"
                            >
                              No Show
                            </button>
                          </>
                        )}
                        {(statusNum === 30 ||
                          statusNum === AppointmentStatus.InConsultation) && (
                          <>
                            <button
                              onClick={() =>
                                handleStatusChange(
                                  apt.appointmentId,
                                  AppointmentStatus.Completed,
                                )
                              }
                              className="px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded hover:bg-emerald-100"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() =>
                                handleStatusChange(
                                  apt.appointmentId,
                                  AppointmentStatus.Cancelled,
                                )
                              }
                              className="px-2.5 py-1 text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 rounded hover:bg-rose-100"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setSelectedAppointment(apt)}
                          className="px-2 py-1 text-xs font-medium text-slate-500 hover:text-indigo-600 underline"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm">
            <div className="text-xs text-slate-500">
              Showing {paginatedAppointments.length} of{" "}
              {filteredAndSortedAppointments.length} appointments (Page{" "}
              {currentPage} of {totalPages})
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <span>Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-slate-300 rounded bg-white"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage >= totalPages}
                  className="p-1.5 border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
      />

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-5 border border-slate-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                  Appointment Details #{selectedAppointment.appointmentId}
                </span>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mt-0.5">
                  <User className="w-5 h-5 text-indigo-600" />
                  {selectedAppointment.patientName}
                </h2>
              </div>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-600">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">
                    Medical Record Number
                  </span>
                  <span className="font-mono font-semibold text-slate-800 text-xs">
                    {selectedAppointment.medicalRecordNumber}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">
                    Current Status
                  </span>
                  <div className="mt-1">
                    {getStatusBadge(selectedAppointment.status)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                  <Stethoscope className="w-4 h-4 text-indigo-500" />
                  <span>Doctor: {selectedAppointment.doctorName}</span>
                </div>
                <div className="text-xs text-slate-500 pl-6">
                  Specialization: {selectedAppointment.specialization}
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  <span>
                    Date:{" "}
                    {new Date(
                      selectedAppointment.appointmentDate,
                    ).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <span>
                    Time:{" "}
                    {formatTimeSlot(
                      selectedAppointment.timeSlot,
                      settings.timeFormat,
                    )}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Reason for Visit
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 font-medium text-slate-800">
                  {selectedAppointment.reason}
                </div>
                {selectedAppointment.notes && (
                  <div className="mt-2 text-xs text-slate-500 italic">
                    Note: {selectedAppointment.notes}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <div className="flex gap-2">
                {getStatusVal(selectedAppointment.status) === 0 && (
                  <button
                    onClick={() =>
                      handleStatusChange(
                        selectedAppointment.appointmentId,
                        AppointmentStatus.Confirmed,
                      )
                    }
                    className="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Confirm Appointment
                  </button>
                )}
                {getStatusVal(selectedAppointment.status) === 10 && (
                  <button
                    onClick={() =>
                      handleStatusChange(
                        selectedAppointment.appointmentId,
                        AppointmentStatus.CheckedIn,
                      )
                    }
                    className="px-3 py-1.5 text-xs font-semibold bg-sky-600 text-white rounded-lg hover:bg-sky-700"
                  >
                    Check In Patient
                  </button>
                )}
                {getStatusVal(selectedAppointment.status) === 20 && (
                  <button
                    onClick={() =>
                      handleStatusChange(
                        selectedAppointment.appointmentId,
                        AppointmentStatus.InConsultation,
                      )
                    }
                    className="px-3 py-1.5 text-xs font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Start Visit
                  </button>
                )}
                {getStatusVal(selectedAppointment.status) === 30 && (
                  <button
                    onClick={() =>
                      handleStatusChange(
                        selectedAppointment.appointmentId,
                        AppointmentStatus.Completed,
                      )
                    }
                    className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                  >
                    Complete Visit
                  </button>
                )}
              </div>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
