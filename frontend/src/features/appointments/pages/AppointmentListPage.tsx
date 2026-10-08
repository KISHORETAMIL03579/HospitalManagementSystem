import React, { useState } from "react";
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
  Clock3,
} from "lucide-react";

export const AppointmentListPage: React.FC = () => {
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | undefined>(
    undefined,
  );
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const { data: appointments, isLoading } = useAppointments(
    undefined,
    selectedDoctorId,
    selectedDate || undefined,
  );
  const { data: doctors } = useDoctors();
  const updateStatusMutation = useUpdateAppointmentStatus();

  const handleStatusChange = async (
    appointmentId: number,
    status: AppointmentStatus,
  ) => {
    await updateStatusMutation.mutateAsync({
      id: appointmentId,
      data: { status },
    });
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.Scheduled:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock3 className="w-3.5 h-3.5" /> Scheduled
          </span>
        );
      case AppointmentStatus.Confirmed:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="w-3.5 h-3.5" /> Confirmed
          </span>
        );
      case AppointmentStatus.Completed:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" /> Completed
          </span>
        );
      case AppointmentStatus.Cancelled:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      case AppointmentStatus.NoShow:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            No Show
          </span>
        );
      default:
        return null;
    }
  };

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

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
            <Filter className="w-4 h-4" /> Filters:
          </div>

          <div>
            <select
              value={selectedDoctorId || 0}
              onChange={(e) =>
                setSelectedDoctorId(Number(e.target.value) || undefined)
              }
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-indigo-600 bg-white"
            >
              <option value={0}>All Doctors</option>
              {doctors?.map((doc) => (
                <option key={doc.doctorId} value={doc.doctorId}>
                  {doc.fullName} ({doc.specialization})
                </option>
              ))}
            </select>
          </div>

          <div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-indigo-600 bg-white"
            />
          </div>

          {(selectedDoctorId || selectedDate) && (
            <button
              onClick={() => {
                setSelectedDoctorId(undefined);
                setSelectedDate("");
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Appointments List / Table */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-500">
          Loading appointments...
        </div>
      ) : appointments?.length === 0 ? (
        <div className="bg-white p-12 text-center border border-slate-200 rounded-xl">
          <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-700">
            No appointments scheduled
          </h3>
          <p className="text-slate-500 text-sm mt-1">
            Book an appointment to populate the schedule.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Date & Time</th>
                  <th className="px-6 py-3.5">Patient Details</th>
                  <th className="px-6 py-3.5">Doctor & Specialization</th>
                  <th className="px-6 py-3.5">Reason</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments?.map((apt: AppointmentDto) => (
                  <tr
                    key={apt.appointmentId}
                    className="hover:bg-slate-50/80 transition"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-indigo-600" />
                        {new Date(apt.appointmentDate).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {apt.timeSlot}
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
                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                      {apt.status === AppointmentStatus.Scheduled && (
                        <>
                          <button
                            onClick={() =>
                              handleStatusChange(
                                apt.appointmentId,
                                AppointmentStatus.Confirmed,
                              )
                            }
                            className="px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded hover:bg-amber-100"
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
                      {apt.status === AppointmentStatus.Confirmed && (
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
                                AppointmentStatus.NoShow,
                              )
                            }
                            className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300 rounded hover:bg-slate-200"
                          >
                            No Show
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
      />
    </div>
  );
};
