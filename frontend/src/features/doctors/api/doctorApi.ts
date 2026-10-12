import { apiClient } from "../../../lib/axios";
import {
  DepartmentDto,
  DoctorDto,
  CreateDoctorRequest,
  DoctorDirectoryItemDto,
  DoctorAvailabilityDto,
  DoctorScheduleDto,
  SaveDoctorScheduleDto,
  DoctorScheduleExceptionDto,
  CreateDoctorScheduleExceptionDto,
  ConflictCheckResultDto,
} from "../types/doctor.types";

export const doctorApi = {
  getDoctors: async (departmentId?: number): Promise<DoctorDto[]> => {
    const params = new URLSearchParams();
    if (departmentId) params.append("departmentId", departmentId.toString());

    const response = await apiClient.get<DoctorDto[]>(
      `/doctors?${params.toString()}`,
    );
    return response.data;
  },

  getDoctorDirectory: async (
    departmentId?: number,
    search?: string,
    date?: string,
  ): Promise<DoctorDirectoryItemDto[]> => {
    const params = new URLSearchParams();
    if (departmentId) params.append("departmentId", departmentId.toString());
    if (search) params.append("search", search);
    if (date) params.append("date", date);

    const response = await apiClient.get<DoctorDirectoryItemDto[]>(
      `/doctors/directory?${params.toString()}`,
    );
    return response.data;
  },

  getDoctorById: async (id: number): Promise<DoctorDto> => {
    const response = await apiClient.get<DoctorDto>(`/doctors/${id}`);
    return response.data;
  },

  getDoctorAvailability: async (
    id: number,
    date?: string,
  ): Promise<DoctorAvailabilityDto> => {
    const params = new URLSearchParams();
    if (date) params.append("date", date);

    const response = await apiClient.get<DoctorAvailabilityDto>(
      `/doctors/${id}/availability?${params.toString()}`,
    );
    return response.data;
  },

  getDoctorSchedules: async (id: number): Promise<DoctorScheduleDto[]> => {
    const response = await apiClient.get<DoctorScheduleDto[]>(
      `/doctors/${id}/schedules`,
    );
    return response.data;
  },

  saveDoctorSchedules: async (
    id: number,
    schedules: SaveDoctorScheduleDto[],
  ): Promise<DoctorScheduleDto[]> => {
    const response = await apiClient.put<DoctorScheduleDto[]>(
      `/doctors/${id}/schedules`,
      schedules,
    );
    return response.data;
  },

  getDoctorExceptions: async (
    id: number,
    fromDate?: string,
    toDate?: string,
  ): Promise<DoctorScheduleExceptionDto[]> => {
    const params = new URLSearchParams();
    if (fromDate) params.append("fromDate", fromDate);
    if (toDate) params.append("toDate", toDate);

    const response = await apiClient.get<DoctorScheduleExceptionDto[]>(
      `/doctors/${id}/schedule-exceptions?${params.toString()}`,
    );
    return response.data;
  },

  checkConflicts: async (
    id: number,
    dto: CreateDoctorScheduleExceptionDto,
  ): Promise<ConflictCheckResultDto> => {
    const response = await apiClient.post<ConflictCheckResultDto>(
      `/doctors/${id}/schedule-exceptions/check-conflicts`,
      dto,
    );
    return response.data;
  },

  createDoctorException: async (
    id: number,
    dto: CreateDoctorScheduleExceptionDto,
  ): Promise<DoctorScheduleExceptionDto> => {
    const response = await apiClient.post<DoctorScheduleExceptionDto>(
      `/doctors/${id}/schedule-exceptions`,
      dto,
    );
    return response.data;
  },

  deleteDoctorException: async (
    id: number,
    exceptionId: number,
  ): Promise<void> => {
    await apiClient.delete(`/doctors/${id}/schedule-exceptions/${exceptionId}`);
  },

  getDepartments: async (): Promise<DepartmentDto[]> => {
    const response = await apiClient.get<DepartmentDto[]>(
      "/doctors/departments",
    );
    return response.data;
  },

  createDoctor: async (data: CreateDoctorRequest): Promise<DoctorDto> => {
    const response = await apiClient.post<DoctorDto>("/doctors", data);
    return response.data;
  },
};
