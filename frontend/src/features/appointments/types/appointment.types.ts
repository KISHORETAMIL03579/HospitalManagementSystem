export enum AppointmentStatus {
  Scheduled = 0,
  Confirmed = 1,
  Completed = 2,
  Cancelled = 3,
  NoShow = 4,
}

export interface AppointmentDto {
  appointmentId: number;
  patientId: number;
  patientName: string;
  medicalRecordNumber: string;
  doctorId: number;
  doctorName: string;
  specialization: string;
  appointmentDate: string;
  timeSlot: string;
  status: AppointmentStatus;
  statusName: string;
  reason: string;
  notes?: string;
  createdAt: string;
}

export interface CreateAppointmentRequest {
  patientId: number;
  doctorId: number;
  appointmentDate: string;
  timeSlot: string;
  reason: string;
  notes?: string;
}

export interface UpdateAppointmentStatusRequest {
  status: AppointmentStatus;
  notes?: string;
}
