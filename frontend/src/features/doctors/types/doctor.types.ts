export interface DepartmentDto {
  departmentId: number;
  name: string;
  code: string;
  description?: string;
  doctorCount: number;
}

export interface DoctorDto {
  doctorId: number;
  userId?: number;
  departmentId: number;
  departmentName: string;
  licenseNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  specialization: string;
  consultationFee: number;
  phone: string;
  email?: string;
  availableDays?: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface CreateDoctorRequest {
  departmentId: number;
  licenseNumber: string;
  firstName: string;
  lastName: string;
  specialization: string;
  consultationFee: number;
  phone: string;
  email?: string;
  availableDays?: string;
  startTime?: string;
  endTime?: string;
}

export interface TimeSlotDto {
  startTime: string;
  endTime: string;
  formattedTime: string;
  isBookable: boolean;
  status: "Available" | "Booked" | "Blocked" | "Break" | "Past";
  sessionName?: string;
  blockReason?: string;
}

export interface DoctorAvailabilityDto {
  doctorId: number;
  doctorName: string;
  specialization: string;
  departmentName: string;
  consultationFee: number;
  date: string;
  timeZone: string;
  availabilityStatus: string;
  statusMessage: string;
  nextAvailableSlot?: string;
  totalSlotsCount: number;
  bookableSlotsCount: number;
  bookedSlotsCount: number;
  blockedSlotsCount: number;
  slots: TimeSlotDto[];
}

export interface DoctorDirectoryItemDto {
  doctorId: number;
  fullName: string;
  specialization: string;
  departmentId: number;
  departmentName: string;
  licenseNumber: string;
  consultationFee: number;
  phone: string;
  email?: string;
  yearsOfExperience: number;
  rating: number;
  reviewCount: number;
  languages: string;
  biography: string;
  availabilityStatus: string;
  statusBadge: string;
  nextAvailableSlotText?: string;
  nextAvailableDate?: string;
  nextAvailableTime?: string;
  isActive: boolean;
}

export interface DoctorScheduleDto {
  scheduleId: number;
  doctorId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  sessionName?: string;
  isActive: boolean;
}

export interface SaveDoctorScheduleDto {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  sessionName?: string;
}

export enum ScheduleExceptionType {
  Unavailable = 1,
  FullDayLeave = 2,
  ExtraWorkingHours = 3,
}

export interface DoctorScheduleExceptionDto {
  exceptionId: number;
  doctorId: number;
  date: string;
  startTime?: string;
  endTime?: string;
  exceptionType: ScheduleExceptionType;
  reason?: string;
  createdAt: string;
}

export interface CreateDoctorScheduleExceptionDto {
  date: string;
  startTime?: string;
  endTime?: string;
  exceptionType: ScheduleExceptionType;
  reason?: string;
}

export interface ConflictingAppointmentDto {
  appointmentId: number;
  patientName: string;
  medicalRecordNumber: string;
  appointmentDate: string;
  timeSlot: string;
  status: string;
  reason: string;
}

export interface ConflictCheckResultDto {
  hasConflicts: boolean;
  conflictCount: number;
  conflictingAppointments: ConflictingAppointmentDto[];
  message: string;
}
