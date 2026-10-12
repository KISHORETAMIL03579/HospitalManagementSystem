import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { doctorApi } from "../api/doctorApi";
import { CreateDoctorRequest } from "../types/doctor.types";

export const useDoctors = (departmentId?: number) => {
  return useQuery({
    queryKey: ["doctors", departmentId],
    queryFn: () => doctorApi.getDoctors(departmentId),
  });
};

export const useDepartments = () => {
  return useQuery({
    queryKey: ["departments"],
    queryFn: () => doctorApi.getDepartments(),
  });
};

export const useCreateDoctor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDoctorRequest) => doctorApi.createDoctor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      queryClient.invalidateQueries({ queryKey: ["doctorDirectory"] });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
};

export const useDoctorDirectory = (
  departmentId?: number,
  search?: string,
  date?: string,
) => {
  return useQuery({
    queryKey: ["doctorDirectory", departmentId, search, date],
    queryFn: () => doctorApi.getDoctorDirectory(departmentId, search, date),
  });
};

export const useDoctorAvailability = (doctorId?: number, date?: string) => {
  return useQuery({
    queryKey: ["doctorAvailability", doctorId, date],
    queryFn: () =>
      doctorId ? doctorApi.getDoctorAvailability(doctorId, date) : null,
    enabled: !!doctorId,
  });
};

export const useDoctorSchedules = (doctorId?: number) => {
  return useQuery({
    queryKey: ["doctorSchedules", doctorId],
    queryFn: () => (doctorId ? doctorApi.getDoctorSchedules(doctorId) : []),
    enabled: !!doctorId,
  });
};

export const useSaveDoctorSchedules = (doctorId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (schedules: any[]) =>
      doctorApi.saveDoctorSchedules(doctorId, schedules),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["doctorSchedules", doctorId],
      });
      queryClient.invalidateQueries({
        queryKey: ["doctorAvailability", doctorId],
      });
      queryClient.invalidateQueries({ queryKey: ["doctorDirectory"] });
    },
  });
};

export const useDoctorExceptions = (
  doctorId?: number,
  fromDate?: string,
  toDate?: string,
) => {
  return useQuery({
    queryKey: ["doctorExceptions", doctorId, fromDate, toDate],
    queryFn: () =>
      doctorId ? doctorApi.getDoctorExceptions(doctorId, fromDate, toDate) : [],
    enabled: !!doctorId,
  });
};

export const useCreateDoctorException = (doctorId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => doctorApi.createDoctorException(doctorId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["doctorExceptions", doctorId],
      });
      queryClient.invalidateQueries({
        queryKey: ["doctorAvailability", doctorId],
      });
      queryClient.invalidateQueries({ queryKey: ["doctorDirectory"] });
    },
  });
};

export const useDeleteDoctorException = (doctorId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (exceptionId: number) =>
      doctorApi.deleteDoctorException(doctorId, exceptionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["doctorExceptions", doctorId],
      });
      queryClient.invalidateQueries({
        queryKey: ["doctorAvailability", doctorId],
      });
      queryClient.invalidateQueries({ queryKey: ["doctorDirectory"] });
    },
  });
};
