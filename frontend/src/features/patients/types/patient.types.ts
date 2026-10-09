export enum Gender {
  Male = 1,
  Female = 2,
  Other = 3,
  Unspecified = 4,
}

export enum BloodGroup {
  Unknown = 0,
  APositive = 1,
  ANegative = 2,
  BPositive = 3,
  BNegative = 4,
  ABPositive = 5,
  ABNegative = 6,
  OPositive = 7,
  ONegative = 8,
}

export interface PatientDto {
  patientId: number;
  medicalRecordNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth: string;
  gender: Gender;
  bloodGroup?: BloodGroup | string;
  phone: string;
  email?: string;
  address?: string;
  medicalHistory?: string;
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
  bloodGroup?: BloodGroup | number;
  phone: string;
  email?: string;
  address?: string;
  medicalHistory?: string;
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
