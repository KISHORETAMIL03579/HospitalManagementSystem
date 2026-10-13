import { useQuery } from "@tanstack/react-query";
import { patientApi } from "../api/patientApi";

export function usePatients(
  search?: string,
  page = 1,
  pageSize = 10,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ["patients", { search, page, pageSize }],
    queryFn: () => patientApi.getPatients(search, page, pageSize),
    enabled: options?.enabled ?? true,
  });
}

export function useMyPatientProfile(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["patient_my_profile"],
    queryFn: () => patientApi.getMyProfile(),
    enabled: options?.enabled ?? true,
  });
}
