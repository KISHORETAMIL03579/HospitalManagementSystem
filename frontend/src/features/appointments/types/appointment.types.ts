export enum AppointmentStatus {
  Pending = 0,
  Confirmed = 10,
  CheckedIn = 20,
  InConsultation = 30,
  Completed = 40,
  Cancelled = 50,
  NoShow = 60,
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
