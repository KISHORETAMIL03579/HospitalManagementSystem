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
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
};
