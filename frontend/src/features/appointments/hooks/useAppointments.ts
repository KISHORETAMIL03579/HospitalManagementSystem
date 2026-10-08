import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appointmentApi } from "../api/appointmentApi";
import {
  CreateAppointmentRequest,
  UpdateAppointmentStatusRequest,
} from "../types/appointment.types";

export const useAppointments = (
  patientId?: number,
  doctorId?: number,
  date?: string,
) => {
  return useQuery({
    queryKey: ["appointments", patientId, doctorId, date],
    queryFn: () => appointmentApi.getAppointments(patientId, doctorId, date),
  });
};

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAppointmentRequest) =>
      appointmentApi.createAppointment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
};

export const useUpdateAppointmentStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: UpdateAppointmentStatusRequest;
    }) => appointmentApi.updateStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
};
