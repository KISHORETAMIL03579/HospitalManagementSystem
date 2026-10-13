import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
  PageHeader,
  StatusBadge,
  EmptyState,
} from "../../../components/common";
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
  MoreHorizontal,
  CalendarPlus,
} from "lucide-react";

type SortField = "appointmentDate" | "patientName" | "doctorName" | "status";
type SortOrder = "asc" | "desc";

export const AppointmentListPage: React.FC = () => {
  const settings = useSettings();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | undefined>(
    () => {
      const docParam = searchParams.get("doctorId");
      return docParam ? Number(docParam) : undefined;
    },
  );
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>(
    () => searchParams.get("search") || "",
  );

  const [sortField, setSortField] = useState<SortField>("appointmentDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingContext, setBookingContext] = useState<{
    patientId?: number;
    doctorId?: number;
  }>({});
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentDto | null>(null);
  const [openMenuApt, setOpenMenuApt] = useState<{
    apt: AppointmentDto;
    top: number;
    right: number;
  } | null>(null);

  const { data: appointments, isLoading } = useAppointments(
    undefined,
    selectedDoctorId,
    selectedDate || undefined,
  );
  const { data: doctors } = useDoctors();
  const updateStatusMutation = useUpdateAppointmentStatus();

  // Close ⋯ menu or Appointment Details modal on Escape or scroll
  useEffect(() => {
    if (!openMenuApt && !selectedAppointment) return;
    const handleClose = () => setOpenMenuApt(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (openMenuApt) setOpenMenuApt(null);
        else if (selectedAppointment) setSelectedAppointment(null);
      }
    };
    window.addEventListener("scroll", handleClose, true);
    window.addEventListener("resize", handleClose);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("scroll", handleClose, true);
      window.removeEventListener("resize", handleClose);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenuApt, selectedAppointment]);

  // Open appointment details if navigated with ?appointmentId=
  useEffect(() => {
    const aptIdParam = searchParams.get("appointmentId");
    if (aptIdParam && appointments) {
      const match = appointments.find(
        (a) => String(a.appointmentId) === aptIdParam,
      );
      if (match) {
        setSelectedAppointment(match);
        const next = new URLSearchParams(searchParams);
        next.delete("appointmentId");
        setSearchParams(next, { replace: true });
      }
    }
  }, [searchParams, appointments, setSearchParams]);

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
    return <StatusBadge type="appointment" status={status} />;
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
      <PageHeader
        title="Appointments & Scheduling"
        subtitle="Book consultations, track patient schedules, and manage status updates."
        icon={Calendar}
        actions={
          <button
            onClick={() => setIsBookingModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm transition"
          >
            <Plus className="w-5 h-5" />
            Book Appointment
          </button>
        }
      />

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
        <div className="bg-white p-6 border border-slate-200 rounded-xl">
          <EmptyState
            icon={Calendar}
            title="No matching appointments found"
            description="Try adjusting your search filters or book a new appointment."
            action={
              <button
                onClick={() => setIsBookingModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Book Appointment
              </button>
            }
          />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          {/* Active Sort & Filter Indicator Summary Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs">
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
                  <th className="px-6 py-3.5 text-right w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedAppointments.map((apt: AppointmentDto) => {
                  return (
                    <tr
                      key={apt.appointmentId}
                      className="hover:bg-slate-50/80 transition cursor-pointer group"
                      onClick={() => setSelectedAppointment(apt)}
                      title="Click to view appointment details"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-indigo-600" />
                          {new Date(apt.appointmentDate).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {formatTimeSlot(
                            apt.timeSlot,
                            settings.timeFormat,
                            settings.timeZone,
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAppointment(apt);
                          }}
                          className="font-medium text-left text-slate-800 group-hover:text-indigo-600 group-hover:underline transition-colors flex items-center gap-1.5"
                        >
                          <User className="w-4 h-4 text-slate-400" />
                          <span>{apt.patientName}</span>
                        </button>
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
                        className="px-6 py-4 whitespace-nowrap text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              openMenuApt?.apt.appointmentId ===
                              apt.appointmentId
                            ) {
                              setOpenMenuApt(null);
                              return;
                            }
                            const rect =
                              e.currentTarget.getBoundingClientRect();
                            const menuHeight = 160;
                            const openUpward =
                              rect.bottom + menuHeight > window.innerHeight;
                            setOpenMenuApt({
                              apt,
                              top: openUpward
                                ? rect.top - menuHeight - 6
                                : rect.bottom + 6,
                              right: window.innerWidth - rect.right,
                            });
                          }}
                          aria-label={`More actions for appointment #${apt.appointmentId}`}
                          aria-expanded={
                            openMenuApt?.apt.appointmentId === apt.appointmentId
                          }
                          title="Appointment actions"
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                            openMenuApt?.apt.appointmentId === apt.appointmentId
                              ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                          }`}
                        >
                          <MoreHorizontal className="w-4 h-4" />
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

      {/* Three-Dot (⋯) Menu Dropdown for Appointment Row */}
      {openMenuApt && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpenMenuApt(null)}
          />
          <div
            role="menu"
            style={{
              top: openMenuApt.top,
              right: openMenuApt.right,
            }}
            className="fixed z-50 w-56 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100"
          >
            {(() => {
              const apt = openMenuApt.apt;
              const statusNum = getStatusVal(apt.status);

              return (
                <>
                  {/* Pending (0) -> Confirm appointment */}
                  {statusNum === 0 && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setOpenMenuApt(null);
                        handleStatusChange(
                          apt.appointmentId,
                          AppointmentStatus.Confirmed,
                        );
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>Confirm appointment</span>
                    </button>
                  )}

                  {/* Confirmed (10) -> Mark as arrived (Check In) */}
                  {statusNum === 10 && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setOpenMenuApt(null);
                        handleStatusChange(
                          apt.appointmentId,
                          AppointmentStatus.CheckedIn,
                        );
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/50 transition-colors"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                      <span>Mark as arrived (Check In)</span>
                    </button>
                  )}

                  {/* CheckedIn (20) -> Start consultation */}
                  {statusNum === 20 && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setOpenMenuApt(null);
                        handleStatusChange(
                          apt.appointmentId,
                          AppointmentStatus.InConsultation,
                        );
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-colors"
                    >
                      <Stethoscope className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                      <span>Start consultation</span>
                    </button>
                  )}

                  {/* InConsultation (30) -> Mark as completed */}
                  {statusNum === 30 && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setOpenMenuApt(null);
                        handleStatusChange(
                          apt.appointmentId,
                          AppointmentStatus.Completed,
                        );
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Mark as completed</span>
                    </button>
                  )}

                  {/* Reschedule / Book follow-up appointment */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpenMenuApt(null);
                      setBookingContext({
                        patientId: apt.patientId,
                        doctorId: apt.doctorId,
                      });
                      setIsBookingModalOpen(true);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <CalendarPlus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>
                      {statusNum === 0 || statusNum === 10
                        ? "Reschedule appointment"
                        : "Book follow-up visit"}
                    </span>
                  </button>

                  {/* CheckedIn (20) -> Record a no-show */}
                  {statusNum === 20 && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setOpenMenuApt(null);
                        if (
                          window.confirm(
                            `Record ${apt.patientName} as a No-Show for this appointment?`,
                          )
                        ) {
                          handleStatusChange(
                            apt.appointmentId,
                            AppointmentStatus.NoShow,
                          );
                        }
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors"
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Record a no-show</span>
                    </button>
                  )}

                  {/* Active appointments (0, 10, 20, 30) -> Cancel appointment */}
                  {(statusNum === 0 ||
                    statusNum === 10 ||
                    statusNum === 20 ||
                    statusNum === 30) && (
                    <>
                      <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setOpenMenuApt(null);
                          if (
                            window.confirm(
                              `Are you sure you want to cancel the appointment for ${apt.patientName}?`,
                            )
                          ) {
                            handleStatusChange(
                              apt.appointmentId,
                              AppointmentStatus.Cancelled,
                            );
                          }
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Cancel appointment</span>
                      </button>
                    </>
                  )}
                </>
              );
            })()}
          </div>
        </>
      )}

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setBookingContext({});
        }}
        preselectedPatientId={bookingContext.patientId}
        preselectedDoctorId={bookingContext.doctorId}
      />

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <div
          onClick={() => setSelectedAppointment(null)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-5 border border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="min-w-0">
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Appointment Details #{selectedAppointment.appointmentId}
                </span>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mt-0.5 truncate">
                  <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="truncate">
                    {selectedAppointment.patientName}
                  </span>
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAppointment(null)}
                aria-label="Close modal"
                title="Close (Esc)"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-white transition shadow-2xs"
              >
                <X className="w-4 h-4" />
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
                      settings.timeZone,
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
