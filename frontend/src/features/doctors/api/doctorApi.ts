import { apiClient } from "../../../lib/axios";
import {
  DepartmentDto,
  DoctorDto,
  CreateDoctorRequest,
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

  getDoctorById: async (id: number): Promise<DoctorDto> => {
    const response = await apiClient.get<DoctorDto>(`/doctors/${id}`);
    return response.data;
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
