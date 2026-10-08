export enum Gender {
  Male = 1,
  Female = 2,
  Other = 3,
  Unspecified = 4,
}

export interface PatientDto {
  patientId: number;
  medicalRecordNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
  email?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreatePatientRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
  email?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface PatientListResponse {
  items: PatientDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

