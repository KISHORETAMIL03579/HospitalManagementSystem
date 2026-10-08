import { apiClient } from "../../../lib/axios";
import {
  AppointmentDto,
  CreateAppointmentRequest,
  UpdateAppointmentStatusRequest,
} from "../types/appointment.types";

export const appointmentApi = {
  getAppointments: async (
    patientId?: number,
    doctorId?: number,
    date?: string,
  ): Promise<AppointmentDto[]> => {
    const params = new URLSearchParams();
    if (patientId) params.append("patientId", patientId.toString());
    if (doctorId) params.append("doctorId", doctorId.toString());
    if (date) params.append("date", date);

    const response = await apiClient.get<AppointmentDto[]>(
      `/appointments?${params.toString()}`,
    );
    return response.data;
  },

  getAppointmentById: async (id: number): Promise<AppointmentDto> => {
    const response = await apiClient.get<AppointmentDto>(`/appointments/${id}`);
    return response.data;
  },

  createAppointment: async (
    data: CreateAppointmentRequest,
  ): Promise<AppointmentDto> => {
    const response = await apiClient.post<AppointmentDto>(
      "/appointments",
      data,
    );
    return response.data;
  },

  updateStatus: async (
    id: number,
    data: UpdateAppointmentStatusRequest,
  ): Promise<void> => {
    await apiClient.put(`/appointments/${id}/status`, data);
  },
};
