import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patientApi } from "../api/patientApi";
import { CreatePatientRequest } from "../types/patient.types";

export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePatientRequest) => patientApi.createPatient(data),
    onSuccess: () => {
      // Automatic TanStack query cache invalidation to update table view instantly
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
}
