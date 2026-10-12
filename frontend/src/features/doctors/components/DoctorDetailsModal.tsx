import React from "react";
import {
  DoctorDto,
  DoctorDirectoryItemDto,
  TimeSlotDto,
} from "../types/doctor.types";
import { DoctorAvailabilityBadge } from "./DoctorAvailabilityBadge";
import { DoctorCalendarView } from "./DoctorCalendarView";
import { formatCurrency } from "../../../lib/utils";
import {
  X,
  Stethoscope,
  Building,
  Phone,
  Mail,
  DollarSign,
  Calendar,
  Settings,
  Star,
  Award,
  Globe,
  Clock,
} from "lucide-react";

interface DoctorDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: DoctorDto | DoctorDirectoryItemDto;
  onOpenScheduleManager: (doctor: DoctorDto | DoctorDirectoryItemDto) => void;
  onBookAppointment: (
    doctor: DoctorDto | DoctorDirectoryItemDto,
    slot?: TimeSlotDto,
    date?: string,
  ) => void;
}

export const DoctorDetailsModal: React.FC<DoctorDetailsModalProps> = ({
  isOpen,
  onClose,
  doctor,
  onOpenScheduleManager,
  onBookAppointment,
}) => {
  if (!isOpen) return null;

  const directoryItem = doctor as DoctorDirectoryItemDto;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar Placeholder */}
            {(() => {
              const cleanName = doctor.fullName
                .replace(/^Dr\.?\s*/i, "")
                .trim();
              const parts = cleanName.split(/\s+/);
              const initials =
                `${parts[0]?.[0] || "D"}${parts.length > 1 ? parts[parts.length - 1]?.[0] : ""}`.toUpperCase();
              return (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-lg font-bold text-2xl shrink-0">
                  {initials}
                </div>
              );
            })()}

            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {doctor.fullName}
                </h2>
                {directoryItem.availabilityStatus && (
                  <DoctorAvailabilityBadge
                    status={directoryItem.availabilityStatus}
                    size="sm"
                  />
                )}
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <Stethoscope className="w-3.5 h-3.5" />
                  {doctor.specialization}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  {doctor.departmentName}
                </span>
                <span>•</span>
                <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">
                  Lic: {doctor.licenseNumber}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {directoryItem.rating || 4.9}
                  </span>
                  <span className="text-slate-400">
                    ({directoryItem.reviewCount || 38} reviews)
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-indigo-500" />
                  <span>
                    {directoryItem.yearsOfExperience || 8}+ years experience
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{directoryItem.languages || "English, Spanish"}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-slate-200 dark:border-slate-800 gap-2 shrink-0">
              <div className="text-left sm:text-right">
                <div className="text-[11px] text-slate-400">
                  Consultation Fee
                </div>
                <div className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center sm:justify-end text-emerald-600 dark:text-emerald-400">
                  <DollarSign className="w-4 h-4" />
                  {formatCurrency(doctor.consultationFee)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenScheduleManager(doctor)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
                  title="Manage recurring schedules and exceptions"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Manage Schedule
                </button>
                <button
                  type="button"
                  onClick={() => onBookAppointment(doctor)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Book Now
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Quick Contact & Bio Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 flex items-center gap-3 text-xs">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 rounded-lg">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <div className="text-slate-400 text-[10px]">Phone Number</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  {doctor.phone}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 flex items-center gap-3 text-xs">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 rounded-lg">
                <Mail className="w-4 h-4" />
              </div>
              <div className="truncate">
                <div className="text-slate-400 text-[10px]">Email Address</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {doctor.email || "doctor@careflow.hms"}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 flex items-center gap-3 text-xs">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-lg">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-slate-400 text-[10px]">
                  Status & Availability
                </div>
                <div className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {directoryItem.nextAvailableSlotText ||
                    "Consultation Slots Open"}
                </div>
              </div>
            </div>
          </div>

          {/* Biography */}
          {directoryItem.biography && (
            <div className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-slate-800 dark:text-slate-100 block mb-1">
                About {doctor.fullName}
              </span>
              {directoryItem.biography}
            </div>
          )}

          {/* Embedded Availability Calendar */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  Live Availability Calendar & Slot Picker
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Click any available slot to instantly book an appointment with
                  this doctor.
                </p>
              </div>
            </div>

            <DoctorCalendarView
              doctorId={doctor.doctorId}
              doctorName={doctor.fullName}
              onSelectSlot={(slot, date) => {
                onBookAppointment(doctor, slot, date);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
