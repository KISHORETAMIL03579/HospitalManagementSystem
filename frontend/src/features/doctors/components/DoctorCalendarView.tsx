import React, { useState, useMemo } from "react";
import { useDoctorAvailability } from "../hooks/useDoctors";
import { TimeSlotDto } from "../types/doctor.types";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle,
  CalendarX,
  Sparkles,
} from "lucide-react";

interface DoctorCalendarViewProps {
  doctorId: number;
  doctorName?: string;
  onSelectSlot?: (slot: TimeSlotDto, date: string) => void;
  selectedSlotTime?: string;
}

export const DoctorCalendarView: React.FC<DoctorCalendarViewProps> = ({
  doctorId,
  doctorName,
  onSelectSlot,
  selectedSlotTime,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });

  const { data: availability, isLoading } = useDoctorAvailability(
    doctorId,
    selectedDate,
  );

  // Generate 7 upcoming days for the quick date picker
  const upcomingDays = useMemo(() => {
    const days = [];
    const baseDate = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const iso = d.toISOString().split("T")[0];
      const isToday = i === 0;
      const dayName = isToday
        ? "Today"
        : d.toLocaleDateString("en-US", { weekday: "short" });
      const dayNum = d.getDate();
      const monthName = d.toLocaleDateString("en-US", { month: "short" });
      days.push({ iso, dayName, dayNum, monthName, isToday });
    }
    return days;
  }, []);

  const handlePrevDay = () => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() - 1);
    setSelectedDate(cur.toISOString().split("T")[0]);
  };

  const handleNextDay = () => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + 1);
    setSelectedDate(cur.toISOString().split("T")[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split("T")[0]);
  };

  // Group slots by session name
  const groupedSlots = useMemo(() => {
    if (!availability?.slots) return {};
    const groups: Record<string, TimeSlotDto[]> = {};

    availability.slots.forEach((slot) => {
      const session = slot.sessionName || "Consultation Hours";
      if (!groups[session]) {
        groups[session] = [];
      }
      groups[session].push(slot);
    });

    return groups;
  }, [availability]);

  return (
    <div className="space-y-5">
      {/* Date Navigation Strip */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Select Consultation Date
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition"
            >
              Today
            </button>
            <button
              onClick={handlePrevDay}
              className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition"
              title="Previous day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextDay}
              className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition"
              title="Next day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 7-Day Quick Selection Buttons */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {upcomingDays.map((d) => {
            const isSelected = selectedDate === d.iso;
            return (
              <button
                key={d.iso}
                onClick={() => setSelectedDate(d.iso)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl text-center transition-all ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600/30 font-semibold"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50/30"
                }`}
              >
                <span
                  className={`text-[11px] ${isSelected ? "text-indigo-100" : "text-slate-400 dark:text-slate-400"}`}
                >
                  {d.dayName}
                </span>
                <span className="text-sm font-bold mt-0.5">{d.dayNum}</span>
                <span
                  className={`text-[10px] ${isSelected ? "text-indigo-200" : "text-slate-400"}`}
                >
                  {d.monthName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Date Summary / Status Banner */}
      {isLoading ? (
        <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
          Loading availability slots...
        </div>
      ) : availability ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Schedule for
              </div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                  "en-US",
                  {
                    weekday: "long",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  },
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium">
                <CheckCircle className="w-3.5 h-3.5" />
                {availability.bookableSlotsCount} Available
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                <Clock className="w-3.5 h-3.5" />
                {availability.bookedSlotsCount} Booked
              </span>
              {availability.blockedSlotsCount > 0 && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-medium">
                  <CalendarX className="w-3.5 h-3.5" />
                  {availability.blockedSlotsCount} Blocked
                </span>
              )}
            </div>
          </div>

          {/* Full day leave warning */}
          {availability.availabilityStatus === "On leave" && (
            <div className="flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-800 dark:text-rose-300">
              <CalendarX className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <div className="font-semibold text-sm">Doctor is on Leave</div>
                <div className="text-xs mt-0.5 opacity-90">
                  {availability.statusMessage ||
                    "Doctor is not taking consultations on this date."}
                </div>
              </div>
            </div>
          )}

          {/* No slots scheduled */}
          {availability.availabilityStatus === "Unavailable" && (
            <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300">
              <AlertCircle className="w-5 h-5 shrink-0 text-slate-400 mt-0.5" />
              <div>
                <div className="font-semibold text-sm">
                  No Scheduled Sessions
                </div>
                <div className="text-xs mt-0.5 text-slate-500 dark:text-slate-400">
                  {doctorName || "This doctor"} does not have consultation hours
                  configured for this day.
                </div>
              </div>
            </div>
          )}

          {/* Fully booked warning */}
          {availability.availabilityStatus === "Fully booked" && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <div className="font-semibold text-sm">
                  Fully Booked for Selected Date
                </div>
                <div className="text-xs mt-0.5 opacity-90">
                  All consultation slots for this date have been booked or
                  blocked. Please select another date.
                </div>
              </div>
            </div>
          )}

          {/* Sessions & Time Slot Grids */}
          {Object.keys(groupedSlots).length > 0 && (
            <div className="space-y-4">
              {Object.entries(groupedSlots).map(([sessionName, slots]) => (
                <div
                  key={sessionName}
                  className="bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      {sessionName}
                    </h4>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {slots.filter((s) => s.isBookable).length} of{" "}
                      {slots.length} slots open
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                    {slots.map((slot) => {
                      const isSelected = selectedSlotTime === slot.startTime;
                      let slotStyle =
                        "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 cursor-pointer";
                      let badge = null;

                      if (isSelected) {
                        slotStyle =
                          "bg-indigo-600 text-white border-indigo-600 shadow-sm cursor-pointer";
                      } else if (slot.status === "Booked") {
                        slotStyle =
                          "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60";
                        badge = (
                          <span className="text-[10px] font-medium text-slate-400 bg-slate-200/60 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                            Booked
                          </span>
                        );
                      } else if (slot.status === "Blocked") {
                        slotStyle =
                          "bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 cursor-not-allowed opacity-75";
                        badge = (
                          <span className="text-[10px] font-medium text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/40 px-1.5 py-0.5 rounded truncate max-w-[90px]">
                            {slot.blockReason || "Blocked"}
                          </span>
                        );
                      } else if (slot.status === "Past") {
                        slotStyle =
                          "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/40 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-40";
                        badge = (
                          <span className="text-[10px] font-medium text-slate-400">
                            Past
                          </span>
                        );
                      } else {
                        // Available
                        slotStyle =
                          "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100/70 hover:border-emerald-400 cursor-pointer shadow-xs";
                        badge = (
                          <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                            Available
                          </span>
                        );
                      }

                      return (
                        <button
                          key={slot.startTime}
                          type="button"
                          disabled={!slot.isBookable}
                          onClick={() => {
                            if (slot.isBookable && onSelectSlot) {
                              onSelectSlot(slot, selectedDate);
                            }
                          }}
                          className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${slotStyle}`}
                        >
                          <span className="text-xs font-semibold tracking-tight">
                            {slot.formattedTime.split(" - ")[0]}
                          </span>
                          <span className="text-[10px] opacity-75 mt-0.5">
                            until {slot.formattedTime.split(" - ")[1]}
                          </span>
                          {badge && <div className="mt-1">{badge}</div>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
