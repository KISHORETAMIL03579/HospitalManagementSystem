import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  useDoctorDirectory,
  useDepartments,
  useCreateDoctor,
} from "../hooks/useDoctors";
import {
  DoctorDirectoryItemDto,
  DoctorDto,
  TimeSlotDto,
} from "../types/doctor.types";
import { DoctorAvailabilityBadge } from "../components/DoctorAvailabilityBadge";
import { DoctorDetailsModal } from "../components/DoctorDetailsModal";
import { DoctorScheduleModal } from "../components/DoctorScheduleModal";
import { BookingModal } from "../../appointments/components/BookingModal";
import { formatCurrency } from "../../../lib/utils";
import {
  UserCheck,
  Plus,
  Stethoscope,
  Phone,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Settings,
  Star,
  Award,
  MoreHorizontal,
  CalendarPlus,
} from "lucide-react";
import { PhoneNumberInput } from "../../../components/common/PhoneNumberInput";

export const DoctorListPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDepartment, setSelectedDepartment] = useState<
    number | undefined
  >(undefined);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortField, setSortField] = useState<
    "fullName" | "specialization" | "consultationFee"
  >("fullName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(6);

  // Modals state
  const [isAddDoctorModalOpen, setIsAddDoctorModalOpen] = useState(false);
  const [selectedDoctorForDetails, setSelectedDoctorForDetails] =
    useState<DoctorDirectoryItemDto | null>(null);
  const [selectedDoctorForSchedule, setSelectedDoctorForSchedule] =
    useState<DoctorDirectoryItemDto | null>(null);
  const [openMenuDoctor, setOpenMenuDoctor] = useState<{
    doctor: DoctorDirectoryItemDto;
    top: number;
    right: number;
  } | null>(null);
  const [bookingModalState, setBookingModalState] = useState<{
    isOpen: boolean;
    doctorId?: number;
    date?: string;
    timeSlot?: string;
  }>({
    isOpen: false,
  });

  // Close ⋯ menu on Escape or scroll
  useEffect(() => {
    if (!openMenuDoctor) return;
    const handleClose = () => setOpenMenuDoctor(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenuDoctor(null);
    };
    window.addEventListener("scroll", handleClose, true);
    window.addEventListener("resize", handleClose);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("scroll", handleClose, true);
      window.removeEventListener("resize", handleClose);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenuDoctor]);

  const { data: doctors, isLoading: isDoctorsLoading } = useDoctorDirectory(
    selectedDepartment,
    searchTerm || undefined,
  );
  const { data: departments } = useDepartments();
  const createDoctorMutation = useCreateDoctor();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    specialization: "",
    licenseNumber: "",
    departmentId: 0,
    consultationFee: 150,
    phone: "",
    email: "",
    availableDays: "Monday,Tuesday,Wednesday,Thursday,Friday",
    startTime: "09:00:00",
    endTime: "17:00:00",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.departmentId) return;

    await createDoctorMutation.mutateAsync({
      ...formData,
      departmentId: Number(formData.departmentId),
      consultationFee: Number(formData.consultationFee),
    });

    setIsAddDoctorModalOpen(false);
    setFormData({
      firstName: "",
      lastName: "",
      specialization: "",
      licenseNumber: "",
      departmentId: 0,
      consultationFee: 150,
      phone: "",
      email: "",
      availableDays: "Monday,Tuesday,Wednesday,Thursday,Friday",
      startTime: "09:00:00",
      endTime: "17:00:00",
    });
  };

  const sortedDoctors = useMemo(() => {
    if (!doctors) return [];
    const result = [...doctors];

    result.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [doctors, sortField, sortOrder]);

  const totalPages = Math.ceil(sortedDoctors.length / pageSize) || 1;
  const paginatedDoctors = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedDoctors.slice(start, start + pageSize);
  }, [sortedDoctors, currentPage, pageSize]);

  const handleOpenBooking = (
    doc: DoctorDirectoryItemDto | DoctorDto,
    slot?: TimeSlotDto,
    date?: string,
  ) => {
    setBookingModalState({
      isOpen: true,
      doctorId: doc.doctorId,
      date: date,
      timeSlot: slot ? slot.startTime.substring(0, 5) : undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Stethoscope className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Medical Staff & Specialists
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Doctor directory, real-time availability calendar, and consultation
            scheduling.
          </p>
        </div>
        <button
          onClick={() => setIsAddDoctorModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm transition"
        >
          <Plus className="w-5 h-5" />
          Add New Doctor
        </button>
      </div>

      {/* Search, Filter & Sort Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search doctor by name, specialization, or license..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort By:</span>
            </div>
            <select
              value={sortField}
              onChange={(e) =>
                setSortField(
                  e.target.value as
                    "fullName" | "specialization" | "consultationFee",
                )
              }
              className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-indigo-600"
            >
              <option value="fullName">Doctor Name</option>
              <option value="specialization">Specialization</option>
              <option value="consultationFee">Consultation Fee</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
            >
              {sortOrder.toUpperCase()}
            </button>
          </div>
        </div>

        {/* Department Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => {
              setSelectedDepartment(undefined);
              setCurrentPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
              selectedDepartment === undefined
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            All Departments
          </button>
          {departments?.map((dept) => (
            <button
              key={dept.departmentId}
              onClick={() => {
                setSelectedDepartment(dept.departmentId);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                selectedDepartment === dept.departmentId
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {dept.name}
            </button>
          ))}
        </div>
      </div>

      {/* Doctors Cards Grid */}
      {isDoctorsLoading ? (
        <div className="p-16 text-center text-slate-500 dark:text-slate-400">
          Loading medical staff directory & live schedules...
        </div>
      ) : sortedDoctors.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-16 text-center border border-slate-200 dark:border-slate-800 rounded-2xl">
          <UserCheck className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
            No doctors found
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Try adjusting your search query or department filter.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedDoctors.map((doc) => (
              <div
                key={doc.doctorId}
                className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-lg transition-all space-y-4 hover:border-indigo-300 dark:hover:border-indigo-700 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top: Avatar, Name, Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div
                      onClick={() => setSelectedDoctorForDetails(doc)}
                      className="flex items-center gap-3 cursor-pointer group"
                      title={`Click to view ${doc.fullName}'s profile and availability`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0 group-hover:ring-2 group-hover:ring-indigo-400 transition">
                        {doc.fullName
                          ? doc.fullName.replace("Dr. ", "")[0]
                          : "D"}
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDoctorForDetails(doc);
                          }}
                          className="text-base font-bold text-left text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:underline transition"
                        >
                          {doc.fullName}
                        </button>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                            {doc.specialization}
                          </span>
                          <span>•</span>
                          <span>{doc.departmentName}</span>
                        </div>
                      </div>
                    </div>

                    <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-mono shrink-0">
                      {doc.licenseNumber}
                    </span>
                  </div>

                  {/* Real-Time Availability Badge & Slot Info */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <DoctorAvailabilityBadge
                      status={doc.availabilityStatus}
                      nextSlotText={doc.nextAvailableSlotText}
                      size="md"
                    />

                    <div className="text-right">
                      <div className="text-[10px] text-slate-400">
                        Consultation
                      </div>
                      <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(doc.consultationFee)}
                      </div>
                    </div>
                  </div>

                  {/* Ratings & Contact Info */}
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pt-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          {doc.rating || 4.9}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          ({doc.reviewCount || 38})
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500">
                        <Award className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{doc.yearsOfExperience || 8} yrs exp</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-slate-500">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{doc.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons: Primary Book + Three-Dot (⋯) Menu */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleOpenBooking(doc)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                  >
                    <CalendarPlus className="w-3.5 h-3.5" />
                    <span>Book Consultation</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (openMenuDoctor?.doctor.doctorId === doc.doctorId) {
                        setOpenMenuDoctor(null);
                        return;
                      }
                      const rect = e.currentTarget.getBoundingClientRect();
                      const menuHeight = 136;
                      const openUpward =
                        rect.bottom + menuHeight > window.innerHeight;
                      setOpenMenuDoctor({
                        doctor: doc,
                        top: openUpward
                          ? rect.top - menuHeight - 6
                          : rect.bottom + 6,
                        right: window.innerWidth - rect.right,
                      });
                    }}
                    aria-label={`More actions for ${doc.fullName}`}
                    aria-expanded={
                      openMenuDoctor?.doctor.doctorId === doc.doctorId
                    }
                    className={`p-2 border rounded-xl transition ${
                      openMenuDoctor?.doctor.doctorId === doc.doctorId
                        ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}
                    title="Doctor actions"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Three-Dot (⋯) Menu Dropdown for Doctor Card */}
          {openMenuDoctor && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setOpenMenuDoctor(null)}
              />
              <div
                role="menu"
                style={{
                  top: openMenuDoctor.top,
                  right: openMenuDoctor.right,
                }}
                className="fixed z-50 w-56 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    const doc = openMenuDoctor.doctor;
                    setOpenMenuDoctor(null);
                    setSelectedDoctorForSchedule(doc);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Manage availability / schedule</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    const docId = openMenuDoctor.doctor.doctorId;
                    setOpenMenuDoctor(null);
                    navigate(`/appointments?doctorId=${docId}`);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>View appointments</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    const doc = openMenuDoctor.doctor;
                    setOpenMenuDoctor(null);
                    handleOpenBooking(doc);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <CalendarPlus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Book consultation</span>
                </button>
              </div>
            </>
          )}

          {/* Pagination Controls */}
          <div className="bg-white dark:bg-slate-900 px-6 py-4 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3 text-sm">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Showing {paginatedDoctors.length} of {sortedDoctors.length}{" "}
              doctors (Page {currentPage} of {totalPages})
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span>Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                >
                  <option value={6}>6</option>
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage >= totalPages}
                  className="p-2 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Details & Interactive Calendar Modal */}
      {selectedDoctorForDetails && (
        <DoctorDetailsModal
          isOpen={!!selectedDoctorForDetails}
          onClose={() => setSelectedDoctorForDetails(null)}
          doctor={selectedDoctorForDetails}
          onOpenScheduleManager={(doc) => {
            setSelectedDoctorForDetails(null);
            setSelectedDoctorForSchedule(doc as DoctorDirectoryItemDto);
          }}
          onBookAppointment={(doc, slot, date) => {
            setSelectedDoctorForDetails(null);
            handleOpenBooking(doc, slot, date);
          }}
        />
      )}

      {/* Doctor Schedule & Exception Manager Modal */}
      {selectedDoctorForSchedule && (
        <DoctorScheduleModal
          isOpen={!!selectedDoctorForSchedule}
          onClose={() => setSelectedDoctorForSchedule(null)}
          doctor={selectedDoctorForSchedule}
        />
      )}

      {/* Appointment Booking Modal */}
      <BookingModal
        isOpen={bookingModalState.isOpen}
        onClose={() =>
          setBookingModalState({
            isOpen: false,
          })
        }
        preselectedDoctorId={bookingModalState.doctorId}
        preselectedDate={bookingModalState.date}
        preselectedTimeSlot={bookingModalState.timeSlot}
      />

      {/* Add New Doctor Modal */}
      {isAddDoctorModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Register New Doctor
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Specialization
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cardiologist"
                    value={formData.specialization}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        specialization: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    License Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="DOC-XXXX"
                    value={formData.licenseNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        licenseNumber: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Department
                </label>
                <select
                  required
                  value={formData.departmentId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      departmentId: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-indigo-600"
                >
                  <option value={0}>Select Department...</option>
                  {departments?.map((dept) => (
                    <option key={dept.departmentId} value={dept.departmentId}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <PhoneNumberInput
                    id="doctor-phone"
                    label="Phone"
                    required
                    value={formData.phone}
                    onChange={(phone) => setFormData({ ...formData, phone })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Consultation Fee
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.consultationFee}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        consultationFee: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-indigo-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddDoctorModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createDoctorMutation.isPending}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 font-semibold shadow-xs"
                >
                  {createDoctorMutation.isPending ? "Saving..." : "Save Doctor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
