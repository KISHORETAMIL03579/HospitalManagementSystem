import React, { useState, useEffect } from "react";
import {
  useDoctorSchedules,
  useSaveDoctorSchedules,
  useDoctorExceptions,
  useCreateDoctorException,
  useDeleteDoctorException,
} from "../hooks/useDoctors";
import { doctorApi } from "../api/doctorApi";
import {
  DoctorDto,
  DoctorDirectoryItemDto,
  SaveDoctorScheduleDto,
  ScheduleExceptionType,
  ConflictCheckResultDto,
} from "../types/doctor.types";
import {
  X,
  Clock,
  Calendar,
  AlertTriangle,
  Plus,
  Trash2,
  CheckCircle,
  Copy,
  CalendarX,
  Sparkles,
} from "lucide-react";

interface DoctorScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: DoctorDto | DoctorDirectoryItemDto;
}

const DAYS_OF_WEEK = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

export const DoctorScheduleModal: React.FC<DoctorScheduleModalProps> = ({
  isOpen,
  onClose,
  doctor,
}) => {
  const [activeTab, setActiveTab] = useState<"schedules" | "exceptions">(
    "schedules",
  );

  // Schedules state
  const { data: currentSchedules, isLoading: isLoadingSchedules } =
    useDoctorSchedules(doctor.doctorId);
  const saveSchedulesMutation = useSaveDoctorSchedules(doctor.doctorId);

  const [schedulesList, setSchedulesList] = useState<SaveDoctorScheduleDto[]>(
    [],
  );
  const [scheduleSuccessMsg, setScheduleSuccessMsg] = useState<string | null>(
    null,
  );

  // Exceptions state
  const { data: currentExceptions, isLoading: isLoadingExceptions } =
    useDoctorExceptions(doctor.doctorId);
  const createExceptionMutation = useCreateDoctorException(doctor.doctorId);
  const deleteExceptionMutation = useDeleteDoctorException(doctor.doctorId);

  const [exceptionForm, setExceptionForm] = useState({
    date: new Date().toISOString().split("T")[0],
    exceptionType: ScheduleExceptionType.Unavailable,
    startTime: "10:00",
    endTime: "13:00",
    reason: "",
  });

  const [conflictResult, setConflictResult] =
    useState<ConflictCheckResultDto | null>(null);
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);

  // Populate schedules list when data loads
  useEffect(() => {
    if (currentSchedules) {
      setSchedulesList(
        currentSchedules.map((s) => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime.substring(0, 5),
          endTime: s.endTime.substring(0, 5),
          slotDurationMinutes: s.slotDurationMinutes || 30,
          sessionName: s.sessionName || "Clinic Session",
        })),
      );
    }
  }, [currentSchedules]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showConflictModal) {
          setShowConflictModal(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, showConflictModal, onClose]);

  if (!isOpen) return null;

  const handleAddSession = (dayOfWeek: number) => {
    setSchedulesList([
      ...schedulesList,
      {
        dayOfWeek,
        startTime: "09:00",
        endTime: "12:00",
        slotDurationMinutes: 30,
        sessionName: "Clinic Session",
      },
    ]);
  };

  const handleRemoveSession = (index: number) => {
    setSchedulesList(schedulesList.filter((_, i) => i !== index));
  };

  const handleUpdateSession = (
    index: number,
    field: keyof SaveDoctorScheduleDto,
    value: any,
  ) => {
    const updated = [...schedulesList];
    updated[index] = { ...updated[index], [field]: value };
    setSchedulesList(updated);
  };

  const handleApplyStandardWeekdays = () => {
    const standard: SaveDoctorScheduleDto[] = [];
    [1, 2, 3, 4, 5].forEach((day) => {
      // Morning session: 09:00 - 12:00
      standard.push({
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "12:00",
        slotDurationMinutes: 30,
        sessionName: "Morning Clinic",
      });
      // Afternoon session: 14:00 - 17:00
      standard.push({
        dayOfWeek: day,
        startTime: "14:00",
        endTime: "17:00",
        slotDurationMinutes: 30,
        sessionName: "Afternoon Clinic",
      });
    });
    setSchedulesList(standard);
  };

  const handleSaveSchedules = async () => {
    const payload = schedulesList.map((s) => ({
      ...s,
      startTime: s.startTime.length === 5 ? `${s.startTime}:00` : s.startTime,
      endTime: s.endTime.length === 5 ? `${s.endTime}:00` : s.endTime,
      slotDurationMinutes: Number(s.slotDurationMinutes) || 30,
    }));

    await saveSchedulesMutation.mutateAsync(payload);
    setScheduleSuccessMsg("Doctor schedules saved successfully!");
    setTimeout(() => setScheduleSuccessMsg(null), 3000);
  };

  const handleCheckConflictAndSubmitException = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCheckingConflict(true);

    const dto = {
      date: exceptionForm.date,
      exceptionType: Number(exceptionForm.exceptionType),
      startTime:
        exceptionForm.exceptionType === ScheduleExceptionType.FullDayLeave
          ? undefined
          : `${exceptionForm.startTime}:00`,
      endTime:
        exceptionForm.exceptionType === ScheduleExceptionType.FullDayLeave
          ? undefined
          : `${exceptionForm.endTime}:00`,
      reason: exceptionForm.reason.trim() || undefined,
    };

    try {
      const result = await doctorApi.checkConflicts(doctor.doctorId, dto);
      setIsCheckingConflict(false);

      if (result.hasConflicts) {
        setConflictResult(result);
        setShowConflictModal(true);
      } else {
        // No conflicts, create directly
        await createExceptionMutation.mutateAsync(dto);
        setExceptionForm({
          date: new Date().toISOString().split("T")[0],
          exceptionType: ScheduleExceptionType.Unavailable,
          startTime: "10:00",
          endTime: "13:00",
          reason: "",
        });
      }
    } catch (err) {
      setIsCheckingConflict(false);
      console.error("Conflict check error:", err);
    }
  };

  const handleProceedCreateException = async () => {
    const dto = {
      date: exceptionForm.date,
      exceptionType: Number(exceptionForm.exceptionType),
      startTime:
        exceptionForm.exceptionType === ScheduleExceptionType.FullDayLeave
          ? undefined
          : `${exceptionForm.startTime}:00`,
      endTime:
        exceptionForm.exceptionType === ScheduleExceptionType.FullDayLeave
          ? undefined
          : `${exceptionForm.endTime}:00`,
      reason: exceptionForm.reason.trim() || undefined,
    };

    await createExceptionMutation.mutateAsync(dto);
    setShowConflictModal(false);
    setConflictResult(null);
    setExceptionForm({
      date: new Date().toISOString().split("T")[0],
      exceptionType: ScheduleExceptionType.Unavailable,
      startTime: "10:00",
      endTime: "13:00",
      reason: "",
    });
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="min-w-0">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Schedule & Availability Manager
            </span>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mt-0.5 truncate">
              <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="truncate">{doctor.fullName}</span>
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            title="Close (Esc)"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-white transition shadow-2xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-white dark:bg-slate-900">
          <button
            onClick={() => setActiveTab("schedules")}
            className={`py-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === "schedules"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Clock className="w-4 h-4" />
            Weekly Recurring Hours
          </button>
          <button
            onClick={() => setActiveTab("exceptions")}
            className={`py-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === "exceptions"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <CalendarX className="w-4 h-4" />
            Date Exceptions & Leaves
            {currentExceptions && currentExceptions.length > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-full font-bold">
                {currentExceptions.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === "schedules" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-indigo-50/60 dark:bg-indigo-950/30 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                <div>
                  <h4 className="text-sm font-bold text-indigo-950 dark:text-indigo-200">
                    Recurring Weekly Working Hours
                  </h4>
                  <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-0.5">
                    Configure multiple sessions per day (e.g. morning and
                    afternoon clinics).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleApplyStandardWeekdays}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 rounded-lg text-xs font-semibold shadow-xs transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Apply Standard Mon–Fri (9-12, 14-17)
                </button>
              </div>

              {scheduleSuccessMsg && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-sm font-medium">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  {scheduleSuccessMsg}
                </div>
              )}

              {isLoadingSchedules ? (
                <div className="p-8 text-center text-slate-500">
                  Loading doctor schedules...
                </div>
              ) : (
                <div className="space-y-4">
                  {DAYS_OF_WEEK.map((day) => {
                    const daySessions = schedulesList.filter(
                      (s) => s.dayOfWeek === day.value,
                    );

                    return (
                      <div
                        key={day.value}
                        className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                          <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                            {day.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddSession(day.value)}
                            className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add Session
                          </button>
                        </div>

                        {daySessions.length === 0 ? (
                          <div className="text-xs text-slate-400 italic">
                            No consultation sessions scheduled (Doctor off-duty)
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {schedulesList.map((s, idx) => {
                              if (s.dayOfWeek !== day.value) return null;

                              return (
                                <div
                                  key={idx}
                                  className="flex flex-wrap items-center gap-3 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700 text-xs"
                                >
                                  <div className="flex-1 min-w-[130px]">
                                    <label className="block text-[10px] text-slate-500 mb-0.5">
                                      Session Name
                                    </label>
                                    <input
                                      type="text"
                                      value={s.sessionName || ""}
                                      onChange={(e) =>
                                        handleUpdateSession(
                                          idx,
                                          "sessionName",
                                          e.target.value,
                                        )
                                      }
                                      placeholder="e.g. Morning Clinic"
                                      className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-xs focus:outline-indigo-600"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[10px] text-slate-500 mb-0.5">
                                      Start Time
                                    </label>
                                    <input
                                      type="time"
                                      value={s.startTime}
                                      onChange={(e) =>
                                        handleUpdateSession(
                                          idx,
                                          "startTime",
                                          e.target.value,
                                        )
                                      }
                                      className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-xs focus:outline-indigo-600"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[10px] text-slate-500 mb-0.5">
                                      End Time
                                    </label>
                                    <input
                                      type="time"
                                      value={s.endTime}
                                      onChange={(e) =>
                                        handleUpdateSession(
                                          idx,
                                          "endTime",
                                          e.target.value,
                                        )
                                      }
                                      className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-xs focus:outline-indigo-600"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[10px] text-slate-500 mb-0.5">
                                      Slot Duration
                                    </label>
                                    <select
                                      value={s.slotDurationMinutes}
                                      onChange={(e) =>
                                        handleUpdateSession(
                                          idx,
                                          "slotDurationMinutes",
                                          Number(e.target.value),
                                        )
                                      }
                                      className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-xs focus:outline-indigo-600"
                                    >
                                      <option value={15}>15 mins</option>
                                      <option value={20}>20 mins</option>
                                      <option value={30}>30 mins</option>
                                      <option value={45}>45 mins</option>
                                      <option value={60}>60 mins</option>
                                    </select>
                                  </div>

                                  <div className="pt-3.5">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSession(idx)}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                                      title="Remove session"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleSaveSchedules}
                  disabled={saveSchedulesMutation.isPending}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {saveSchedulesMutation.isPending
                    ? "Saving Schedules..."
                    : "Save Weekly Schedule"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "exceptions" && (
            <div className="space-y-6">
              {/* Add Exception Form */}
              <form
                onSubmit={handleCheckConflictAndSubmitException}
                className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4"
              >
                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Add Schedule Exception, Leave, or Overtime
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                      Exception Date
                    </label>
                    <input
                      type="date"
                      required
                      value={exceptionForm.date}
                      onChange={(e) =>
                        setExceptionForm({
                          ...exceptionForm,
                          date: e.target.value,
                        })
                      }
                      className="w-full px-2.5 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-xs focus:outline-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                      Exception Type
                    </label>
                    <select
                      value={exceptionForm.exceptionType}
                      onChange={(e) =>
                        setExceptionForm({
                          ...exceptionForm,
                          exceptionType: Number(e.target.value),
                        })
                      }
                      className="w-full px-2.5 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-xs focus:outline-indigo-600"
                    >
                      <option value={ScheduleExceptionType.Unavailable}>
                        Unavailable Block (Partial)
                      </option>
                      <option value={ScheduleExceptionType.FullDayLeave}>
                        Full-Day Leave
                      </option>
                      <option value={ScheduleExceptionType.ExtraWorkingHours}>
                        Extra Working Hours (Overtime)
                      </option>
                    </select>
                  </div>

                  {exceptionForm.exceptionType !==
                    ScheduleExceptionType.FullDayLeave && (
                    <>
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                          Start Time
                        </label>
                        <input
                          type="time"
                          required
                          value={exceptionForm.startTime}
                          onChange={(e) =>
                            setExceptionForm({
                              ...exceptionForm,
                              startTime: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-xs focus:outline-indigo-600"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                          End Time
                        </label>
                        <input
                          type="time"
                          required
                          value={exceptionForm.endTime}
                          onChange={(e) =>
                            setExceptionForm({
                              ...exceptionForm,
                              endTime: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-xs focus:outline-indigo-600"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1 text-xs">
                    Reason / Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Medical Conference, Hospital Meeting, Emergency Procedure"
                    value={exceptionForm.reason}
                    onChange={(e) =>
                      setExceptionForm({
                        ...exceptionForm,
                        reason: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-xs focus:outline-indigo-600"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={
                      isCheckingConflict || createExceptionMutation.isPending
                    }
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {isCheckingConflict
                      ? "Checking Conflicts..."
                      : "Add Schedule Exception"}
                  </button>
                </div>
              </form>

              {/* Active Exceptions List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Active Exceptions & Overrides
                </h4>

                {isLoadingExceptions ? (
                  <div className="p-4 text-center text-slate-500 text-xs">
                    Loading exceptions...
                  </div>
                ) : !currentExceptions || currentExceptions.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                    No date exceptions configured for this doctor.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    {currentExceptions.map((ex) => {
                      let typeLabel = "Unavailable";
                      let badgeColor =
                        "bg-amber-50 text-amber-700 border-amber-200";

                      if (
                        ex.exceptionType === ScheduleExceptionType.FullDayLeave
                      ) {
                        typeLabel = "Full-Day Leave";
                        badgeColor = "bg-rose-50 text-rose-700 border-rose-200";
                      } else if (
                        ex.exceptionType ===
                        ScheduleExceptionType.ExtraWorkingHours
                      ) {
                        typeLabel = "Extra Working Hours";
                        badgeColor =
                          "bg-emerald-50 text-emerald-700 border-emerald-200";
                      }

                      return (
                        <div
                          key={ex.exceptionId}
                          className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-800 text-xs hover:bg-slate-50/50 transition"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${badgeColor}`}
                              >
                                {typeLabel}
                              </span>
                              <span className="font-semibold text-slate-800 dark:text-slate-100">
                                {ex.date}
                              </span>
                              {ex.startTime && ex.endTime && (
                                <span className="text-slate-500 font-mono">
                                  ({ex.startTime.substring(0, 5)} -{" "}
                                  {ex.endTime.substring(0, 5)})
                                </span>
                              )}
                            </div>
                            {ex.reason && (
                              <div className="text-slate-500 dark:text-slate-400">
                                Reason: {ex.reason}
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              deleteExceptionMutation.mutate(ex.exceptionId)
                            }
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete exception"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Conflict Warning Modal */}
      {showConflictModal && conflictResult && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-60 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-950/60 text-amber-600 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Conflicting Patient Appointments Detected
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  The following {conflictResult.conflictCount} patient
                  appointment(s) are already scheduled during this proposed
                  exception window:
                </p>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl">
              {conflictResult.conflictingAppointments.map((appt) => (
                <div key={appt.appointmentId} className="p-3 text-xs space-y-1">
                  <div className="flex justify-between font-semibold text-slate-800 dark:text-slate-100">
                    <span>{appt.patientName}</span>
                    <span className="font-mono text-indigo-600">
                      {appt.timeSlot.substring(0, 5)}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    MRN: {appt.medicalRecordNumber} · Status: {appt.status} ·{" "}
                    {appt.reason}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300">
              <strong>Notice:</strong> In accordance with hospital policy,
              appointments will <strong>not</strong> be silently deleted. Staff
              must contact and reschedule these patients.
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConflictModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              >
                Cancel & Review
              </button>
              <button
                type="button"
                onClick={handleProceedCreateException}
                className="px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-xs transition"
              >
                Proceed & Save Exception
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
