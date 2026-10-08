import { useQuery } from "@tanstack/react-query";
import { patientApi } from "../api/patientApi";

export function usePatients(search?: string, page = 1, pageSize = 10) {
  return useQuery({
    queryKey: ["patients", { search, page, pageSize }],
    queryFn: () => patientApi.getPatients(search, page, pageSize),
  });
}
