import React, { useState, useMemo, useEffect } from "react";
import {
  useDoctors,
  useDoctorAvailability,
} from "../../doctors/hooks/useDoctors";
import { usePatients } from "../../patients/hooks/usePatients";
import { useCreateAppointment } from "../hooks/useAppointments";
import { formatCurrency } from "../../../lib/utils";
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  FileText,
  AlertCircle,
  CalendarX,
  CheckCircle2,
  X,
} from "lucide-react";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedPatientId?: number;
  preselectedDoctorId?: number;
  preselectedDate?: string;
  preselectedTimeSlot?: string;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  preselectedPatientId,
  preselectedDoctorId,
  preselectedDate,
  preselectedTimeSlot,
}) => {
  const { data: doctors } = useDoctors();
  const { data: patientResponse } = usePatients("", 1, 100);
  const createAppointment = useCreateAppointment();

  const minDate = useMemo(() => new Date().toISOString().split("T")[0], []);

  const [patientId, setPatientId] = useState<number>(preselectedPatientId || 0);
  const [doctorId, setDoctorId] = useState<number>(preselectedDoctorId || 0);
  const [appointmentDate, setAppointmentDate] = useState<string>(
    () => preselectedDate || new Date().toISOString().split("T")[0],
  );
  const [timeSlot, setTimeSlot] = useState<string>(
    () => preselectedTimeSlot || "09:00",
  );
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync props when modal opens with preselected values
  useEffect(() => {
    if (preselectedPatientId) setPatientId(preselectedPatientId);
    if (preselectedDoctorId) setDoctorId(preselectedDoctorId);
    if (preselectedDate) setAppointmentDate(preselectedDate);
    if (preselectedTimeSlot) setTimeSlot(preselectedTimeSlot.substring(0, 5));
  }, [
    preselectedPatientId,
    preselectedDoctorId,
    preselectedDate,
    preselectedTimeSlot,
  ]);

  // Fetch real-time live availability for the selected doctor & date
  const { data: availability, isLoading: isLoadingAvailability } =
    useDoctorAvailability(doctorId > 0 ? doctorId : undefined, appointmentDate);

  const availableSlots = useMemo(() => {
    if (!availability?.slots || availability.slots.length === 0) {
      return [];
    }
    return availability.slots;
  }, [availability?.slots]);

  // If live slots load and current timeSlot is not among bookable slots, select the first available slot
  useEffect(() => {
    if (availableSlots.length > 0) {
      const isCurrentSlotBookable = availableSlots.some(
        (s) => s.startTime.substring(0, 5) === timeSlot && s.isBookable,
      );
      if (!isCurrentSlotBookable) {
        const firstOpen = availableSlots.find((s) => s.isBookable);
        if (firstOpen) {
          setTimeSlot(firstOpen.startTime.substring(0, 5));
        }
      }
    }
  }, [availableSlots, timeSlot]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!patientId || !doctorId || !appointmentDate || !timeSlot || !reason) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    try {
      await createAppointment.mutateAsync({
        patientId: Number(patientId),
        doctorId: Number(doctorId),
        appointmentDate,
        timeSlot: timeSlot.length === 5 ? `${timeSlot}:00` : timeSlot,
        reason: reason.trim(),
        notes: notes.trim() ? notes.trim() : undefined,
      });

      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err.message ||
        "Failed to book appointment.";
      setErrorMessage(msg);
    }
  };

  const selectedDoctorObj = doctors?.find((d) => d.doctorId === doctorId);

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Book Patient Appointment
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Patient Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" /> Select Patient *
            </label>
            <select
              required
              value={patientId}
              onChange={(e) => setPatientId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-indigo-600"
            >
              <option value={0}>Choose a patient...</option>
              {patientResponse?.items.map((p) => (
                <option key={p.patientId} value={p.patientId}>
                  {p.fullName} ({p.medicalRecordNumber})
                </option>
              ))}
            </select>
          </div>

          {/* Doctor Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Stethoscope className="w-3.5 h-3.5 text-slate-400" /> Select
              Doctor *
            </label>
            <select
              required
              value={doctorId}
              onChange={(e) => setDoctorId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-indigo-600"
            >
              <option value={0}>Choose a doctor...</option>
              {doctors?.map((d) => (
                <option key={d.doctorId} value={d.doctorId}>
                  {d.fullName} - {d.specialization} (
                  {formatCurrency(d.consultationFee)})
                </option>
              ))}
            </select>
            {selectedDoctorObj && (
              <div className="mt-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                {selectedDoctorObj.departmentName} · Consultation Fee:{" "}
                {formatCurrency(selectedDoctorObj.consultationFee)}
              </div>
            )}
          </div>

          {/* Date & Time Slot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Appointment
                Date *
              </label>
              <input
                type="date"
                required
                min={minDate}
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Available Slot
                *
              </label>
              {isLoadingAvailability ? (
                <div className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-400">
                  Checking doctor availability...
                </div>
              ) : availableSlots.length > 0 ? (
                <select
                  required
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-indigo-600"
                >
                  {availableSlots.map((slot) => (
                    <option
                      key={slot.startTime}
                      value={slot.startTime.substring(0, 5)}
                      disabled={!slot.isBookable}
                    >
                      {slot.formattedTime.split(" - ")[0]}
                      {!slot.isBookable ? ` (${slot.status})` : ` - Available`}
                      {slot.sessionName ? ` [${slot.sessionName}]` : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  required
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-indigo-600"
                >
                  <option value="09:00">09:00 AM</option>
                  <option value="09:30">09:30 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="10:30">10:30 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="14:00">02:00 PM</option>
                  <option value="14:30">02:30 PM</option>
                  <option value="15:00">03:00 PM</option>
                  <option value="15:30">03:30 PM</option>
                  <option value="16:00">04:00 PM</option>
                </select>
              )}
            </div>
          </div>

          {/* Live Availability Status Indicator */}
          {availability && (
            <div className="text-xs">
              {availability.availabilityStatus === "On leave" ? (
                <div className="flex items-center gap-2 p-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900 rounded-lg">
                  <CalendarX className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>
                    Doctor is on leave on this date:{" "}
                    {availability.statusMessage}
                  </span>
                </div>
              ) : availability.availabilityStatus === "Fully booked" ? (
                <div className="flex items-center gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>
                    All slots for this date are fully booked or unavailable.
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>
                    {availability.bookableSlotsCount} slot(s) open for this
                    doctor on this day
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" /> Reason for
              Visit *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Regular Checkup, Cardiac Followup, Chest Pain"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-indigo-600"
            />
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Additional Clinical / Administrative Notes
            </label>
            <textarea
              rows={2}
              placeholder="Optional notes or instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-indigo-600"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                createAppointment.isPending ||
                availability?.availabilityStatus === "On leave" ||
                availability?.availabilityStatus === "Fully booked"
              }
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium shadow-sm transition"
            >
              {createAppointment.isPending ? "Booking..." : "Confirm Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
