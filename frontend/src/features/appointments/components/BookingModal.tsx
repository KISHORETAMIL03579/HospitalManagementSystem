import React, { useState } from "react";
import { useDoctors } from "../../doctors/hooks/useDoctors";
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
} from "lucide-react";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedPatientId?: number;
  preselectedDoctorId?: number;
}

const TIME_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
];

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  preselectedPatientId,
  preselectedDoctorId,
}) => {
  const { data: doctors } = useDoctors();
  const { data: patientResponse } = usePatients("", 1, 100);
  const createAppointment = useCreateAppointment();

  const [patientId, setPatientId] = useState<number>(preselectedPatientId || 0);
  const [doctorId, setDoctorId] = useState<number>(preselectedDoctorId || 0);
  const [appointmentDate, setAppointmentDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [timeSlot, setTimeSlot] = useState<string>("09:00");
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
        timeSlot: `${timeSlot}:00`,
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

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            Book Patient Appointment
          </h2>
        </div>

        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Patient Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <User className="w-4 h-4 text-slate-400" /> Select Patient *
            </label>
            <select
              required
              value={patientId}
              onChange={(e) => setPatientId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-indigo-600"
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
            <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <Stethoscope className="w-4 h-4 text-slate-400" /> Select Doctor *
            </label>
            <select
              required
              value={doctorId}
              onChange={(e) => setDoctorId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-indigo-600"
            >
              <option value={0}>Choose a doctor...</option>
              {doctors?.map((d) => (
                <option key={d.doctorId} value={d.doctorId}>
                  {d.fullName} - {d.specialization} (
                  {formatCurrency(d.consultationFee)})
                </option>
              ))}
            </select>
          </div>

          {/* Date & Time Slot */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <Calendar className="w-4 h-4 text-slate-400" /> Appointment Date
                *
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().split("T")[0]}
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <Clock className="w-4 h-4 text-slate-400" /> Time Slot *
              </label>
              <select
                required
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-indigo-600"
              >
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <FileText className="w-4 h-4 text-slate-400" /> Reason for Visit *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Regular Checkup, Cardiac Followup, Chest Pain"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-indigo-600"
            />
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Additional Clinical / Administrative Notes
            </label>
            <textarea
              rows={2}
              placeholder="Optional notes or instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-indigo-600"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createAppointment.isPending}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium shadow-sm"
            >
              {createAppointment.isPending ? "Booking..." : "Confirm Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
