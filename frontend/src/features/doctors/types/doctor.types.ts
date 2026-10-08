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
