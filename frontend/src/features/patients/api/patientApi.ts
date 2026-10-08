import { apiClient } from "../../../lib/axios";
import {
  CreatePatientRequest,
  PatientDto,
  PatientListResponse,
} from "../types/patient.types";

export const patientApi = {
  getPatients: async (
    search?: string,
    page = 1,
    pageSize = 10,
  ): Promise<PatientListResponse> => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());

    const response = await apiClient.get<PatientListResponse>(
      `/patients?${params.toString()}`,
    );
    return response.data;
  },

  getPatientById: async (id: number): Promise<PatientDto> => {
    const response = await apiClient.get<PatientDto>(`/patients/${id}`);
    return response.data;
  },

  createPatient: async (data: CreatePatientRequest): Promise<PatientDto> => {
    const response = await apiClient.post<PatientDto>("/patients", data);
    return response.data;
  },
};
