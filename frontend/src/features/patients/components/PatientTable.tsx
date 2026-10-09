import React, { useState, useMemo } from "react";
import { usePatients } from "../hooks/usePatients";
import { formatDate, calculateAge } from "../../../lib/utils";
import { Gender, PatientDto } from "../types/patient.types";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Phone,
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  User,
  Mail,
  Calendar,
  ShieldAlert,
} from "lucide-react";

type SortField =
  "medicalRecordNumber" | "fullName" | "dateOfBirth" | "gender" | "createdAt";
type SortOrder = "asc" | "desc";

export const PatientTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [selectedPatient, setSelectedPatient] = useState<PatientDto | null>(
    null,
  );

  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const { data, isLoading, isError } = usePatients(searchTerm, page, pageSize);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getGenderBadge = (gender: Gender | string) => {
    const val =
      typeof gender === "number"
        ? gender
        : String(gender).toLowerCase() === "male"
          ? Gender.Male
          : String(gender).toLowerCase() === "female"
            ? Gender.Female
            : Gender.Other;

    switch (val) {
      case Gender.Male:
      case 1:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            Male
          </span>
        );
      case Gender.Female:
      case 2:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pink-50 text-pink-700 border border-pink-200">
            Female
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Other
          </span>
        );
    }
  };

  const getBloodGroupBadge = (bloodGroup?: any) => {
    if (
      !bloodGroup ||
      bloodGroup === 0 ||
      String(bloodGroup).toLowerCase() === "unknown"
    ) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-100 text-slate-500 border border-slate-200">
          N/A
        </span>
      );
    }

    const label =
      bloodGroup === 1 || String(bloodGroup).toLowerCase() === "apositive"
        ? "A+"
        : bloodGroup === 2 || String(bloodGroup).toLowerCase() === "anegative"
          ? "A-"
          : bloodGroup === 3 || String(bloodGroup).toLowerCase() === "bpositive"
            ? "B+"
            : bloodGroup === 4 ||
                String(bloodGroup).toLowerCase() === "bnegative"
              ? "B-"
              : bloodGroup === 5 ||
                  String(bloodGroup).toLowerCase() === "abpositive"
                ? "AB+"
                : bloodGroup === 6 ||
                    String(bloodGroup).toLowerCase() === "abnegative"
                  ? "AB-"
                  : bloodGroup === 7 ||
                      String(bloodGroup).toLowerCase() === "opositive"
                    ? "O+"
                    : bloodGroup === 8 ||
                        String(bloodGroup).toLowerCase() === "onegative"
                      ? "O-"
                      : String(bloodGroup);

    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
        {label}
      </span>
    );
  };

  const sortedItems = useMemo(() => {
    if (!data?.items) return [];

    return [...data.items].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === "dateOfBirth" || sortField === "createdAt") {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [data?.items, sortField, sortOrder]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by MRN, Name or Phone..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
          />
        </div>

        <div className="text-xs font-medium text-slate-500">
          {data
            ? `Showing ${sortedItems.length} of ${data.totalCount} patients`
            : "Loading patients..."}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              <th
                onClick={() => handleSort("medicalRecordNumber")}
                className={`px-6 py-3.5 cursor-pointer select-none transition ${
                  sortField === "medicalRecordNumber"
                    ? "bg-indigo-50/80 text-indigo-900 font-bold border-b-2 border-indigo-600"
                    : "hover:bg-slate-100 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span>MRN</span>
                  {sortField === "medicalRecordNumber" ? (
                    sortOrder === "asc" ? (
                      <ArrowUp className="w-4 h-4 text-indigo-600 font-bold" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-indigo-600 font-bold" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort("fullName")}
                className={`px-6 py-3.5 cursor-pointer select-none transition ${
                  sortField === "fullName"
                    ? "bg-indigo-50/80 text-indigo-900 font-bold border-b-2 border-indigo-600"
                    : "hover:bg-slate-100 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span>Patient Name</span>
                  {sortField === "fullName" ? (
                    sortOrder === "asc" ? (
                      <ArrowUp className="w-4 h-4 text-indigo-600 font-bold" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-indigo-600 font-bold" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort("dateOfBirth")}
                className={`px-6 py-3.5 cursor-pointer select-none transition ${
                  sortField === "dateOfBirth"
                    ? "bg-indigo-50/80 text-indigo-900 font-bold border-b-2 border-indigo-600"
                    : "hover:bg-slate-100 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span>DOB / Age</span>
                  {sortField === "dateOfBirth" ? (
                    sortOrder === "asc" ? (
                      <ArrowUp className="w-4 h-4 text-indigo-600 font-bold" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-indigo-600 font-bold" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort("gender")}
                className={`px-6 py-3.5 cursor-pointer select-none transition ${
                  sortField === "gender"
                    ? "bg-indigo-50/80 text-indigo-900 font-bold border-b-2 border-indigo-600"
                    : "hover:bg-slate-100 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span>Gender</span>
                  {sortField === "gender" ? (
                    sortOrder === "asc" ? (
                      <ArrowUp className="w-4 h-4 text-indigo-600 font-bold" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-indigo-600 font-bold" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                  )}
                </div>
              </th>
              <th className="px-6 py-3.5">Blood Group</th>
              <th className="px-6 py-3.5">Contact Phone</th>
              <th
                onClick={() => handleSort("createdAt")}
                className={`px-6 py-3.5 cursor-pointer select-none transition ${
                  sortField === "createdAt"
                    ? "bg-indigo-50/80 text-indigo-900 font-bold border-b-2 border-indigo-600"
                    : "hover:bg-slate-100 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span>Registered</span>
                  {sortField === "createdAt" ? (
                    sortOrder === "asc" ? (
                      <ArrowUp className="w-4 h-4 text-indigo-600 font-bold" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-indigo-600 font-bold" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-6 py-4">
                    <div className="h-4 bg-slate-200 rounded w-24" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-slate-200 rounded w-36" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-slate-200 rounded w-20" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-slate-200 rounded w-16" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-slate-200 rounded w-28" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-slate-200 rounded w-20" />
                  </td>
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-rose-500">
                  Failed to load patient directory. Please check backend
                  connection.
                </td>
              </tr>
            ) : sortedItems.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-12 text-center text-slate-400"
                >
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="font-medium text-slate-600">
                    No patients registered yet
                  </p>
                  <p className="text-xs text-slate-400">
                    Use the registration form above to create the first patient
                    record.
                  </p>
                </td>
              </tr>
            ) : (
              sortedItems.map((patient) => (
                <tr
                  key={patient.patientId}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  onClick={() => setSelectedPatient(patient)}
                >
                  <td className="px-6 py-4 font-mono text-xs font-semibold text-blue-600">
                    {patient.medicalRecordNumber}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-xs">
                        {patient.firstName[0]}
                        {patient.lastName[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">
                          {patient.fullName}
                        </div>
                        {patient.email && (
                          <div className="text-xs text-slate-400">
                            {patient.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-700">
                      {formatDate(patient.dateOfBirth)}
                    </div>
                    <div className="text-xs text-slate-400">
                      {calculateAge(patient.dateOfBirth)} yrs old
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getGenderBadge(patient.gender)}
                  </td>
                  <td className="px-6 py-4">
                    {getBloodGroupBadge(patient.bloodGroup)}
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{patient.phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {formatDate(patient.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {data && data.totalPages > 1 && (
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-sm">
          <div className="text-xs text-slate-500">
            Page {data.page} of {data.totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page >= data.totalPages}
              className="p-1.5 border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Patient Details Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-5 border border-slate-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider font-mono">
                  MRN: {selectedPatient.medicalRecordNumber}
                </span>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mt-0.5">
                  <User className="w-5 h-5 text-blue-600" />
                  {selectedPatient.fullName}
                </h2>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-600">
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                <div>
                  <span className="text-xs text-slate-400 block">Gender</span>
                  <div className="mt-1">
                    {getGenderBadge(selectedPatient.gender)}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Age</span>
                  <span className="font-semibold text-slate-800">
                    {calculateAge(selectedPatient.dateOfBirth)} yrs
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">
                    Blood Group
                  </span>
                  <div className="mt-1">
                    {getBloodGroupBadge(selectedPatient.bloodGroup)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-700">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>
                    Date of Birth: {formatDate(selectedPatient.dateOfBirth)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>Phone: {selectedPatient.phone}</span>
                </div>
                {selectedPatient.email && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>Email: {selectedPatient.email}</span>
                  </div>
                )}
              </div>

              {selectedPatient.emergencyContactName && (
                <div className="border-t border-slate-100 pt-3">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />{" "}
                    Emergency Contact
                  </div>
                  <div className="text-slate-800 font-medium">
                    {selectedPatient.emergencyContactName}
                  </div>
                  <div className="text-xs text-slate-500">
                    {selectedPatient.emergencyContactPhone}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedPatient(null)}
                className="px-4 py-2 text-xs font-medium bg-slate-800 text-white hover:bg-slate-900 rounded-lg shadow-xs"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
